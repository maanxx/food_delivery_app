import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ChatColors } from "../../theme/chatTheme";

interface MessageActionSheetProps {
    isVisible: boolean;
    onClose: () => void;
    onAction: (action: string) => void;
    isMyMessage: boolean;
    canRecall: boolean;
    onReaction: (emoji: string) => void;
}

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🙏"];

const MessageActionSheet: React.FC<MessageActionSheetProps> = ({
    isVisible,
    onClose,
    onAction,
    isMyMessage,
    canRecall,
    onReaction
}) => {
    const handleAction = (action: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onAction(action);
        onClose();
    };

    const handleReaction = (emoji: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onReaction(emoji);
        onClose();
    };

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection={["down"]}
            style={styles.modal}
            backdropOpacity={0.4}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            useNativeDriverForBackdrop
        >
            <View style={styles.container}>
                <View style={styles.handle} />
                
                <View style={styles.reactionRow}>
                    {QUICK_REACTIONS.map((emoji) => (
                        <TouchableOpacity 
                            key={emoji} 
                            style={styles.reactionButton}
                            onPress={() => handleReaction(emoji)}
                        >
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.actionList}>
                    <ActionItem 
                        icon="copy-outline" 
                        label="Sao chép văn bản" 
                        onPress={() => handleAction("copy")} 
                    />
                    <ActionItem 
                        icon="arrow-undo-outline" 
                        label="Trả lời" 
                        onPress={() => handleAction("reply")} 
                    />
                    <ActionItem 
                        icon="arrow-redo-outline" 
                        label="Chuyển tiếp" 
                        onPress={() => handleAction("forward")} 
                    />
                    
                    {isMyMessage && (
                        <ActionItem 
                            icon="pencil-outline" 
                            label="Chỉnh sửa" 
                            onPress={() => handleAction("edit")} 
                        />
                    )}
                    
                    <View style={styles.divider} />
                    
                    {isMyMessage && canRecall && (
                        <ActionItem 
                            icon="refresh-outline" 
                            label="Thu hồi tin nhắn" 
                            color={ChatColors.error}
                            onPress={() => handleAction("recall")} 
                        />
                    )}
                    
                    <ActionItem 
                        icon="trash-outline" 
                        label="Xóa ở phía tôi" 
                        color={ChatColors.error}
                        onPress={() => handleAction("delete_me")} 
                    />
                    
                    {isMyMessage && (
                        <ActionItem 
                            icon="trash-bin-outline" 
                            label="Xóa với mọi người" 
                            color={ChatColors.error}
                            onPress={() => handleAction("delete_everyone")} 
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const ActionItem = ({ icon, label, onPress, color = ChatColors.black }: any) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
        <View style={[styles.iconContainer, { backgroundColor: color === ChatColors.error ? "#FFF2F2" : "#F2F2F7" }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    modal: {
        justifyContent: "flex-end",
        margin: 0,
    },
    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: "#E5E5EA",
        borderRadius: 3,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 20,
    },
    reactionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#F2F2F7",
        padding: 12,
        borderRadius: 30,
        marginBottom: 24,
    },
    reactionButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    reactionEmoji: {
        fontSize: 28,
    },
    actionList: {
        gap: 4,
    },
    actionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    actionLabel: {
        fontSize: 16,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#F2F2F7",
        marginVertical: 12,
    }
});

export default MessageActionSheet;
