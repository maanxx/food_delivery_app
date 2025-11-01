import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors } from "../src/constants/Colors";

export default function Index() {
    const { user, isLoading, checkAuthStatus } = useAuth();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.white }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Redirect based on authentication status
    if (user) {
        return <Redirect href="/splash" />;
    } else {
        return <Redirect href="/login" />;
    }
}
