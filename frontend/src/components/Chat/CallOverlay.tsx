import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import SocketService from "../../services/socketService";
import ChatApi from "../../services/chatApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safe WebRTC imports for Expo Go
let RTCPeerConnection: any;
let RTCIceCandidate: any;
let RTCSessionDescription: any;
let mediaDevices: any;
let RTCView: any;

if (!isExpoGo) {
    try {
        const WebRTC = require("react-native-webrtc");
        RTCPeerConnection = WebRTC.RTCPeerConnection;
        RTCIceCandidate = WebRTC.RTCIceCandidate;
        RTCSessionDescription = WebRTC.RTCSessionDescription;
        mediaDevices = WebRTC.mediaDevices;
        RTCView = WebRTC.RTCView;
    } catch (e) {
        console.warn("WebRTC native modules not found. Voice/Video calls disabled.");
    }
}

import { useCall } from "../../contexts/CallContext";

const CallOverlay = () => {
    const { incomingCall, activeCall, setIncomingCall, setActiveCall, cleanupCall: contextCleanup } = useCall();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [localStream, setLocalStream] = useState<any>(null);
    const [remoteStream, setRemoteStream] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    
    const pcRef = useRef<any>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem("user_data");
            if (userData) setCurrentUser(JSON.parse(userData));
        };
        loadUser();

        if (incomingCall) {
            startPulse();
        }

        const handleWebRTCSignal = async (data: any) => {
            if (isExpoGo) return;
            console.log("[CallOverlay] WebRTC signal received:", data.type);
            const { signal, fromId } = data;
            
            if (signal.type === "offer") {
                await handleOffer(signal, fromId);
            } else if (signal.type === "answer") {
                await handleAnswer(signal);
            } else if (signal.type === "candidate") {
                await handleCandidate(signal);
            }
        };

        SocketService.on("webrtc_signal", handleWebRTCSignal);

        return () => {
            SocketService.off("webrtc_signal", handleWebRTCSignal);
        };
    }, [currentUser, incomingCall]);

    const createPeerConnection = async (targetId: string, isVideo: boolean) => {
        if (isExpoGo || !RTCPeerConnection) return null;
        
        const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;

        pc.onicecandidate = (event: any) => {
            if (event.candidate) {
                SocketService.emitWebRTCSignal({
                    callId: activeCall?.callId || incomingCall?.callId,
                    signal: { type: "candidate", candidate: event.candidate },
                    targetId
                });
            }
        };

        pc.ontrack = (event: any) => {
            console.log("[CallOverlay] Remote track received");
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        // Get local stream
        const constraints = {
            audio: true,
            video: isVideo ? { facingMode: "user" } : false
        };

        try {
            const stream = await mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));
        } catch (error) {
            console.error("[CallOverlay] Failed to get local stream:", error);
        }

        return pc;
    };

    const handleOffer = async (offer: any, fromId: string) => {
        if (isExpoGo) return;
        const pc = await createPeerConnection(fromId, incomingCall?.type === "video");
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        SocketService.emitWebRTCSignal({
            callId: incomingCall?.callId,
            signal: answer,
            targetId: fromId
        });
    };

    const handleAnswer = async (answer: any) => {
        if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleCandidate = async (signal: any) => {
        if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    };

    const cleanupCall = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach((track: any) => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setIsMuted(false);
        setIsVideoOff(false);
        contextCleanup();
    };

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    };

    const handleAccept = async () => {
        if (!incomingCall) return;
        try {
            await ChatApi.acceptCall(incomingCall.callId);
            setIncomingCall(null);
            setActiveCall(incomingCall);
            // Signal setup will happen when handleOffer is triggered by socket
        } catch (error) {
            console.error("Failed to accept call:", error);
        }
    };

    const handleReject = async () => {
        if (!incomingCall) return;
        try {
            await ChatApi.rejectCall(incomingCall.callId);
            cleanupCall();
        } catch (error) {
            console.error("Failed to reject call:", error);
        }
    };

    const handleEndCall = async () => {
        if (!activeCall) return;
        try {
            await ChatApi.endCall(activeCall.callId || activeCall.id);
            cleanupCall();
        } catch (error) {
            console.error("Failed to end call:", error);
            cleanupCall();
        }
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track: any) => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track: any) => {
                track.enabled = isVideoOff;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    if (!incomingCall && !activeCall) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Incoming Call Modal */}
            <Modal visible={!!incomingCall} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.callCard}>
                        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
                            <Image 
                                source={incomingCall?.callerAvatar ? { uri: incomingCall.callerAvatar } : require("../../assets/images/user-avatar.jpg")} 
                                style={styles.avatar} 
                            />
                        </Animated.View>
                        <Text style={styles.callerName}>{incomingCall?.callerName || "Cuộc gọi đến"}</Text>
                        <Text style={styles.callType}>
                            {incomingCall?.type === "video" ? "Cuộc gọi video đến..." : "Cuộc gọi thoại đến..."}
                        </Text>
                        
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={handleReject}>
                                <Ionicons name="close" size={30} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
                                <Ionicons name={incomingCall?.type === "video" ? "videocam" : "call"} size={30} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Active Call Modal (Simplified) */}
            <Modal visible={!!activeCall} transparent animationType="fade">
                <View style={[styles.overlay, { backgroundColor: "#1a1a1a" }]}>
                    {isExpoGo ? (
                        <View style={styles.activeCallContainer}>
                            <Ionicons name="warning" size={50} color="#FF4B3A" />
                            <Text style={[styles.activeCallerName, { marginTop: 20 }]}>Tính năng không hỗ trợ</Text>
                            <Text style={[styles.activeTimer, { textAlign: "center", paddingHorizontal: 40 }]}>
                                Tính năng gọi Voice/Video yêu cầu Development Build. Expo Go không hỗ trợ Native Modules WebRTC.
                            </Text>
                            <TouchableOpacity style={[styles.activeBtn, styles.endCallBtn]} onPress={handleEndCall}>
                                <Ionicons name="close" size={30} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.activeCallContainer}>
                            {activeCall?.type === "video" && remoteStream ? (
                                <RTCView 
                                    streamURL={remoteStream.toURL()} 
                                    style={styles.remoteVideo} 
                                    objectFit="cover" 
                                />
                            ) : (
                                <Image 
                                    source={activeCall?.callerAvatar ? { uri: activeCall.callerAvatar } : require("../../assets/images/user-avatar.jpg")} 
                                    style={styles.largeAvatar} 
                                />
                            )}

                            {activeCall?.type === "video" && localStream && (
                                <View style={styles.localVideoContainer}>
                                    <RTCView 
                                        streamURL={localStream.toURL()} 
                                        style={styles.localVideo} 
                                        objectFit="cover" 
                                    />
                                </View>
                            )}

                            <View style={styles.callDetails}>
                                <Text style={styles.activeCallerName}>{activeCall?.callerName || "Đang trong cuộc gọi"}</Text>
                                <Text style={styles.activeTimer}>00:00</Text>
                            </View>
                            
                            <View style={styles.activeActions}>
                                <TouchableOpacity style={[styles.activeBtn, isMuted && styles.activeBtnOff]} onPress={toggleMute}>
                                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.activeBtn, styles.endCallBtn]} onPress={handleEndCall}>
                                    <Ionicons name="call-outline" size={30} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
                                </TouchableOpacity>
                                {activeCall?.type === "video" && (
                                    <TouchableOpacity style={[styles.activeBtn, isVideoOff && styles.activeBtnOff]} onPress={toggleVideo}>
                                        <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
    callCard: { backgroundColor: "#fff", width: "85%", borderRadius: 30, padding: 30, alignItems: "center" },
    avatarContainer: { marginBottom: 20 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    callerName: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 10 },
    callType: { fontSize: 16, color: "#666", marginBottom: 30 },
    actionButtons: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
    btn: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", elevation: 5 },
    rejectBtn: { backgroundColor: "#ff4d4d" },
    acceptBtn: { backgroundColor: "#4CAF50" },
    
    activeCallContainer: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },
    remoteVideo: { width: "100%", height: "100%", position: "absolute" },
    localVideoContainer: { position: "absolute", top: 50, right: 20, width: 100, height: 150, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "#fff", backgroundColor: "#000" },
    localVideo: { width: "100%", height: "100%" },
    callDetails: { position: "absolute", top: height * 0.4, alignItems: "center" },
    largeAvatar: { width: 150, height: 150, borderRadius: 75, marginBottom: 20, borderWidth: 3, borderColor: "#FF4B3A" },
    activeCallerName: { fontSize: 24, fontWeight: "bold", color: "#fff", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
    activeTimer: { fontSize: 18, color: "rgba(255,255,255,0.7)", marginBottom: 100 },
    activeActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "80%", position: "absolute", bottom: 50 },
    activeBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
    activeBtnOff: { backgroundColor: "#ff4d4d" },
    endCallBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#ff4d4d" },
});

export default CallOverlay;
