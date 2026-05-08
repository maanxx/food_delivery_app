import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { ChatColors } from "../../theme/chatTheme";

interface VoicePlayerProps {
    url: string;
    duration?: number;
    isMyMessage?: boolean;
}

const VoicePlayer = ({ url, duration, isMyMessage }: VoicePlayerProps) => {
    const player = useAudioPlayer(url);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const subscription = player.addListener("playingChange", (event) => {
            setIsPlaying(event.playing);
        });
        return () => {
            subscription.remove();
        };
    }, [player]);

    const handlePlayPause = () => {
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const currentTime = player.currentTime;
    const totalTime = player.duration || (duration ? duration : 0);
    const progress = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handlePlayPause} style={[styles.playBtn, { backgroundColor: isMyMessage ? "#fff" : ChatColors.primary }]}>
                {player.status === "loading" ? (
                    <ActivityIndicator size="small" color={isMyMessage ? ChatColors.primary : "#fff"} />
                ) : (
                    <Ionicons 
                        name={isPlaying ? "pause" : "play"} 
                        size={22} 
                        color={isMyMessage ? ChatColors.primary : "#fff"} 
                    />
                )}
            </TouchableOpacity>
            
            <View style={styles.waveformContainer}>
                <View style={[styles.progressBar, { backgroundColor: isMyMessage ? "rgba(255,255,255,0.3)" : "#e5e5ea" }]}>
                    <View style={[
                        styles.progressFill, 
                        { width: `${progress}%`, backgroundColor: isMyMessage ? "#fff" : ChatColors.primary }
                    ]} />
                </View>
                <View style={styles.timeContainer}>
                    <Text style={[styles.time, { color: isMyMessage ? "rgba(255,255,255,0.8)" : ChatColors.gray }]}>
                        {formatTime(currentTime)} / {formatTime(totalTime)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        minWidth: 180,
        paddingVertical: 4,
    },
    playBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    waveformContainer: {
        flex: 1,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
    },
    timeContainer: {
        marginTop: 4,
    },
    time: {
        fontSize: 10,
        fontWeight: "500",
    },
});

export default VoicePlayer;
