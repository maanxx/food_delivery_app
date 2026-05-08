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
import { Video, ResizeMode, Audio } from "expo-av";
import API_CONFIG from "../../src/configs/api";
import * as Haptics from "expo-haptics";

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
    const userIdRef = useRef<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [fullScreenMedia, setFullScreenMedia] = useState<any | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
    const [showMessageActions, setShowMessageActions] = useState(false);
    const [pendingMedia, setPendingMedia] = useState<any[]>([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [conversation, setConversation] = useState<any>(null);
    
    // Forward State
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [forwardLoading, setForwardLoading] = useState(false);
    
    const [typingUsers, setTypingUsers] = useState<Record<string, { name: string, timestamp: number }>>({});
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
    const [showMentionList, setShowMentionList] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentions, setMentions] = useState<string[]>([]);
    
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState(0);
    const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const COMMON_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

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
                if (message.senderId && message.senderId !== userIdRef.current) {
                    ChatApi.markMessagesAsRead(conversationId, [message.messageId]).catch(() => {});
                }
            }
        };

        const handleMessageEdited = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) => 
                    prev.map((m) => m.messageId === data.messageId ? { ...m, content: data.content, isEdited: true, editedAt: data.editedAt } : m)
                );
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

        const handleMessageRead = (data: any) => {
            if (data.conversationId === conversationId) {
                const readIds = data.messageIds || [data.messageId];
                setMessages((prev) => 
                    prev.map((m) => readIds.includes(m.messageId) ? { ...m, isRead: true } : m)
                );
            }
        };

        const handleUserTyping = (data: any) => {
            if (data.conversationId === conversationId && data.userId !== userIdRef.current) {
                const p = conversation?.participants?.find((p: any) => p.userId === data.userId);
                const name = p?.fullname || "Ai đó";
                setTypingUsers(prev => ({ ...prev, [data.userId]: { name, timestamp: Date.now() } }));
            }
        };

        const handleUserStopTyping = (data: any) => {
            if (data.conversationId === conversationId) {
                setTypingUsers(prev => {
                    const next = { ...prev };
                    delete next[data.userId];
                    return next;
                });
            }
        };

        const handleReactionAdded = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages(prev => prev.map(m => m.messageId === data.messageId ? { ...m, reactions: data.reactions } : m));
            }
        };

        const handleReactionRemoved = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages(prev => prev.map(m => m.messageId === data.messageId ? { ...m, reactions: data.reactions } : m));
            }
        };

        const initSocket = async () => {
            await SocketService.connect();
            if (!isMounted) return;
            SocketService.joinConversation(conversationId);
            SocketService.on("new_message", handleNewMessage);
            SocketService.on("message_edited", handleMessageEdited);
            SocketService.on("message_deleted_for_everyone", handleMessageDeletedForEveryone);
            SocketService.on("message_recalled", handleMessageRecalled);
            SocketService.on("message_read", handleMessageRead);
            SocketService.on("user_typing", handleUserTyping);
            SocketService.on("user_stop_typing", handleUserStopTyping);
            SocketService.on("reaction_added", handleReactionAdded);
            SocketService.on("reaction_removed", handleReactionRemoved);
        };

        initSocket();

        return () => {
            isMounted = false;
            SocketService.leaveConversation(conversationId);
            SocketService.off("new_message", handleNewMessage);
            SocketService.off("message_edited", handleMessageEdited);
            SocketService.off("message_deleted_for_everyone", handleMessageDeletedForEveryone);
            SocketService.off("message_recalled", handleMessageRecalled);
            SocketService.off("message_read", handleMessageRead);
            SocketService.off("user_typing", handleUserTyping);
            SocketService.off("user_stop_typing", handleUserStopTyping);
            SocketService.off("reaction_added", handleReactionAdded);
            SocketService.off("reaction_removed", handleReactionRemoved);
        };
    }, [conversationId, conversation]);

    const handleInputChange = (text: string) => {
        setInputText(text);
        
        // Mention detection
        const words = text.split(/\s/);
        const lastWord = words[words.length - 1];
        if (lastWord.startsWith("@")) {
            setMentionQuery(lastWord.slice(1).toLowerCase());
            setShowMentionList(true);
        } else {
            setShowMentionList(false);
        }

        SocketService.emitTyping(conversationId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            SocketService.emitStopTyping(conversationId);
        }, 2000);
    };

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
            setMentions([]);
        }

        try {
            const finalMetadata = { ...metadata, attachments, mentions: mentions.length > 0 ? mentions : undefined };
            if (replyingToMessage) {
                finalMetadata.replyToId = replyingToMessage.messageId;
                setReplyingToMessage(null);
            }
            await ChatApi.sendMessage(conversationId, messageContent, type, finalMetadata);
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
            setPendingMedia(result.assets);
            setShowPreviewModal(true);
        }
    };

    const takePhoto = async () => {
        setShowAttachmentMenu(false);
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) return;
        const result = await ImagePicker.launchCameraAsync({ quality: 1 });
        if (!result.canceled) {
            setPendingMedia(result.assets);
            setShowPreviewModal(true);
        }
    };

    const pickDocument = async () => {
        setShowAttachmentMenu(false);
        const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
        if (!result.canceled) {
            uploadFile(result.assets[0]);
        }
    };

    const uploadFiles = async () => {
        setShowPreviewModal(false);
        setIsUploading(true);
        try {
            const uploaded = [];
            for (const asset of pendingMedia) {
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
            setPendingMedia([]);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải lên tệp");
        } finally {
            setIsUploading(false);
        }
    };

    const uploadFile = async (asset: any) => {
        setPendingMedia([asset]);
        setShowPreviewModal(true);
    };

    const handleMessageLongPress = (message: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (message.isRecalled || message.deletedForEveryone) return;
        setSelectedMessage(message);
        setShowMessageActions(true);
    };

    const handleAddReaction = async (emoji: string) => {
        if (!selectedMessage) return;
        Haptics.selectionAsync();
        try {
            await ChatApi.addReaction(conversationId, selectedMessage.messageId, emoji);
            setShowMessageActions(false);
            setSelectedMessage(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleReactionToggle = async (messageId: string, emoji: string) => {
        try {
            const msg = messages.find(m => m.messageId === messageId);
            const mine = msg?.reactions?.find((r: any) => r.userId === userId && r.emoji === emoji);
            if (mine) await ChatApi.removeReaction(conversationId, messageId, emoji);
            else await ChatApi.addReaction(conversationId, messageId, emoji);
            setShowMessageActions(false);
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
                case "delete_everyone":
                    await ChatApi.deleteMessage(conversationId, selectedMessage.messageId, true);
                    break;
                case "recall":
                    await ChatApi.recallMessage(selectedMessage.messageId, conversationId);
                    break;
                case "reply":
                    setReplyingToMessage(selectedMessage);
                    break;
                case "edit":
                    setEditingMessage(selectedMessage);
                    setInputText(selectedMessage.content || "");
                    break;
                case "copy":
                    Clipboard.setString(selectedMessage.content || "");
                    break;
                case "forward":
                    loadConversationsForForward();
                    setShowForwardModal(true);
                    break;
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        }
    };

    const loadConversationsForForward = async () => {
        try {
            const data = await ChatApi.getConversations();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleForwardMessage = async (targetId: string) => {
        if (!selectedMessage) return;
        setForwardLoading(true);
        try {
            await ChatApi.sendMessage(targetId, selectedMessage.content || "", "forward", {
                forwardedFromId: userId,
                originalMessageId: selectedMessage.messageId,
                attachments: selectedMessage.attachments
            });
            setShowForwardModal(false);
            Alert.alert("Thành công", "Đã chuyển tiếp");
        } catch (error) {
            Alert.alert("Lỗi", "Không thể chuyển tiếp");
        } finally {
            setForwardLoading(false);
        }
    };

    const handleCall = async (type: "voice" | "video") => {
        if (!conversation) return;
        const recipient = conversation.participants.find((p: any) => p.userId !== userId);
        if (!recipient) return;
        try {
            await ChatApi.initiateCall(recipient.userId, conversationId, type);
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        }
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
            setIsRecording(true);
            setRecordDuration(0);
            recordTimerRef.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
        } catch (err) {
            console.error(err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            if (uri) sendVoiceMessage(uri, recordDuration);
        } catch (error) {
            console.error(error);
        }
    };

    const sendVoiceMessage = async (uri: string, duration: number) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", { uri, name: "voice.m4a", type: "audio/m4a" } as any);
            await ChatApi.sendMessage(conversationId, "", "voice", { durationSeconds: duration }, formData);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể gửi tin nhắn thoại");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMentionSelect = (user: any) => {
        const words = inputText.split(/\s/);
        words[words.length - 1] = `@${user.fullname || user.username} `;
        setInputText(words.join(" "));
        setMentions(prev => [...new Set([...prev, user.userId])]);
        setShowMentionList(false);
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
                    {item.replyToId && (
                        <View style={[styles.replyContainer, isMyMessage ? styles.myReplyContainer : styles.theirReplyContainer]}>
                            <View style={styles.replyBar} />
                            <View style={styles.replyContent}>
                                <Text style={styles.replyName} numberOfLines={1}>
                                    {item.repliedMessage?.senderName || "Đang tải..."}
                                </Text>
                                <Text style={styles.replyText} numberOfLines={1}>
                                    {item.repliedMessage?.content || "Tin nhắn"}
                                </Text>
                            </View>
                        </View>
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
                    ) : item.type === "voice" ? (
                        <VoicePlayer 
                            url={`${API_CONFIG.BASE_URL}${item.attachments?.[0]?.url || item.metadata?.attachments?.[0]?.url}`} 
                            duration={item.metadata?.durationSeconds} 
                        />
                    ) : item.content ? (
                        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                            {(() => {
                                // Basic mention highlighting: find @Name and wrap in bold/color
                                // In a real app, you'd use a more robust parser with mention IDs
                                const parts = item.content.split(/(@[^\s]+)/g);
                                return parts.map((part: string, i: number) => {
                                    if (part.startsWith("@")) {
                                        return <Text key={i} style={styles.mentionText}>{part}</Text>;
                                    }
                                    return part;
                                });
                            })()}
                        </Text>
                    ) : null}
                    <View style={styles.messageFooter}>
                        <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.theirMessageTime]}>
                            {time} {item.isEdited && "(Đã sửa)"}
                        </Text>
                        {isMyMessage && (
                            <Ionicons 
                                name={item.isRead ? "checkmark-done" : "checkmark"} 
                                size={14} 
                                color={item.isRead ? "#4fc3f7" : (isMyMessage ? "#eee" : "#888")} 
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                    </TouchableOpacity>
                    {item.reactions && item.reactions.length > 0 && (
                        <View style={[styles.reactionsContainer, isMyMessage ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
                            {(() => {
                                // Group by emoji
                                const grouped = item.reactions.reduce((acc: any, r: any) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                }, {});
                                
                                return Object.entries(grouped).map(([emoji, count]: any) => (
                                    <TouchableOpacity 
                                        key={emoji} 
                                        style={[
                                            styles.reactionBadge,
                                            item.reactions.some((r: any) => r.userId === userId && r.emoji === emoji) && styles.myReactionBadge
                                        ]}
                                        onPress={() => handleReactionToggle(item.messageId, emoji)}
                                    >
                                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                                        {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
                                    </TouchableOpacity>
                                ));
                            })()}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const typingText = Object.values(typingUsers).map(u => u.name).join(", ");

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
                    {typingText ? (
                        <Text style={[styles.headerStatus, { color: "#FF4B3A" }]}>{typingText} đang nhập...</Text>
                    ) : (
                        <Text style={styles.headerStatus}>{conversation?.type === "group" ? `${conversation?.participants?.length} thành viên` : "Trực tuyến"}</Text>
                    )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={() => handleCall("voice")} style={{ marginRight: 15 }}>
                        <Ionicons name="call-outline" size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCall("video")} style={{ marginRight: 15 }}>
                        <Ionicons name="videocam-outline" size={26} color="#333" />
                    </TouchableOpacity>
                    {conversation?.type === "group" && (
                        <TouchableOpacity onPress={() => router.push(`/chat/group-details?id=${conversationId}`)}>
                            <Ionicons name="information-circle-outline" size={26} color="#333" />
                        </TouchableOpacity>
                    )}
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

                {replyingToMessage && (
                    <View style={styles.replyPreviewContainer}>
                        <View style={styles.replyPreviewBar} />
                        <View style={styles.replyPreviewContent}>
                            <Text style={styles.replyPreviewName} numberOfLines={1}>
                                Trả lời: {replyingToMessage.senderName}
                            </Text>
                            <Text style={styles.replyPreviewText} numberOfLines={1}>
                                {replyingToMessage.content}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyingToMessage(null)}>
                            <Ionicons name="close-circle" size={20} color="#888" />
                        </TouchableOpacity>
                    </View>
                )}

                {editingMessage && (
                    <View style={styles.replyPreviewContainer}>
                        <View style={[styles.replyPreviewBar, { backgroundColor: "#FF4B3A" }]} />
                        <View style={styles.replyPreviewContent}>
                            <Text style={[styles.replyPreviewName, { color: "#FF4B3A" }]}>Đang sửa tin nhắn</Text>
                            <Text style={styles.replyPreviewText} numberOfLines={1}>
                                {editingMessage.content}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => { setEditingMessage(null); setInputText(""); }}>
                            <Ionicons name="close-circle" size={20} color="#888" />
                        </TouchableOpacity>
                    </View>
                )}

                {showMentionList && conversation?.type === "group" && (
                    <View style={styles.mentionListContainer}>
                        <FlatList
                            data={conversation.participants.filter((p: any) => 
                                p.userId !== userId && 
                                (p.fullname?.toLowerCase().includes(mentionQuery) || p.username?.toLowerCase().includes(mentionQuery))
                            )}
                            keyExtractor={(item) => item.userId}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.mentionItem} onPress={() => handleMentionSelect(item)}>
                                    <Image 
                                        source={item.avatarUrl ? { uri: item.avatarUrl } : require("../../src/assets/images/user-avatar.jpg")} 
                                        style={styles.mentionAvatar} 
                                    />
                                    <Text style={styles.mentionName}>{item.fullname || item.username}</Text>
                                </TouchableOpacity>
                            )}
                            style={{ maxHeight: 200 }}
                        />
                    </View>
                )}

                {isRecording && (
                    <View style={styles.recordingOverlay}>
                        <View style={styles.recordingIndicator} />
                        <Text style={styles.recordingText}>Đang ghi âm... {formatDuration(recordDuration)}</Text>
                        <TouchableOpacity style={styles.stopRecordingBtn} onPress={stopRecording}>
                            <Ionicons name="stop" size={20} color="#fff" />
                        </TouchableOpacity>
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
                        onChangeText={handleInputChange}
                        multiline
                        onFocus={() => setShowEmojiPicker(false)}
                    />
                    
                    {inputText.trim() ? (
                        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flexDirection: "row" }}>
                            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                                <Ionicons name="camera" size={26} color="#888" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionButton, isRecording && { backgroundColor: "#fff5f5" }]} 
                                onPress={isRecording ? stopRecording : startRecording}
                            >
                                <Ionicons name="mic" size={26} color={isRecording ? "#FF4B3A" : "#888"} />
                            </TouchableOpacity>
                        </View>
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
                        
                        <View style={styles.reactionPicker}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {COMMON_EMOJIS.map((emoji) => (
                                    <TouchableOpacity 
                                        key={emoji} 
                                        style={styles.reactionOption}
                                        onPress={() => handleReactionToggle(selectedMessage!.messageId, emoji)}
                                    >
                                        <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity style={styles.actionItem} onPress={() => handleMessageAction("reply")}>
                            <Ionicons name="return-up-back-outline" size={24} color="#333" />
                            <Text style={styles.actionLabel}>Trả lời</Text>
                        </TouchableOpacity>

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
                                <TouchableOpacity style={styles.actionItem} onPress={() => handleMessageAction("edit")}>
                                    <Ionicons name="create-outline" size={24} color="#333" />
                                    <Text style={styles.actionLabel}>Sửa tin nhắn</Text>
                                </TouchableOpacity>

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
            {/* Forward Modal */}
            <Modal visible={showForwardModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.forwardContainer}>
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
                                    onPress={() => handleForwardMessage(item.conversationId)}
                                    disabled={forwardLoading}
                                >
                                    <Image 
                                        source={item.avatarPath ? { uri: item.avatarPath } : (item.type === "group" ? { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.name) + "&background=ff914c&color=fff" } : require("../../src/assets/images/user-avatar.jpg"))} 
                                        style={styles.forwardAvatar} 
                                    />
                                    <Text style={styles.forwardName}>{item.name}</Text>
                                    <Ionicons name="send-outline" size={20} color="#ff914c" />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy cuộc trò chuyện nào</Text>}
                        />
                    </View>
                </View>
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
    messageTime: { fontSize: 10, marginTop: 2 },
    myMessageTime: { color: "rgba(255,255,255,0.7)" },
    theirMessageTime: { color: "#888" },
    messageFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 2 },
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
    fileInfoText: { fontSize: 11, color: "#888" }, // Fixed duplicate style name issue
    replyContainer: { backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 8, flexDirection: "row", marginBottom: 5, overflow: "hidden" },
    myReplyContainer: { backgroundColor: "rgba(255,255,255,0.15)" },
    theirReplyContainer: { backgroundColor: "rgba(0,0,0,0.05)" },
    replyBar: { width: 4, backgroundColor: "#FF4B3A" },
    replyContent: { padding: 8, flex: 1 },
    replyName: { fontWeight: "bold", fontSize: 12, color: "#FF4B3A", marginBottom: 2 },
    replyText: { fontSize: 12, color: "#666" },
    replyPreviewContainer: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
    replyPreviewBar: { width: 4, height: "100%", backgroundColor: "#FF4B3A", borderRadius: 2 },
    replyPreviewContent: { flex: 1, paddingHorizontal: 10 },
    replyPreviewName: { fontWeight: "bold", fontSize: 13, color: "#FF4B3A" },
    replyPreviewText: { fontSize: 12, color: "#666" },
    reactionsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: -5, marginHorizontal: 10, zIndex: 1 },
    reactionBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4, borderWidth: 1, borderColor: "#eee", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    myReactionBadge: { borderColor: "#FF4B3A", backgroundColor: "#fff5f5" },
    reactionEmoji: { fontSize: 12 },
    reactionCount: { fontSize: 10, marginLeft: 2, color: "#666", fontWeight: "bold" },
    reactionPicker: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
    reactionOption: { width: (width - 40) / 6, alignItems: "center", justifyContent: "center" },
    reactionOptionEmoji: { fontSize: 28 },
    mentionText: { color: "#4fc3f7", fontWeight: "bold" },
    mentionListContainer: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee", elevation: 5 },
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
});

export default ChatDetailScreen;
