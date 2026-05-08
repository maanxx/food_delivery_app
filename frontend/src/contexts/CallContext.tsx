    import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import SocketService from "../services/socketService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CallContextType {
    incomingCall: any;
    activeCall: any;
    setIncomingCall: (call: any) => void;
    setActiveCall: (call: any) => void;
    cleanupCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [activeCall, setActiveCall] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem("user_data");
            if (userData) setCurrentUser(JSON.parse(userData));
        };
        loadUser();

        const handleCallRequest = (data: any) => {
            console.log("[CallProvider] Incoming call request:", data);
            // Don't show if I'm the caller
            if (data.callerId === currentUser?.user_id || data.callerId === currentUser?.id) return;
            setIncomingCall(data);
        };

        const handleCallResponse = (data: any) => {
            console.log("[CallProvider] Call response:", data);
            if (data.status === "accepted") {
                setIncomingCall(null);
                setActiveCall(data);
            } else {
                setIncomingCall(null);
                setActiveCall(null);
            }
        };

        const handleCallEnded = () => {
            console.log("[CallProvider] Call ended");
            cleanupCall();
        };

        SocketService.on("call_request", handleCallRequest);
        SocketService.on("call_response", handleCallResponse);
        SocketService.on("call_ended", handleCallEnded);

        return () => {
            SocketService.off("call_request", handleCallRequest);
            SocketService.off("call_response", handleCallResponse);
            SocketService.off("call_ended", handleCallEnded);
        };
    }, [currentUser]);

    const cleanupCall = () => {
        setIncomingCall(null);
        setActiveCall(null);
    };

    return (
        <CallContext.Provider value={{ incomingCall, activeCall, setIncomingCall, setActiveCall, cleanupCall }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error("useCall must be used within a CallProvider");
    }
    return context;
};
