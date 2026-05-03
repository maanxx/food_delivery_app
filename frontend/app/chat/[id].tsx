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
    Dimensions
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [fullScreenMedia, setFullScreenMedia] = useState<any | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const fetchUserId = async () => {
            const userData = await AsyncStorage.getItem("user_data");
            if (userData) {
                const parsed = JSON.parse(userData);
                setUserId(parsed.user_id || parsed.id);
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        console.log("ChatDetailScreen params:", params);
        const loadMessages = async () => {
            if (!conversationId) {
                console.warn("No conversationId provided to ChatDetailScreen");
                return;
            }
            try {
                console.log("Fetching messages for conversation:", conversationId);
                const data = await ChatApi.getMessages(conversationId);
                console.log("Messages received:", data.messages?.length || 0);
                setMessages(data.messages || []);
                
                // Mark as read
                if (data.messages && data.messages.length > 0) {
                    const unreadIds = data.messages
                        .filter((m: any) => !m.isRead && m.senderId !== userId)
                        .map((m: any) => m.messageId);
                    if (unreadIds.length > 0) {
                        ChatApi.markMessagesAsRead(conversationId, unreadIds);
                    }
                }
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        };

        loadMessages();

        // Connect and join room
        SocketService.connect();
        SocketService.joinConversation(conversationId);

        const handleNewMessage = (message: any) => {
            setMessages((prev) => [message, ...prev]);
            
            // Auto mark as read if screen is open
            if (message.senderId !== userId) {
                ChatApi.markMessagesAsRead(conversationId, [message.messageId]);
            }
        };

        SocketService.on("new_message", handleNewMessage);

        return () => {
            SocketService.leaveConversation(conversationId);
            SocketService.off("new_message", handleNewMessage);
        };
    }, [conversationId, userId]);

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
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            uploadFile(result.assets[0]);
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

    const uploadFile = async (fileAsset: any) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            const fileName = fileAsset.name || fileAsset.fileName || `upload_${Date.now()}`;
            const fileType = fileAsset.mimeType || fileAsset.type || "application/octet-stream";
            
            formData.append("file", {
                uri: fileAsset.uri,
                name: fileName,
                type: fileType,
            } as any);

            const uploadData = await ChatApi.uploadFile(formData);
            
            // Determine message type
            let msgType = "file";
            if (fileType.startsWith("image")) msgType = "image";
            else if (fileType.startsWith("video")) msgType = "video";

            await handleSend("", msgType, [uploadData], {
                fileName: uploadData.filename,
                fileSize: uploadData.size,
                mimetype: uploadData.mimetype
            });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMyMessage = item.senderId === userId;
        const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const renderAttachment = () => {
            const attachment = item.metadata?.attachments?.[0] || item.attachments?.[0];
            if (!attachment) return null;

            const fullUrl = `${API_CONFIG.BASE_URL}${attachment.url}`;

            if (item.type === "image") {
                return (
                    <TouchableOpacity onPress={() => setFullScreenMedia({ type: "image", url: fullUrl })}>
                        <Image 
                            source={{ uri: fullUrl }} 
                            style={styles.messageImage} 
                            resizeMode="cover" 
                        />
                    </TouchableOpacity>
                );
            }

            if (item.type === "video") {
                return (
                    <TouchableOpacity 
                        style={styles.videoContainer}
                        onPress={() => setFullScreenMedia({ type: "video", url: fullUrl })}
                    >
                        <Video
                            source={{ uri: fullUrl }}
                            style={styles.messageVideo}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                        />
                        <View style={styles.videoPlayOverlay}>
                            <Ionicons name="play-circle" size={50} color="#fff" />
                        </View>
                    </TouchableOpacity>
                );
            }

            if (item.type === "file") {
                return (
                    <TouchableOpacity style={styles.fileContainer} onPress={() => { /* Link to open/download */ }}>
                        <View style={styles.fileIcon}>
                            <Ionicons name="document" size={24} color="#FF4B3A" />
                        </View>
                        <View style={styles.fileInfo}>
                            <Text style={styles.fileName} numberOfLines={1}>{item.metadata?.fileName || "Attachment"}</Text>
                            <Text style={styles.fileSize}>
                                {item.metadata?.fileSize ? (item.metadata.fileSize / 1024 / 1024).toFixed(2) + " MB" : ""}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            }

            return null;
        };

        return (
            <View style={[styles.messageWrapper, isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                {!isMyMessage && (
                    <Image source={item.senderAvatar ? { uri: item.senderAvatar } : require("../../src/assets/images/user-avatar.jpg")} style={styles.messageAvatar} />
                )}
                <View style={[
                    styles.messageBubble, 
                    isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
                    (item.type === "image" || item.type === "video") && styles.mediaBubble
                ]}>
                    {renderAttachment()}
                    {item.content ? (
                        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                            {item.content}
                        </Text>
                    ) : null}
                    <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.theirMessageTime]}>
                        {time}
                    </Text>
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
                <Image source={avatar ? { uri: avatar } : require("../../src/assets/images/user-avatar.jpg")} style={styles.headerAvatar} />
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerName}>{conversationName}</Text>
                    <Text style={styles.headerStatus}>Trực tuyến</Text>
                </View>
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
                        <EmojiSelector
                            onEmojiSelected={(emoji) => setInputText((prev) => prev + emoji)}
                            category={Categories.all}
                            showTabs={true}
                            showSearchBar={false}
                            columns={8}
                        />
                    </View>
                )}
            </KeyboardAvoidingView>

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
        </SafeAreaView>
    );
};

// ... Styles same as previous but kept clean
import API_CONFIG from "../../src/configs/api";

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
    messageAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
    messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 20 },
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
    emojiPickerContainer: { height: 300, backgroundColor: "#fff" },
    uploadingOverlay: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, backgroundColor: "rgba(255,255,255,0.9)" },
    uploadingText: { marginLeft: 10, color: "#FF4B3A", fontWeight: "500" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    attachmentMenu: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-around", paddingBottom: 40 },
    attachmentItem: { alignItems: "center", width: 80 },
    attachmentIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 8 },
    attachmentLabel: { fontSize: 12, color: "#666" },
    fullScreenContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
    closeMediaButton: { position: "absolute", top: 50, right: 20, zIndex: 2 },
    fullScreenImage: { width: "100%", height: "100%" },
    fullScreenVideo: { width: "100%", height: "100%" },
});

export default ChatDetailScreen;
