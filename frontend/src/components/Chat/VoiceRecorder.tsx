import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";
import { ChatColors } from "../../theme/chatTheme";

const { width } = Dimensions.get("window");

interface VoiceRecorderProps {
    onSend: (uri: string, duration: number) => void;
    onRecordingStatusChange?: (isRecording: boolean) => void;
}

const VoiceRecorder = ({ onSend, onRecordingStatusChange }: VoiceRecorderProps) => {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(recorder);
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    
    const animatedScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setIsRecording(recorderState.isRecording);
        setDuration(Math.floor(recorderState.durationMillis / 1000));
        onRecordingStatusChange?.(recorderState.isRecording);
    }, [recorderState.isRecording, recorderState.durationMillis]);

    const startRecording = async () => {
        try {
            const { granted } = await requestRecordingPermissionsAsync();
            if (!granted) return;

            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            
            await recorder.prepareToRecordAsync();
            recorder.record();
            
            Animated.loop(
                Animated.sequence([
                    Animated.timing(animatedScale, { toValue: 1.5, duration: 600, useNativeDriver: true }),
                    Animated.timing(animatedScale, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    };

    const stopRecording = async (shouldSend: boolean) => {
        if (!recorder.isRecording && !isRecording) return;
        
        animatedScale.setValue(1);
        
        try {
            await recorder.stopAsync();
            const uri = recorder.uri;
            const finalDuration = Math.floor(recorderState.durationMillis / 1000);
            
            if (shouldSend && uri && finalDuration > 0) {
                onSend(uri, finalDuration);
            }
        } catch (error) {
            console.error("Failed to stop recording", error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    if (!isRecording) {
        return (
            <TouchableOpacity 
                style={styles.micButton} 
                onLongPress={startRecording}
            >
                <Ionicons name="mic" size={24} color={ChatColors.primary} />
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.expandedContainer}>
            <View style={styles.leftInfo}>
                <Animated.View style={[styles.pulse, { transform: [{ scale: animatedScale }] }]} />
                <Ionicons name="mic" size={24} color={ChatColors.primary} />
                <Text style={styles.timer}>{formatTime(duration)}</Text>
            </View>
            
            <View style={styles.slideContainer}>
                <Text style={styles.slideText}>Vuốt để hủy</Text>
            </View>

            <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => stopRecording(false)}
            >
                <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.sendBtn} 
                onPress={() => stopRecording(true)}
            >
                <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    micButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    expandedContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        zIndex: 50,
    },
    leftInfo: {
        flexDirection: "row",
        alignItems: "center",
        width: 100,
    },
    pulse: {
        position: "absolute",
        left: -4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255, 75, 58, 0.15)",
    },
    timer: {
        fontSize: 16,
        fontWeight: "700",
        color: ChatColors.primary,
        marginLeft: 8,
    },
    slideContainer: {
        flex: 1,
        alignItems: "center",
    },
    slideText: {
        color: ChatColors.gray,
        fontSize: 14,
    },
    cancelBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    cancelText: {
        color: ChatColors.gray,
        fontWeight: "600",
        fontSize: 15,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: ChatColors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
});

export default VoiceRecorder;
