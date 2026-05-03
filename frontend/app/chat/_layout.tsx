import React from "react";
import { Stack } from "expo-router";

export default function ChatLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="new" options={{ presentation: "modal" }} />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
