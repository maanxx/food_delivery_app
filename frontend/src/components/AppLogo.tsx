import React from "react";
import { StyleSheet, Text, View } from "react-native";

type AppLogoProps = {
    fontSize?: number;
    color?: string;
    fontWeight?: "bold" | "normal";
    fontFamily: string;
};

function AppLogo(props: AppLogoProps) {
    const { fontSize, color, fontWeight, fontFamily } = props;

    return (
        <View style={style.container}>
            <Text
                style={{
                    color: color || "#fff",
                    fontSize: fontSize || 45,
                    fontWeight: fontWeight || "bold",
                    fontFamily: fontFamily || "Lobster",
                    fontStyle: "italic",
                }}
            >
                Eatsy
            </Text>
        </View>
    );
}

const style = StyleSheet.create({
    container: {},
    text: {},
});

export default AppLogo;
