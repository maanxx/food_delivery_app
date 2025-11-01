import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/contexts/AuthContext";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="register" />
                    <Stack.Screen name="forgot-password" />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
