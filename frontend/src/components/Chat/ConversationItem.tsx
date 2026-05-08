import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Image as ExpoImage } from "expo-image";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { ChatColors } from "../../theme/chatTheme";

interface ConversationItemProps {
    item: any;
    onPress: (item: any) => void;
    onDelete: (id: string) => void;
    onMute: (id: string) => void;
    onArchive: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
    item, 
    onPress, 
    onDelete, 
    onMute, 
    onArchive 
}) => {
    const lastMessage = item.lastMessage?.content || "Chưa có tin nhắn";
    const time = item.lastMessageTimestamp 
        ? new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : "";

    const renderRightActions = (progress: any, dragX: any) => {
        const trans = dragX.interpolate({
            inputRange: [-180, -120, -60, 0],
            outputRange: [0, 0, 0, 100],
        });

        return (
            <View style={styles.rightActions}>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: "#8E8E93" }]} 
                    onPress={() => onArchive(item.conversationId)}
                >
                    <Ionicons name="archive-outline" size={20} color="#fff" />
                    <Text style={styles.actionText}>Lưu trữ</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: "#FF9500" }]} 
                    onPress={() => onMute(item.conversationId)}
                >
                    <Ionicons name="notifications-off-outline" size={20} color="#fff" />
                    <Text style={styles.actionText}>Tắt</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: "#FF3B30" }]} 
                    onPress={() => onDelete(item.conversationId)}
                >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.actionText}>Xóa</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Swipeable renderRightActions={renderRightActions}>
            <TouchableOpacity style={styles.container} onPress={() => onPress(item)} activeOpacity={0.7}>
                <View style={styles.avatarContainer}>
                    <ExpoImage
                        source={item.avatarPath ? { uri: item.avatarPath } : (item.type === "group" ? { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.name) + "&background=ff914c&color=fff" } : require("../../assets/images/user-avatar.jpg"))}
                        style={styles.avatar}
                        contentFit="cover"
                        transition={200}
                    />
                    {item.isOnline && !item.isGroup && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.time, item.unreadCount > 0 && styles.unreadTime]}>{time}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                            {item.isTyping ? (
                                <Text style={styles.typingText}>Đang nhập...</Text>
                            ) : lastMessage}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        alignItems: "center",
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f0f0f0",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: ChatColors.online,
        borderWidth: 2,
        borderColor: "#fff",
    },
    content: {
        flex: 1,
        marginLeft: 12,
        justifyContent: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    name: {
        fontSize: 17,
        fontWeight: "600",
        color: ChatColors.black,
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 13,
        color: ChatColors.gray,
    },
    unreadTime: {
        color: ChatColors.primary,
        fontWeight: "600",
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    lastMessage: {
        fontSize: 15,
        color: ChatColors.gray,
        flex: 1,
        marginRight: 10,
    },
    unreadMessage: {
        color: ChatColors.black,
        fontWeight: "600",
    },
    typingText: {
        color: ChatColors.primary,
        fontStyle: "italic",
    },
    badge: {
        backgroundColor: ChatColors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
    },
    badgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "bold",
    },
    rightActions: {
        flexDirection: "row",
        width: 180,
    },
    actionButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    actionText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "600",
        marginTop: 4,
    },
});

export default ConversationItem;
