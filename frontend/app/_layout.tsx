import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/contexts/AuthContext";
import { FoodProvider } from "../src/contexts/FoodContext";
import { CartProvider } from "../src/contexts/CartContext";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <FoodProvider>
                    <CartProvider>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="login" />
                            <Stack.Screen name="register" />
                            <Stack.Screen name="forgot-password" />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        </Stack>
                    </CartProvider>
                </FoodProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
