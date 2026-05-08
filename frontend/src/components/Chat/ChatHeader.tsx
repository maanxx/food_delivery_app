import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ChatColors } from "../../theme/chatTheme";

interface ChatHeaderProps {
    name: string;
    avatar: string;
    isOnline?: boolean;
    isGroup?: boolean;
    onCall?: () => void;
    onVideoCall?: () => void;
    onInfo?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    name,
    avatar,
    isOnline,
    isGroup,
    onCall,
    onVideoCall,
    onInfo
}) => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color={ChatColors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.userInfo} onPress={onInfo}>
                    <View style={styles.avatarContainer}>
                        <ExpoImage
                            source={avatar ? { uri: avatar } : (isGroup ? { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=ff914c&color=fff" } : require("../../assets/images/user-avatar.jpg"))}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                        {isOnline && !isGroup && <View style={styles.onlineIndicator} />}
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={styles.name} numberOfLines={1}>{name}</Text>
                        <Text style={styles.status}>
                            {isGroup ? "Nhấn để xem thông tin" : (isOnline ? "Đang hoạt động" : "Ngoại tuyến")}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.right}>
                <TouchableOpacity style={styles.actionButton} onPress={onCall}>
                    <Feather name="phone" size={22} color={ChatColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onVideoCall}>
                    <Feather name="video" size={24} color={ChatColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onInfo}>
                    <Ionicons name="information-circle-outline" size={26} color={ChatColors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingBottom: 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f2f2f7",
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    backButton: {
        padding: 8,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: ChatColors.online,
        borderWidth: 2,
        borderColor: "#fff",
    },
    nameContainer: {
        marginLeft: 10,
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: "700",
        color: ChatColors.black,
    },
    status: {
        fontSize: 12,
        color: ChatColors.gray,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
});

export default ChatHeader;
