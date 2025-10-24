import { StyleSheet } from "react-native";

export const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 0,
        margin: 0,
        width: "100%",
        height: "100%",
    },

    text: {
        color: "#000",
        fontSize: 16,
        fontFamily: "System",
    },

    button: {
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        padding: 10,
        fontSize: 16,
    },

    image: {
        resizeMode: "contain",
    },
});
