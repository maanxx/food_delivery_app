import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform, 
    SafeAreaView, 
    ActivityIndicator,
    Modal,
    Dimensions,
    Alert,
    Clipboard,
    Linking,
    TouchableOpacity,
    Image,
    Pressable,
    Keyboard
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ChatApi from "../../src/services/chatApi";
import SocketService from "../../src/services/socketService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EmojiSelector, { Categories } from "react-native-emoji-selector";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import API_CONFIG from "../../src/configs/api";
import * as Haptics from "expo-haptics";

// New Components
import MessageBubble from "../../src/components/Chat/MessageBubble";
import ChatHeader from "../../src/components/Chat/ChatHeader";
import ChatInput from "../../src/components/Chat/ChatInput";
import MessageActionSheet from "../../src/components/Chat/MessageActionSheet";
import AttachmentSheet from "../../src/components/Chat/AttachmentSheet";
import VoiceRecorder from "../../src/components/Chat/VoiceRecorder";
import { useCall } from "../../src/contexts/CallContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { ChatColors } from "../../src/theme/chatTheme";

const { width, height } = Dimensions.get("window");

// Component for full screen video preview
const FullScreenVideo = ({ url }: { url: string }) => {
    const player = useVideoPlayer(url, (player) => {
        player.loop = false;
        player.play();
    });

    return (
        <VideoView
            player={player}
            style={{ width: "100%", height: height * 0.7 }}
            contentFit="contain"
            nativeControls={true}
        />
    );
};

const ChatDetailScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const conversationId = params.id as string;
    const conversationName = params.conversationName as string;
    const { user: currentUser } = useAuth();
    const { setActiveCall } = useCall();
    const avatar = params.avatar as string;

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const userIdRef = useRef<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [fullScreenMedia, setFullScreenMedia] = useState<any | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
    const [showMessageActions, setShowMessageActions] = useState(false);
    
    const [conversation, setConversation] = useState<any>(null);
    const [forwardLoading, setForwardLoading] = useState(false);
    
    const [typingUsers, setTypingUsers] = useState<Record<string, { name: string, timestamp: number }>>({});
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
    
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const fetchUserId = async () => {
            const userData = await AsyncStorage.getItem("user_data");
            if (userData) {
                const parsed = JSON.parse(userData);
                const id = parsed.user_id || parsed.id;
                setUserId(id);
                userIdRef.current = id;
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        if (!conversationId) return;
        const loadData = async () => {
            try {
                const [msgData, convDetails] = await Promise.all([
                    ChatApi.getMessages(conversationId),
                    ChatApi.getConversationDetails(conversationId)
                ]);
                
                const sortedMessages = (msgData.messages || []).sort((a: any, b: any) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setMessages(sortedMessages);
                setConversation(convDetails);
            } catch (error) {
                console.error("[ChatDetail] Failed to load data:", error);
            }
        };
        loadData();
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;

        let isMounted = true;

        const handleNewMessage = (message: any) => {
            if (message.conversationId === conversationId) {
                setMessages((prev) => {
                    if (prev.some((m) => m.messageId === message.messageId)) return prev;
                    return [message, ...prev];
                });
            }
        };

        const initSocket = async () => {
            await SocketService.connect();
            if (!isMounted) return;
            SocketService.joinConversation(conversationId);
            SocketService.on("new_message", handleNewMessage);
        };

        initSocket();

        return () => {
            isMounted = false;
            SocketService.leaveConversation(conversationId);
            SocketService.off("new_message", handleNewMessage);
        };
    }, [conversationId, conversation]);

    const handleSend = async (content = inputText, type = "text", attachments: any[] = [], metadata = {}) => {
        if (!content.trim() && attachments.length === 0) return;
        const messageContent = content.trim();

        if (editingMessage && type === "text") {
            try {
                await ChatApi.editMessage(conversationId, editingMessage.messageId, messageContent);
                setEditingMessage(null);
                setInputText("");
            } catch (error: any) {
                Alert.alert("Lỗi", error.message);
            }
            return;
        }
        
        if (type === "text") {
            setInputText("");
        }

        try {
            const finalMetadata: any = { ...metadata, attachments };
            if (replyingToMessage) {
                finalMetadata.replyToId = replyingToMessage.messageId;
                setReplyingToMessage(null);
            }
            await ChatApi.sendMessage(conversationId, messageContent, type, finalMetadata);
            setShowEmojiPicker(false);
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
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
            handleUploadFiles(result.assets);
        }
    };

    const takePhoto = async () => {
        setShowAttachmentMenu(false);
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) return;
        const result = await ImagePicker.launchCameraAsync({ quality: 1 });
        if (!result.canceled) {
            handleUploadFiles(result.assets);
        }
    };

    const pickDocument = async () => {
        setShowAttachmentMenu(false);
        const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
        if (!result.canceled) {
            handleUploadFiles([result.assets[0]]);
        }
    };

    const handleUploadFiles = async (assets: any[]) => {
        setIsUploading(true);
        try {
            const uploaded = [];
            for (const asset of assets) {
                const formData = new FormData();
                formData.append("file", {
                    uri: asset.uri,
                    name: asset.name || asset.fileName || "upload.jpg",
                    type: asset.mimeType || asset.type || "image/jpeg",
                } as any);
                const data = await ChatApi.uploadFile(formData);
                uploaded.push({ ...data, type: (asset.mimeType || asset.type || "").startsWith("video") ? "video" : "image" });
            }
            await handleSend("", uploaded.length > 1 ? "file" : uploaded[0].type, uploaded);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải lên tệp");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMessageLongPress = (message: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (message.isRecalled || message.deletedForEveryone) return;
        setSelectedMessage(message);
        setShowMessageActions(true);
    };

    const handleReactionToggle = async (messageId: string, emoji: string) => {
        try {
            const msg = messages.find(m => m.messageId === messageId);
            const mine = msg?.reactions?.find((r: any) => r.userId === userId && r.emoji === emoji);
            if (mine) await ChatApi.removeReaction(conversationId, messageId, emoji);
            else await ChatApi.addReaction(conversationId, messageId, emoji);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMessageAction = async (action: string) => {
        if (!selectedMessage) return;
        setShowMessageActions(false);
        try {
            switch (action) {
                case "delete_me":
                    await ChatApi.deleteMessage(conversationId, selectedMessage.messageId, false);
                    setMessages(prev => prev.filter(m => m.messageId !== selectedMessage.messageId));
                    break;
                case "reply":
                    setReplyingToMessage(selectedMessage);
                    break;
                case "copy":
                    Clipboard.setString(selectedMessage.content || "");
                    break;
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        }
    };

    const handleCall = async (type: "voice" | "video") => {
        if (!conversation) return;
        const recipient = conversation.participants.find((p: any) => p.userId !== userId);
        if (!recipient) return;
        try {
            const callData = await ChatApi.initiateCall(recipient.userId, conversationId, type);
            if (callData) {
                setActiveCall({
                    ...callData,
                    type,
                    callerName: currentUser?.fullname || "Tôi",
                    callerAvatar: currentUser?.avatar_path
                });
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        }
    };

    const renderMessage = ({ item, index }: { item: any, index: number }) => {
        const isMyMessage = item.senderId === userId;
        const nextMessage = messages[index + 1];
        const prevMessage = messages[index - 1];
        
        const isLastInSequence = !prevMessage || prevMessage.senderId !== item.senderId;
        const showAvatar = !isMyMessage && isLastInSequence;

        return (
            <MessageBubble 
                item={item}
                isMyMessage={isMyMessage}
                userId={userId}
                conversation={conversation}
                onLongPress={handleMessageLongPress}
                onReactionToggle={handleReactionToggle}
                onMediaPress={(media) => setFullScreenMedia(media)}
                showAvatar={showAvatar}
                isGroup={conversation?.type === "group"}
                isLastInSequence={isLastInSequence}
            />
        );
    };

    const typingText = Object.values(typingUsers).map(u => u.name).join(", ");

    const closeAllPopups = () => {
        setShowEmojiPicker(false);
        setShowAttachmentMenu(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ChatHeader 
                name={conversationName || conversation?.name || "Đang tải..."}
                avatar={avatar || conversation?.avatarPath}
                isOnline={Object.keys(typingUsers).length > 0}
                isGroup={conversation?.type === "group"}
                onCall={() => handleCall("voice")}
                onVideoCall={() => handleCall("video")}
                onInfo={() => conversation?.type === "group" ? router.push(`/chat/group-details?id=${conversationId}`) : {}}
            />

            <KeyboardAvoidingView 
                style={styles.keyboardAvoid} 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.messageId}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesContainer}
                    inverted
                    showsVerticalScrollIndicator={false}
                />

                {typingText ? (
                    <View style={styles.typingIndicatorContainer}>
                        <Text style={styles.typingText}>{typingText} đang nhập...</Text>
                    </View>
                ) : null}

                {replyingToMessage && (
                    <View style={styles.replyPreviewContainer}>
                        <View style={styles.replyPreviewBar} />
                        <View style={styles.replyPreviewContent}>
                            <Text style={styles.replyPreviewName} numberOfLines={1}>
                                Trả lời {replyingToMessage.senderName}
                            </Text>
                            <Text style={styles.replyPreviewText} numberOfLines={1}>
                                {replyingToMessage.content}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyingToMessage(null)}>
                            <Ionicons name="close-circle" size={24} color={ChatColors.gray} />
                        </TouchableOpacity>
                    </View>
                )}

                <ChatInput 
                    value={inputText}
                    onChangeText={setInputText}
                    onSend={() => handleSend()}
                    onAttach={() => {
                        Keyboard.dismiss();
                        setShowEmojiPicker(false);
                        setShowAttachmentMenu(true);
                    }}
                    onEmoji={() => {
                        Keyboard.dismiss();
                        setShowEmojiPicker(!showEmojiPicker);
                    }}
                    onVoice={() => {}} 
                    isTyping={inputText.length > 0}
                />

                {showEmojiPicker && (
                    <>
                        <Pressable 
                            style={styles.emojiBackdrop} 
                            onPress={() => setShowEmojiPicker(false)} 
                        />
                        <View style={styles.emojiPickerContainer}>
                            <View style={styles.emojiPickerHeader}>
                                <View style={styles.emojiPickerHandle} />
                            </View>
                            <EmojiSelector
                                onEmojiSelected={(emoji) => setInputText((prev) => prev + emoji)}
                                category={Categories.all}
                                showTabs={true}
                                columns={8}
                            />
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>

            <MessageActionSheet 
                isVisible={showMessageActions}
                onClose={() => setShowMessageActions(false)}
                onAction={handleMessageAction}
                isMyMessage={selectedMessage?.senderId === userId}
                canRecall={true}
                onReaction={(emoji) => handleReactionToggle(selectedMessage.messageId, emoji)}
            />

            <AttachmentSheet 
                isVisible={showAttachmentMenu}
                onClose={() => setShowAttachmentMenu(false)}
                onSelect={(type) => {
                    if (type === "camera") takePhoto();
                    else if (type === "gallery") pickImage();
                    else if (type === "document") pickDocument();
                }}
            />

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
                        <FullScreenVideo url={fullScreenMedia.url} />
                    )}
                </SafeAreaView>
            </Modal>

            {isUploading && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color={ChatColors.primary} size="large" />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    keyboardAvoid: { flex: 1 },
    mentionItem: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
    mentionAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
    mentionName: { fontSize: 14, color: "#333" },
    voicePlayer: { flexDirection: "row", alignItems: "center", minWidth: width * 0.5, padding: 5 },
    voicePlayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginRight: 10 },
    voiceProgressContainer: { flex: 1 },
    voiceProgressBar: { height: 4, backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 2, marginBottom: 5 },
    voiceProgressFill: { height: "100%", backgroundColor: "#FF4B3A", borderRadius: 2 },
    voiceTime: { fontSize: 10, color: "#888" },
    recordingOverlay: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
    recordingIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF4B3A", marginRight: 10 },
    recordingText: { flex: 1, fontSize: 14, color: "#FF4B3A", fontWeight: "bold" },
    stopRecordingBtn: { backgroundColor: "#FF4B3A", padding: 8, borderRadius: 20 },
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
    emojiBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "transparent",
        zIndex: 10,
    },
    emojiPickerContainer: {
        position: "absolute",
        bottom: 80,
        left: 10,
        right: 10,
        height: height * 0.4,
        backgroundColor: "#fff",
        borderRadius: 20,
        zIndex: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        overflow: "hidden",
    },
    emojiPickerHeader: {
        height: 20,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    emojiPickerHandle: {
        width: 40,
        height: 5,
        backgroundColor: "#E5E5EA",
        borderRadius: 3,
    },
});

export default ChatDetailScreen;
