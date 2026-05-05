import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ChatApi from "../../src/services/chatApi";
import SocketService from "../../src/services/socketService";

const ChatListScreen = () => {
    const router = useRouter();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadConversations = async () => {
        try {
            const data = await ChatApi.getConversations();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadConversations();

            let isMounted = true;

            const handleConversationUpdated = (data: any) => {
                console.log("[ChatList] conversation_updated received:", data);
                if (!isMounted) return;
                setConversations((prev) => {
                    const existingIndex = prev.findIndex((c) => c.conversationId === data.conversationId);
                    if (existingIndex > -1) {
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], ...data };
                        return updated.sort((a, b) => {
                            const aTime = new Date(a.lastMessageTimestamp || a.createdAt || 0).getTime();
                            const bTime = new Date(b.lastMessageTimestamp || b.createdAt || 0).getTime();
                            return bTime - aTime;
                        });
                    } else {
                        loadConversations();
                        return prev;
                    }
                });
            };

            const handleGroupDissolved = (data: any) => {
                console.log("[ChatList] group_dissolved received:", data);
                if (!isMounted) return;
                setConversations((prev) => prev.filter((c) => c.conversationId !== data.conversationId));
            };

            const initSocket = async () => {
                await SocketService.connect();
                if (!isMounted) return;
                console.log("[ChatList] Socket connected, registering listeners");
                SocketService.on("conversation_updated", handleConversationUpdated);
                SocketService.on("group_dissolved", handleGroupDissolved);
            };

            initSocket();

            return () => {
                isMounted = false;
                console.log("[ChatList] Cleanup: removing listeners");
                SocketService.off("conversation_updated", handleConversationUpdated);
                SocketService.off("group_dissolved", handleGroupDissolved);
            };
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadConversations();
    };

    const navigateToChat = (conversation: any) => {
        router.push({
            pathname: "/chat/[id]",
            params: {
                id: conversation.conversationId,
                conversationName: conversation.name,
                avatar: conversation.avatarPath,
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        const lastMessage = item.lastMessage?.content || "No messages yet";
        const time = item.lastMessageTimestamp ? new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

        return (
            <TouchableOpacity style={styles.conversationItem} onPress={() => navigateToChat(item)}>
                <Image
                    source={item.avatarPath ? { uri: item.avatarPath } : (item.type === "group" ? { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.name) + "&background=ff914c&color=fff" } : require("../../src/assets/images/user-avatar.jpg"))}
                    style={styles.avatar}
                />
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.time}>{time}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                            {lastMessage}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF4B3A" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tin nhắn</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={() => router.push("/chat/create-group")} style={styles.headerButton}>
                        <Ionicons name="people-outline" size={26} color="#FF4B3A" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/chat/new")} style={styles.headerButton}>
                        <Ionicons name="create-outline" size={24} color="#FF4B3A" />
                    </TouchableOpacity>
                </View>
            </View>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item.conversationId}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF4B3A"]} />}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Chưa có tin nhắn nào.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerButton: {
        marginLeft: 15,
        padding: 5,
    },
    newChatButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        paddingBottom: 20,
    },
    conversationItem: {
        flexDirection: "row",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
        alignItems: "center",
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#eee",
    },
    contentContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    name: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        flex: 1,
    },
    time: {
        fontSize: 12,
        color: "#888",
        marginLeft: 10,
    },
    messageRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    lastMessage: {
        fontSize: 14,
        color: "#666",
        flex: 1,
    },
    unreadMessage: {
        fontWeight: "600",
        color: "#333",
    },
    unreadBadge: {
        backgroundColor: "#FF4B3A",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
        marginLeft: 10,
    },
    unreadText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 100,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: "#888",
    },
});

export default ChatListScreen;
