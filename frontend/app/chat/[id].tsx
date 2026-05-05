import React, { useEffect, useState, useRef } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform, 
    SafeAreaView, 
    ActivityIndicator,
    Modal,
    Dimensions,
    Alert,
    Clipboard,
    Linking
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ChatApi from "../../src/services/chatApi";
import SocketService from "../../src/services/socketService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EmojiSelector, { Categories } from "react-native-emoji-selector";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Video, ResizeMode } from "expo-av";
import API_CONFIG from "../../src/configs/api";
import dynamic from "next/dynamic";

// Web Emoji Picker
let WebEmojiPicker: any = null;
if (Platform.OS === "web") {
    try {
        WebEmojiPicker = require("emoji-picker-react").default || require("emoji-picker-react");
    } catch (e) {
        console.warn("emoji-picker-react not loaded", e);
    }
}

const { width } = Dimensions.get("window");

const ChatDetailScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const conversationId = params.id as string;
    const conversationName = params.conversationName as string;
    const avatar = params.avatar as string;

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const userIdRef = useRef<string | null>(null); // stable ref for use in socket callbacks
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [fullScreenMedia, setFullScreenMedia] = useState<any | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
    const [showMessageActions, setShowMessageActions] = useState(false);
    const [pendingMedia, setPendingMedia] = useState<any[]>([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [conversation, setConversation] = useState<any>(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const fetchUserId = async () => {
            const userData = await AsyncStorage.getItem("user_data");
            if (userData) {
                const parsed = JSON.parse(userData);
                const id = parsed.user_id || parsed.id;
                setUserId(id);
                userIdRef.current = id; // keep ref in sync
            }
        };
        fetchUserId();
    }, []);

    // Load message history and conversation details
    useEffect(() => {
        if (!conversationId) {
            console.warn("[ChatDetail] No conversationId provided");
            return;
        }
        const loadData = async () => {
            try {
                console.log("[ChatDetail] Fetching data for:", conversationId);
                const [msgData, convDetails] = await Promise.all([
                    ChatApi.getMessages(conversationId),
                    ChatApi.getConversationDetails(conversationId)
                ]);
                
                setMessages(msgData.messages || []);
                setConversation(convDetails);
            } catch (error) {
                console.error("[ChatDetail] Failed to load data:", error);
            }
        };
        loadData();
    }, [conversationId]);

    // Socket connection & real-time listener lifecycle
    // Only depends on conversationId — userId comes from the stable ref, not state
    useEffect(() => {
        if (!conversationId) return;

        let isMounted = true;

        const handleNewMessage = (message: any) => {
            console.log("[ChatDetail] new_message received:", message);
            if (!isMounted) return;
            // Filter: only show messages belonging to this conversation
            if (message.conversationId && message.conversationId !== conversationId) return;
            setMessages((prev) => {
                // Deduplicate by messageId
                if (prev.some((m) => m.messageId === message.messageId)) return prev;
                return [message, ...prev];
            });
            // Auto-mark as read for messages from others
            if (message.senderId && message.senderId !== userIdRef.current) {
                ChatApi.markMessagesAsRead(conversationId, [message.messageId]).catch(() => {});
            }
        };

        const handleMessageDeletedForMe = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) => prev.filter((m) => m.messageId !== data.messageId));
            }
        };

        const handleMessageDeletedForEveryone = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) => 
                    prev.map((m) => m.messageId === data.messageId ? { ...m, deletedForEveryone: true, content: "" } : m)
                );
            }
        };

        const handleMessageRecalled = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) => 
                    prev.map((m) => m.messageId === data.messageId ? { ...m, isRecalled: true, content: "" } : m)
                );
            }
        };

        const handleGroupDissolved = (data: any) => {
            if (data.conversationId === conversationId) {
                Alert.alert("Thông báo", "Nhóm này đã bị giải tán bởi trưởng nhóm.");
                router.replace("/(tabs)/chat");
            }
        };

        const initSocket = async () => {
            console.log("[ChatDetail] Connecting socket and joining room:", conversationId);
            await SocketService.connect();
            if (!isMounted) return;
            SocketService.joinConversation(conversationId);
            SocketService.on("new_message", handleNewMessage);
            SocketService.on("message_deleted_for_me", handleMessageDeletedForMe);
            SocketService.on("message_deleted_for_everyone", handleMessageDeletedForEveryone);
            SocketService.on("message_recalled", handleMessageRecalled);
            SocketService.on("group_dissolved", handleGroupDissolved);

            console.log("[ChatDetail] Socket listener registered for events");
        };

        initSocket();

        return () => {
            isMounted = false;
            console.log("[ChatDetail] Cleanup: leaving room and removing listeners");
            SocketService.leaveConversation(conversationId);
            SocketService.off("new_message", handleNewMessage);
            SocketService.off("message_deleted_for_me", handleMessageDeletedForMe);
            SocketService.off("message_deleted_for_everyone", handleMessageDeletedForEveryone);
            SocketService.off("message_recalled", handleMessageRecalled);
            SocketService.off("group_dissolved", handleGroupDissolved);
        };
    }, [conversationId]); // ← removed userId from deps: use userIdRef.current inside instead

    const handleSend = async (content = inputText, type = "text", attachments: any[] = [], metadata = {}) => {
        if (!content.trim() && attachments.length === 0) return;

        const messageContent = content.trim();
        if (type === "text") setInputText("");

        try {
            await ChatApi.sendMessage(conversationId, messageContent, type, { 
                ...metadata,
                attachments 
            });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const pickImage = async () => {
        setShowAttachmentMenu(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            setPendingMedia(result.assets);
            setShowPreviewModal(true);
        }
    };

    const takePhoto = async () => {
        setShowAttachmentMenu(false);
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("Permission to access camera is required!");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 1,
        });

        if (!result.canceled) {
            uploadFile(result.assets[0]);
        }
    };

    const pickDocument = async () => {
        setShowAttachmentMenu(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                uploadFile(result.assets[0]);
            }
        } catch (err) {
            console.error("Document picking error:", err);
        }
    };

    const uploadFiles = async () => {
        if (pendingMedia.length === 0) return;
        
        setShowPreviewModal(false);
        setIsUploading(true);
        
        try {
            const uploadedAttachments = [];
            
            for (const asset of pendingMedia) {
                const formData = new FormData();
                const fileName = asset.name || asset.fileName || `upload_${Date.now()}`;
                const fileType = asset.mimeType || asset.type || "application/octet-stream";
                
                formData.append("file", {
                    uri: asset.uri,
                    name: fileName,
                    type: fileType,
                } as any);

                const uploadData = await ChatApi.uploadFile(formData);
                uploadedAttachments.push({
                    ...uploadData,
                    type: fileType.startsWith("image") ? "image" : fileType.startsWith("video") ? "video" : "file"
                });
            }
            
            // Determine combined message type
            const hasVideo = uploadedAttachments.some(a => a.type === "video");
            const hasImage = uploadedAttachments.some(a => a.type === "image");
            let msgType = "file";
            if (hasVideo) msgType = "video";
            else if (hasImage) msgType = "image";

            await handleSend("", msgType, uploadedAttachments);
            setPendingMedia([]);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload one or more files");
        } finally {
            setIsUploading(false);
        }
    };

    const uploadFile = async (fileAsset: any) => {
        setPendingMedia([fileAsset]);
        setShowPreviewModal(true);
    };

    const handleMessageLongPress = (message: any) => {
        console.log("[Chat] Long press triggered on message:", message.messageId);
        if (message.isRecalled || message.deletedForEveryone) {
            console.log("[Chat] Skipping long press for recalled/deleted message");
            return;
        }
        setSelectedMessage(message);
        setShowMessageActions(true);
        console.log("[Chat] showMessageActions set to true");
    };

    const handleMessageAction = async (action: string) => {
        console.log("[Chat] Action selected:", action, "for message:", selectedMessage?.messageId);
        if (!selectedMessage) return;
        setShowMessageActions(false);

        try {
            switch (action) {
                case "delete_me":
                    await ChatApi.deleteMessage(conversationId, selectedMessage.messageId, false);
                    setMessages((prev) => prev.filter((m) => m.messageId !== selectedMessage.messageId));
                    break;
                case "delete_everyone":
                    await ChatApi.deleteMessage(conversationId, selectedMessage.messageId, true);
                    // Socket will handle update, but let's update locally for immediate feedback
                    setMessages((prev) => 
                        prev.map((m) => m.messageId === selectedMessage.messageId ? { ...m, deletedForEveryone: true, content: "" } : m)
                    );
                    break;
                case "recall":
                    await ChatApi.recallMessage(selectedMessage.messageId, conversationId);
                    setMessages((prev) => 
                        prev.map((m) => m.messageId === selectedMessage.messageId ? { ...m, isRecalled: true, content: "" } : m)
                    );
                    break;
                case "copy":
                    Clipboard.setString(selectedMessage.content || "");
                    break;
                case "forward":
                    const convData = await ChatApi.getConversations();
                    setConversations(convData.conversations || []);
                    setShowForwardModal(true);
                    break;
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể thực hiện hành động");
        } finally {
            setSelectedMessage(null);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMyMessage = item.senderId === userId;
        const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const renderAttachment = () => {
            const attachments = item.metadata?.attachments || item.attachments || [];
            if (attachments.length === 0) return null;

            return (
                <View style={styles.attachmentsGrid}>
                    {attachments.map((attachment: any, index: number) => {
                        const fullUrl = `${API_CONFIG.BASE_URL}${attachment.url}`;
                        const type = attachment.type || (attachment.mimetype?.startsWith("image") ? "image" : attachment.mimetype?.startsWith("video") ? "video" : "file");

                        if (type === "image") {
                            return (
                                <TouchableOpacity 
                                    key={index}
                                    onPress={() => setFullScreenMedia({ type: "image", url: fullUrl })}
                                    onLongPress={() => handleMessageLongPress(item)}
                                    delayLongPress={300}
                                    style={attachments.length > 1 ? styles.gridItem : null}
                                >
                                    <Image 
                                        source={{ uri: fullUrl }} 
                                        style={attachments.length > 1 ? styles.gridImage : styles.messageImage} 
                                        resizeMode="cover" 
                                    />
                                </TouchableOpacity>
                            );
                        }

                        if (type === "video") {
                            return (
                                <TouchableOpacity 
                                    key={index}
                                    style={[styles.videoContainer, attachments.length > 1 && styles.gridItem]}
                                    onPress={() => setFullScreenMedia({ type: "video", url: fullUrl })}
                                    onLongPress={() => handleMessageLongPress(item)}
                                    delayLongPress={300}
                                >
                                    <Video
                                        source={{ uri: fullUrl }}
                                        style={styles.messageVideo}
                                        resizeMode={ResizeMode.COVER}
                                        shouldPlay={false}
                                    />
                                    <View style={styles.videoPlayOverlay}>
                                        <Ionicons name="play-circle" size={40} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            );
                        }

                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.fileContainer, attachments.length > 1 && styles.gridItem]} 
                                onPress={() => Linking.openURL(fullUrl)}
                            >
                                <View style={styles.fileIcon}>
                                    <Ionicons name="download" size={20} color="#FF4B3A" />
                                </View>
                                <View style={styles.fileInfo}>
                                    <Text style={styles.fileName} numberOfLines={1}>{attachment.filename || "Attachment"}</Text>
                                    <Text style={styles.fileSize}>
                                        {attachment.size ? (attachment.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            );
        };

        const isRecalled = item.isRecalled;
        const isDeleted = item.deletedForEveryone;

        if (item.type === "system") {
            return (
                <View style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{item.content}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageWrapper, isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                {!isMyMessage && (
                    <Image 
                        source={item.senderAvatar ? { uri: item.senderAvatar } : require("../../src/assets/images/user-avatar.jpg")} 
                        style={styles.messageAvatar} 
                    />
                )}
                <View style={[styles.messageBubbleContainer, isMyMessage ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
                    {conversation?.type === "group" && !isMyMessage && (
                        <Text style={styles.senderName}>{item.senderName || "Unknown"}</Text>
                    )}
                    <TouchableOpacity 
                        onLongPress={() => handleMessageLongPress(item)}
                        delayLongPress={300}
                        activeOpacity={0.8}
                        style={[
                            styles.messageBubble, 
                            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
                            (item.type === "image" || item.type === "video") && !isRecalled && !isDeleted && styles.mediaBubble,
                            (isRecalled || isDeleted) && styles.recalledBubble
                        ]}
                    >
                    {(!isRecalled && !isDeleted) && renderAttachment()}
                    {isRecalled ? (
                        <Text style={[styles.messageText, styles.recalledText]}>
                            {isMyMessage ? "You recalled this message" : "This message was recalled"}
                        </Text>
                    ) : isDeleted ? (
                        <Text style={[styles.messageText, styles.recalledText]}>
                            This message was deleted
                        </Text>
                    ) : item.content ? (
                        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                            {item.content}
                        </Text>
                    ) : null}
                    <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.theirMessageTime]}>
                        {time}
                    </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Image 
                    source={avatar ? { uri: avatar } : (conversation?.type === "group" ? { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(conversationName || conversation?.name || "Group") + "&background=ff914c&color=fff" } : require("../../src/assets/images/user-avatar.jpg"))} 
                    style={styles.headerAvatar} 
                />
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerName}>{conversationName || conversation?.name}</Text>
                    <Text style={styles.headerStatus}>{conversation?.type === "group" ? `${conversation?.participants?.length} thành viên` : "Trực tuyến"}</Text>
                </View>
                {conversation?.type === "group" && (
                    <TouchableOpacity onPress={() => router.push(`/chat/group-details?id=${conversationId}`)}>
                        <Ionicons name="information-circle-outline" size={26} color="#333" />
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView 
                style={styles.keyboardAvoid} 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.messageId}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesContainer}
                    inverted
                />

                {isUploading && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator color="#FF4B3A" />
                        <Text style={styles.uploadingText}>Đang gửi...</Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={() => setShowAttachmentMenu(!showAttachmentMenu)} style={styles.actionButton}>
                        <Ionicons name="add-circle" size={28} color="#FF4B3A" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.actionButton}>
                        <MaterialIcons name="insert-emoticon" size={26} color="#888" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Nhắn tin..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        onFocus={() => setShowEmojiPicker(false)}
                    />
                    
                    {inputText.trim() ? (
                        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                            <Ionicons name="camera" size={26} color="#888" />
                        </TouchableOpacity>
                    )}
                </View>

                {showEmojiPicker && (
                    <View style={styles.emojiPickerContainer}>
                        {Platform.OS === "web" ? (
                            <WebEmojiPicker 
                                onEmojiClick={(emojiData: any) => {
                                    setInputText((prev) => prev + emojiData.emoji);
                                }}
                                width="100%"
                                height="100%"
                            />
                        ) : (
                            <EmojiSelector
                                onEmojiSelected={(emoji) => setInputText((prev) => prev + emoji)}
                                category={Categories.all}
                                showTabs={true}
                                showSearchBar={false}
                                columns={8}
                            />
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>

            <Modal
                visible={showPreviewModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPreviewModal(false)}
            >
                <SafeAreaView style={styles.previewOverlay}>
                    <View style={styles.previewHeader}>
                        <TouchableOpacity onPress={() => { setShowPreviewModal(false); setPendingMedia([]); }}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.previewTitle}>Gửi {pendingMedia.length} tệp</Text>
                        <TouchableOpacity onPress={uploadFiles}>
                            <Text style={styles.previewSendBtn}>Gửi</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={pendingMedia}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        renderItem={({ item }) => (
                            <View style={styles.previewMediaItem}>
                                {item.type?.startsWith("video") || item.mimeType?.startsWith("video") ? (
                                    <Video source={{ uri: item.uri }} style={styles.previewImage} resizeMode={ResizeMode.CONTAIN} />
                                ) : (
                                    <Image source={{ uri: item.uri }} style={styles.previewImage} resizeMode="contain" />
                                )}
                            </View>
                        )}
                        contentContainerStyle={styles.previewList}
                    />
                </SafeAreaView>
            </Modal>

            <Modal
                visible={showAttachmentMenu}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAttachmentMenu(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowAttachmentMenu(false)}
                >
                    <View style={styles.attachmentMenu}>
                        <TouchableOpacity style={styles.attachmentItem} onPress={takePhoto}>
                            <View style={[styles.attachmentIcon, { backgroundColor: "#FF4B3A" }]}>
                                <Ionicons name="camera" size={24} color="#fff" />
                            </View>
                            <Text style={styles.attachmentLabel}>Máy ảnh</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.attachmentItem} onPress={pickImage}>
                            <View style={[styles.attachmentIcon, { backgroundColor: "#512DA8" }]}>
                                <Ionicons name="images" size={24} color="#fff" />
                            </View>
                            <Text style={styles.attachmentLabel}>Thư viện</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.attachmentItem} onPress={pickDocument}>
                            <View style={[styles.attachmentIcon, { backgroundColor: "#007AFF" }]}>
                                <Ionicons name="document-text" size={24} color="#fff" />
                            </View>
                            <Text style={styles.attachmentLabel}>Tài liệu</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={!!fullScreenMedia}
                transparent={false}
                onRequestClose={() => setFullScreenMedia(null)}
            >
                <SafeAreaView style={styles.fullScreenContainer}>
                    <TouchableOpacity style={styles.closeMediaButton} onPress={() => setFullScreenMedia(null)}>
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    {fullScreenMedia?.type === "image" && (
                        <Image source={{ uri: fullScreenMedia.url }} style={styles.fullScreenImage} resizeMode="contain" />
                    )}
                    {fullScreenMedia?.type === "video" && (
                        <Video
                            source={{ uri: fullScreenMedia.url }}
                            style={styles.fullScreenVideo}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                        />
                    )}
                </SafeAreaView>
            </Modal>
            <Modal
                visible={showMessageActions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMessageActions(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowMessageActions(false)}
                >
                    <View style={styles.actionSheet}>
                        <View style={styles.actionSheetHeader}>
                            <View style={styles.actionSheetHandle} />
                        </View>
                        
                        <TouchableOpacity style={styles.actionItem} onPress={() => handleMessageAction("forward")}>
                            <Ionicons name="arrow-redo-outline" size={24} color="#333" />
                            <Text style={styles.actionLabel}>Chuyển tiếp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionItem} onPress={() => handleMessageAction("copy")}>
                            <Ionicons name="copy-outline" size={24} color="#333" />
                            <Text style={styles.actionLabel}>Sao chép</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionItem} onPress={() => handleMessageAction("delete_me")}>
                            <Ionicons name="trash-outline" size={24} color="#333" />
                            <Text style={styles.actionLabel}>Xóa phía tôi</Text>
                        </TouchableOpacity>

                        {selectedMessage && userId && selectedMessage.senderId === userId && (
                            <>
                                <TouchableOpacity style={styles.actionItem} onPress={() => handleMessageAction("delete_everyone")}>
                                    <Ionicons name="trash" size={24} color="#FF4B3A" />
                                    <Text style={[styles.actionLabel, { color: "#FF4B3A" }]}>Xóa với mọi người</Text>
                                </TouchableOpacity>

                                {((new Date().getTime() - new Date(selectedMessage.createdAt).getTime()) / (1000 * 60)) <= 5 && (
                                    <TouchableOpacity style={styles.actionItem} onPress={() => handleMessageAction("recall")}>
                                        <Ionicons name="refresh-circle-outline" size={24} color="#FF4B3A" />
                                        <Text style={[styles.actionLabel, { color: "#FF4B3A" }]}>Thu hồi tin nhắn</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                        
                        <TouchableOpacity 
                            style={[styles.actionItem, { marginTop: 10, borderTopWidth: 1, borderTopColor: "#eee" }]} 
                            onPress={() => setShowMessageActions(false)}
                        >
                            <Text style={[styles.actionLabel, { textAlign: "center", width: "100%", color: "#888" }]}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showForwardModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowForwardModal(false)}
            >
                <SafeAreaView style={styles.forwardOverlay}>
                    <View style={styles.forwardContent}>
                        <View style={styles.forwardHeader}>
                            <Text style={styles.forwardTitle}>Chuyển tiếp tới...</Text>
                            <TouchableOpacity onPress={() => setShowForwardModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={conversations}
                            keyExtractor={(item) => item.conversationId}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.forwardItem}
                                    onPress={async () => {
                                        try {
                                            await ChatApi.sendMessage(
                                                item.conversationId, 
                                                selectedMessage?.content || "", 
                                                selectedMessage?.type || "text",
                                                selectedMessage?.metadata || {}
                                            );
                                            setShowForwardModal(false);
                                            setSelectedMessage(null);
                                            Alert.alert("Thành công", "Đã chuyển tiếp tin nhắn");
                                        } catch (e: any) {
                                            Alert.alert("Lỗi", e.message);
                                        }
                                    }}
                                >
                                    <Image 
                                        source={item.avatarPath ? { uri: item.avatarPath } : (item.type === "group" ? { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.name) + "&background=ff914c&color=fff" } : require("../../src/assets/images/user-avatar.jpg"))} 
                                        style={styles.forwardAvatar} 
                                    />
                                    <Text style={styles.forwardName}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

// ... Styles same as previous but kept clean

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f9f9" },
    header: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", paddingTop: Platform.OS === "android" ? 40 : 15 },
    backButton: { marginRight: 15 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ddd", marginRight: 12 },
    headerTextContainer: { flex: 1 },
    headerName: { fontSize: 18, fontWeight: "bold", color: "#333" },
    headerStatus: { fontSize: 12, color: "#4CAF50" },
    keyboardAvoid: { flex: 1 },
    messagesContainer: { padding: 15 },
    messageWrapper: { flexDirection: "row", marginBottom: 15, alignItems: "flex-end" },
    myMessageWrapper: { justifyContent: "flex-end" },
    theirMessageWrapper: { justifyContent: "flex-start" },
    messageAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, marginBottom: 5 },
    messageBubbleContainer: { maxWidth: "75%" },
    senderName: { fontSize: 12, color: "#888", marginLeft: 10, marginBottom: 2 },
    messageBubble: { padding: 12, borderRadius: 20 },
    myMessageBubble: { backgroundColor: "#FF4B3A", borderBottomRightRadius: 5 },
    theirMessageBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 5, borderWidth: 1, borderColor: "#eee" },
    mediaBubble: { padding: 4, overflow: "hidden" },
    messageText: { fontSize: 15, lineHeight: 20 },
    myMessageText: { color: "#fff" },
    theirMessageText: { color: "#333" },
    messageImage: { width: width * 0.6, height: width * 0.6, borderRadius: 15, marginBottom: 5 },
    videoContainer: { width: width * 0.6, height: width * 0.4, borderRadius: 15, overflow: "hidden", backgroundColor: "#000", justifyContent: "center", alignItems: "center", marginBottom: 5 },
    messageVideo: { width: "100%", height: "100%" },
    videoPlayOverlay: { position: "absolute", zIndex: 1 },
    systemMessageContainer: { alignSelf: "center", backgroundColor: "rgba(0,0,0,0.05)", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginVertical: 10, maxWidth: "80%" },
    systemMessageText: { fontSize: 12, color: "#888", textAlign: "center", fontStyle: "italic" },
    fileContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.05)", padding: 10, borderRadius: 12, marginBottom: 5, minWidth: width * 0.5 },
    fileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginRight: 10 },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 14, fontWeight: "500", color: "#333" },
    fileSize: { fontSize: 11, color: "#888" },
    messageTime: { fontSize: 11, marginTop: 5, alignSelf: "flex-end" },
    myMessageTime: { color: "rgba(255,255,255,0.7)" },
    theirMessageTime: { color: "#999" },
    inputContainer: { flexDirection: "row", padding: 10, backgroundColor: "#fff", alignItems: "center", borderTopWidth: 1, borderTopColor: "#eee" },
    actionButton: { padding: 8 },
    input: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: "#f5f5f5", borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, marginHorizontal: 5, fontSize: 15 },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FF4B3A", justifyContent: "center", alignItems: "center", marginLeft: 5 },
    attachmentsGrid: { flexDirection: "row", flexWrap: "wrap", marginVertical: 5 },
    gridItem: { width: "48%", margin: "1%", aspectRatio: 1 },
    gridImage: { width: "100%", height: "100%", borderRadius: 10 },
    previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center" },
    previewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 40 },
    previewTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
    previewSendBtn: { color: "#FF4B3A", fontSize: 18, fontWeight: "bold" },
    previewList: { padding: 20, alignItems: "center" },
    previewMediaItem: { width: width - 40, height: width, marginHorizontal: 20 },
    previewImage: { width: "100%", height: "100%", borderRadius: 10 },
    forwardOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    forwardContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "70%", padding: 20 },
    forwardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    forwardTitle: { fontSize: 18, fontWeight: "bold" },
    forwardItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
    forwardAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
    forwardName: { fontSize: 16, fontWeight: "500" },
});

export default ChatDetailScreen;
