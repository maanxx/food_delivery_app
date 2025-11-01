import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";

interface OrderSuccessData {
    orderNumber: string;
    total: number;
    estimatedDeliveryTime: string;
    paymentMethod: string;
    deliveryAddress: string;
}

const { width, height } = Dimensions.get("window");

const OrderSuccessScreen = () => {
    const router = useRouter();
    const { orderNumber, total, estimatedTime, paymentMethod, address } = useLocalSearchParams();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const confettiAnim = useRef(new Animated.Value(0)).current;

    const orderData: OrderSuccessData = {
        orderNumber: (orderNumber as string) || `ORD-${Date.now()}`,
        total: parseInt(total as string) || 225000,
        estimatedDeliveryTime: (estimatedTime as string) || "30-45 phút",
        paymentMethod: (paymentMethod as string) || "Tiền mặt",
        deliveryAddress: (address as string) || "123 Nguyễn Huệ, Q.1, TP.HCM",
    };

    useEffect(() => {
        // Success animation sequence
        Animated.sequence([
            // Scale in the success icon
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            // Fade in content
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Confetti animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(confettiAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(confettiAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Auto redirect after 10 seconds
        const timer = setTimeout(() => {
            handleGoToOrderHistory();
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const handleTrackOrder = () => {
        router.push(`/order-tracking?orderId=${Date.now()}`);
    };

    const handleGoToOrderHistory = () => {
        router.replace("/(tabs)/orders");
    };

    const handleContinueShopping = () => {
        router.replace("/(tabs)/");
    };

    const renderConfetti = () => {
        const confettiItems = Array.from({ length: 20 }, (_, index) => (
            <Animated.View
                key={index}
                style={[
                    styles.confettiItem,
                    {
                        left: Math.random() * width,
                        backgroundColor: [AppColors.primary, "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1"][
                            Math.floor(Math.random() * 5)
                        ],
                        transform: [
                            {
                                translateY: confettiAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-50, height + 50],
                                }),
                            },
                            {
                                rotate: confettiAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ["0deg", "360deg"],
                                }),
                            },
                        ],
                    },
                ]}
            />
        ));

        return <View style={styles.confettiContainer}>{confettiItems}</View>;
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderConfetti()}

            <View style={styles.content}>
                {/* Success Icon */}
                <Animated.View
                    style={[
                        styles.successIconContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.successIcon}>
                        <MaterialIcons name="check" size={60} color="#fff" />
                    </View>
                    <View style={styles.successRing} />
                </Animated.View>

                {/* Success Message */}
                <Animated.View
                    style={[
                        styles.messageContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.successTitle}>Đặt hàng thành công!</Text>
                    <Text style={styles.successSubtitle}>
                        Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
                    </Text>
                </Animated.View>

                {/* Order Details */}
                <Animated.View
                    style={[
                        styles.orderDetailsContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderNumber}>#{orderData.orderNumber}</Text>
                            <View style={styles.statusBadge}>
                                <MaterialIcons name="schedule" size={16} color="#fff" />
                                <Text style={styles.statusText}>Đang xử lý</Text>
                            </View>
                        </View>

                        <View style={styles.orderDetails}>
                            <View style={styles.detailRow}>
                                <MaterialIcons name="payments" size={20} color="#666" />
                                <Text style={styles.detailLabel}>Tổng tiền:</Text>
                                <Text style={styles.detailValue}>{formatPrice(orderData.total)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <MaterialIcons name="payment" size={20} color="#666" />
                                <Text style={styles.detailLabel}>Thanh toán:</Text>
                                <Text style={styles.detailValue}>{orderData.paymentMethod}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <MaterialIcons name="access-time" size={20} color="#666" />
                                <Text style={styles.detailLabel}>Thời gian giao:</Text>
                                <Text style={styles.detailValue}>{orderData.estimatedDeliveryTime}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <MaterialIcons name="location-on" size={20} color="#666" />
                                <Text style={styles.detailLabel}>Địa chỉ:</Text>
                                <Text style={[styles.detailValue, styles.addressText]} numberOfLines={2}>
                                    {orderData.deliveryAddress}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Estimated Delivery */}
                <Animated.View
                    style={[
                        styles.deliveryInfoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.deliveryInfo}>
                        <MaterialIcons name="delivery-dining" size={32} color={AppColors.primary} />
                        <View style={styles.deliveryText}>
                            <Text style={styles.deliveryTitle}>Dự kiến giao hàng</Text>
                            <Text style={styles.deliveryTime}>{orderData.estimatedDeliveryTime}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Action Buttons */}
                <Animated.View
                    style={[
                        styles.actionsContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder} activeOpacity={0.8}>
                        <MaterialIcons name="location-searching" size={20} color="#fff" />
                        <Text style={styles.trackButtonText}>Theo dõi đơn hàng</Text>
                    </TouchableOpacity>

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleGoToOrderHistory}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="history" size={18} color={AppColors.primary} />
                            <Text style={styles.secondaryButtonText}>Lịch sử đơn hàng</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleContinueShopping}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="shopping-bag" size={18} color={AppColors.primary} />
                            <Text style={styles.secondaryButtonText}>Tiếp tục mua sắm</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Auto redirect notice */}
                <Animated.View
                    style={[
                        styles.autoRedirectNotice,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <Text style={styles.autoRedirectText}>Tự động chuyển đến lịch sử đơn hàng sau 10 giây</Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    confettiContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        pointerEvents: "none",
    },
    confettiItem: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        zIndex: 2,
    },
    successIconContainer: {
        alignItems: "center",
        marginBottom: 30,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    successRing: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        borderColor: "#4CAF50",
        opacity: 0.3,
    },
    messageContainer: {
        alignItems: "center",
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
        textAlign: "center",
    },
    successSubtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    orderDetailsContainer: {
        width: "100%",
        marginBottom: 20,
    },
    orderCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    orderNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFA726",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#fff",
    },
    orderDetails: {
        gap: 15,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    detailLabel: {
        flex: 1,
        fontSize: 15,
        color: "#666",
        fontWeight: "500",
    },
    detailValue: {
        fontSize: 15,
        color: "#333",
        fontWeight: "600",
        textAlign: "right",
    },
    addressText: {
        flex: 2,
        fontSize: 14,
    },
    deliveryInfoContainer: {
        width: "100%",
        marginBottom: 30,
    },
    deliveryInfo: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 15,
    },
    deliveryText: {
        flex: 1,
    },
    deliveryTitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    deliveryTime: {
        fontSize: 20,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    actionsContainer: {
        width: "100%",
        alignItems: "center",
        gap: 15,
    },
    trackButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: AppColors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        shadowColor: AppColors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        gap: 8,
    },
    trackButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    secondaryActions: {
        flexDirection: "row",
        gap: 15,
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: AppColors.primary,
        gap: 6,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: AppColors.primary,
    },
    autoRedirectNotice: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    autoRedirectText: {
        fontSize: 12,
        color: "#999",
        textAlign: "center",
        fontStyle: "italic",
    },
});

export default OrderSuccessScreen;
