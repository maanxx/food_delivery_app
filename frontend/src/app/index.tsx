import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppNavigation from "./AppNavigation";
import { GlobalStyles } from "../assets/styles/GlobalStyles";

export default function App() {
    return (
        <SafeAreaProvider style={GlobalStyles.container}>
            <AppNavigation />
        </SafeAreaProvider>
    );
}
