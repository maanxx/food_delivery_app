import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { AppColors } from "../assets/styles/AppColor";

// Define navigation types
export type RootStackParamList = {
    OrderSuccess: undefined;
    // Add other screens here
    Home: undefined;
    Cart: undefined;
};

type OrderSuccessScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "OrderSuccess">;

interface OrderSuccessScreenProps {}

const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = () => {
    const navigation = useNavigation<OrderSuccessScreenNavigationProp>();

    const handleGoBack = () => {
        navigation.navigate("Main");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>✓</Text>
                </View>

                <Text style={styles.title}>Thành công!</Text>

                <Text style={styles.message}>Thanh toán của bạn đã thành công.</Text>

                <Text style={styles.message}>Hóa đơn cho giao dịch này đã được{"\n"}gửi đến email của bạn.</Text>
            </View>

            {/* Go Back Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleGoBack}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AppColors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    icon: {
        fontSize: 36,
        color: "#fff",
        fontWeight: "bold",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
        textAlign: "center",
    },
    message: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 8,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 34,
        paddingTop: 20,
    },
    button: {
        backgroundColor: AppColors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
});

export default OrderSuccessScreen;
