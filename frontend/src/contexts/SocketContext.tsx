import React, { createContext, useContext, useEffect, ReactNode } from "react";
import SocketService from "../services/socketService";
import { useAuth } from "./AuthContext";

interface SocketContextType {
    socket: typeof SocketService;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            console.log("[SocketProvider] Authenticated, connecting socket...");
            SocketService.connect();
        } else {
            console.log("[SocketProvider] Unauthenticated, disconnecting socket...");
            SocketService.disconnect();
        }

        return () => {
            // Cleanup only on unmount if needed, 
            // but usually we want to keep it connected as long as auth is valid
        };
    }, [isAuthenticated, user]);

    return (
        <SocketContext.Provider value={{ socket: SocketService, isConnected: SocketService.isConnected() }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};

export default SocketContext;
