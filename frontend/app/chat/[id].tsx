import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ChatApi from "../../src/services/chatApi";
import SocketService from "../../src/services/socketService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatDetailScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const conversationId = params.id as string;
    const conversationName = params.conversationName as string;
    const avatar = params.avatar as string;

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const fetchUserId = async () => {
            const userData = await AsyncStorage.getItem("user_data");
            if (userData) {
                setUserId(JSON.parse(userData).user_id || JSON.parse(userData).id);
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const data = await ChatApi.getMessages(conversationId);
                setMessages(data.messages || []);
                
                // Mark as read
                if (data.messages && data.messages.length > 0) {
                    const unreadIds = data.messages.filter((m: any) => !m.isRead && m.senderId !== userId).map((m: any) => m.messageId);
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

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const content = inputText.trim();
        setInputText("");

        try {
            await ChatApi.sendMessage(conversationId, content);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMyMessage = item.senderId === userId;
        const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[styles.messageWrapper, isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                {!isMyMessage && (
                    <Image source={item.senderAvatar ? { uri: item.senderAvatar } : require("../../src/assets/images/user-avatar.jpg")} style={styles.messageAvatar} />
                )}
                <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </Text>
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
                <Text style={styles.headerName}>{conversationName}</Text>
            </View>

            <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.messageId}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesContainer}
                    inverted
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} onPress={handleSend} disabled={!inputText.trim()}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingTop: Platform.OS === "android" ? 40 : 15,
    },
    backButton: {
        marginRight: 15,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ddd",
        marginRight: 10,
    },
    headerName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    keyboardAvoid: {
        flex: 1,
    },
    messagesContainer: {
        padding: 15,
    },
    messageWrapper: {
        flexDirection: "row",
        marginBottom: 15,
        alignItems: "flex-end",
    },
    myMessageWrapper: {
        justifyContent: "flex-end",
    },
    theirMessageWrapper: {
        justifyContent: "flex-start",
    },
    messageAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
    },
    messageBubble: {
        maxWidth: "75%",
        padding: 12,
        borderRadius: 20,
    },
    myMessageBubble: {
        backgroundColor: "#FF4B3A",
        borderBottomRightRadius: 5,
    },
    theirMessageBubble: {
        backgroundColor: "#fff",
        borderBottomLeftRadius: 5,
        borderWidth: 1,
        borderColor: "#eee",
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: "#fff",
    },
    theirMessageText: {
        color: "#333",
    },
    messageTime: {
        fontSize: 11,
        marginTop: 5,
        alignSelf: "flex-end",
    },
    myMessageTime: {
        color: "rgba(255,255,255,0.7)",
    },
    theirMessageTime: {
        color: "#999",
    },
    inputContainer: {
        flexDirection: "row",
        padding: 10,
        backgroundColor: "#fff",
        alignItems: "flex-end",
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: "#f5f5f5",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 10,
        fontSize: 15,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#FF4B3A",
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonDisabled: {
        backgroundColor: "#ffb4ac",
    },
});

export default ChatDetailScreen;
