import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Animated, Dimensions, Vibration } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import SocketService from "../../services/socketService";
import ChatApi from "../../services/chatApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

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
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    
    const [callStatus, setCallStatus] = useState<"ringing" | "connecting" | "connected">("ringing");
    const [callDuration, setCallDuration] = useState(0);

    const pcRef = useRef<any>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem("user_data");
            if (userData) setCurrentUser(JSON.parse(userData));
        };
        loadUser();

        if (incomingCall) {
            startPulse();
            Vibration.vibrate([1000, 2000], true); 
        } else {
            Vibration.cancel();
        }

        if (activeCall && activeCall.isInitiator && callStatus === "ringing") {
            ringingTimeoutRef.current = setTimeout(() => {
                handleEndCall();
            }, 30000);
        } else if (incomingCall) {
            ringingTimeoutRef.current = setTimeout(() => {
                handleReject();
            }, 30000);
        }

        const handleOffer = async (data: any) => {
            if (isExpoGo) return;
            console.log("[CallOverlay] Received offer:", data);
            await handleOfferSignal(data.offer, data.fromUserId);
        };

        const handleAnswer = async (data: any) => {
            if (isExpoGo) return;
            console.log("[CallOverlay] Received answer:", data);
            await handleAnswerSignal(data.answer);
        };

        const handleCandidate = async (data: any) => {
            if (isExpoGo) return;
            console.log("[CallOverlay] Received ice_candidate");
            
            const candidatePayload = typeof data.candidate === 'object' && data.candidate !== null
                ? data.candidate
                : {
                    candidate: data.candidate,
                    sdpMLineIndex: data.sdpMLineIndex !== undefined ? data.sdpMLineIndex : 0,
                    sdpMid: data.sdpMid || "0"
                };

            await handleCandidateSignal(candidatePayload);
        };

        SocketService.on("offer", handleOffer);
        SocketService.on("answer", handleAnswer);
        SocketService.on("ice_candidate", handleCandidate);

        return () => {
            SocketService.off("offer", handleOffer);
            SocketService.off("answer", handleAnswer);
            SocketService.off("ice_candidate", handleCandidate);
            Vibration.cancel();
            if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
        };
    }, [currentUser, incomingCall, activeCall]);

    useEffect(() => {
        if (callStatus === "connected") {
            timerIntervalRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [callStatus]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const createPeerConnection = async (targetId: string, isVideo: boolean) => {
        if (isExpoGo || !RTCPeerConnection) return null;
        
        const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;

        pc.onicecandidate = (event: any) => {
            if (event.candidate) {
                // Send in a format perfectly compatible with simple-peer on the Web
                SocketService.emit("ice_candidate", {
                    callId: activeCall?.callId || incomingCall?.callId,
                    candidate: {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid
                    },
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid,
                    toUserId: targetId,
                    fromUserId: currentUser?.user_id || currentUser?.id
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("[CallOverlay] ICE Connection State:", pc.iceConnectionState);
            if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                setCallStatus("connected");
                if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
            } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "closed" || pc.iceConnectionState === "disconnected") {
                handleEndCall();
            }
        };

        pc.ontrack = (event: any) => {
            console.log("[CallOverlay] Remote track received");
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

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

    const initiateWebRTC = async (targetId: string, isVideo: boolean) => {
        if (isExpoGo) return;
        setCallStatus("connecting");
        const pc = await createPeerConnection(targetId, isVideo);
        if (!pc) return;
        
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            SocketService.emit("offer", {
                callId: activeCall?.callId,
                offer: { type: offer.type, sdp: offer.sdp },
                toUserId: targetId,
                fromUserId: currentUser?.user_id || currentUser?.id
            });
        } catch (err) {
            console.error("[CallOverlay] Failed to initiate WebRTC:", err);
        }
    };

    const handleOfferSignal = async (offer: any, fromId: string) => {
        if (isExpoGo) return;
        setCallStatus("connecting");
        const pc = await createPeerConnection(fromId, activeCall?.type === "video");
        if (!pc) return;
        
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            SocketService.emit("answer", {
                callId: activeCall?.callId || incomingCall?.callId,
                answer: { type: answer.type, sdp: answer.sdp },
                toUserId: fromId,
                fromUserId: currentUser?.user_id || currentUser?.id
            });
        } catch (err) {
            console.error("[CallOverlay] Failed to handle offer:", err);
        }
    };

    const handleAnswerSignal = async (answer: any) => {
        if (pcRef.current) {
            try {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error("[CallOverlay] Failed to set remote desc:", err);
            }
        }
    };

    const handleCandidateSignal = async (candidate: any) => {
        if (pcRef.current) {
            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error("[CallOverlay] Failed to add ICE candidate:", err);
            }
        }
    };

    const cleanupCall = () => {
        Vibration.cancel();
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
        
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
        setIsFrontCamera(true);
        setCallStatus("ringing");
        setCallDuration(0);
        contextCleanup();
    };

    useEffect(() => {
        if (activeCall && activeCall.isInitiator && !pcRef.current && callStatus === "ringing") {
            console.log("[CallOverlay] Call accepted, initiating WebRTC offer...");
            initiateWebRTC(activeCall.recipientId, activeCall.type === "video");
        }
    }, [activeCall, callStatus]);

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
        Vibration.cancel();
        if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
        
        try {
            await ChatApi.acceptCall(incomingCall.callId);
            setIncomingCall(null);
            setActiveCall(incomingCall);
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
        if (!activeCall && !incomingCall) return;
        const targetId = activeCall?.callId || activeCall?.id || activeCall?.call_id || incomingCall?.callId || incomingCall?.call_id;
        try {
            await ChatApi.endCall(targetId);
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

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track: any) => {
                if (typeof track._switchCamera === "function") {
                    track._switchCamera();
                }
            });
            setIsFrontCamera(!isFrontCamera);
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

            {/* Active Call Modal */}
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
                                    <TouchableOpacity style={styles.flipCameraBtn} onPress={toggleCamera}>
                                        <Ionicons name="camera-reverse" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.callDetails}>
                                <Text style={styles.activeCallerName}>{activeCall?.callerName || "Đang trong cuộc gọi"}</Text>
                                <Text style={styles.activeTimer}>
                                    {callStatus === "ringing" ? "Đang đổ chuông..." : 
                                     callStatus === "connecting" ? "Đang kết nối..." :
                                     formatDuration(callDuration)}
                                </Text>
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
    localVideoContainer: { position: "absolute", top: 50, right: 20, width: 100, height: 160, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "#fff", backgroundColor: "#000" },
    localVideo: { width: "100%", height: "100%" },
    flipCameraBtn: { position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(0,0,0,0.5)", padding: 5, borderRadius: 20 },
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
