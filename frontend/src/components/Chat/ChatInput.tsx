import React, { useState, useRef } from "react";
import { 
    View, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Animated, 
    Keyboard,
    Platform 
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ChatColors } from "../../theme/chatTheme";

interface ChatInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    onAttach: () => void;
    onEmoji: () => void;
    onVoice: () => void;
    isTyping: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChangeText,
    onSend,
    onAttach,
    onEmoji,
    onVoice,
    isTyping
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const sendBtnScale = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.spring(sendBtnScale, {
            toValue: value.trim().length > 0 ? 1 : 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7
        }).start();
    }, [value]);

    const handleSend = () => {
        if (value.trim().length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSend();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TouchableOpacity style={styles.iconButton} onPress={onAttach}>
                    <Feather name="plus-circle" size={24} color={ChatColors.primary} />
                </TouchableOpacity>

                <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhắn tin..."
                        placeholderTextColor={ChatColors.gray}
                        value={value}
                        onChangeText={onChangeText}
                        multiline
                        maxLength={1000}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    <TouchableOpacity style={styles.emojiButton} onPress={onEmoji}>
                        <Ionicons name="happy-outline" size={24} color={ChatColors.gray} />
                    </TouchableOpacity>
                </View>

                {value.trim().length > 0 ? (
                    <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <TouchableOpacity style={styles.iconButton} onPress={onVoice}>
                        <Feather name="mic" size={24} color={ChatColors.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#f2f2f7",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
    },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: "#f2f2f7",
        borderRadius: 22,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 44,
        maxHeight: 120,
    },
    inputContainerFocused: {
        backgroundColor: "#e5e5ea",
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: ChatColors.black,
        paddingTop: 0,
        paddingBottom: 0,
        textAlignVertical: "center",
        lineHeight: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    emojiButton: {
        padding: 4,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: ChatColors.primary,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: ChatColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default ChatInput;
