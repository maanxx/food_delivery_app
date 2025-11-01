import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Fonts } from "../constants/Fonts";
import { AppColors } from "../assets/styles/AppColor";

export default function CartScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Giỏ hàng</Text>
                <Text style={styles.message}>Giỏ hàng trống</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        color: AppColors.black,
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: AppColors.gray,
        textAlign: "center",
    },
});
