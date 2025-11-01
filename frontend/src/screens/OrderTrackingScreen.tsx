import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Animated,
    Alert,
    Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";

interface OrderStatus {
    id: string;
    status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";
    timestamp: string;
    description: string;
    icon: string;
    color: string;
}

interface DeliveryPerson {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    rating: number;
    vehicle: string;
    vehicleNumber: string;
}

interface OrderDetails {
    id: string;
    orderNumber: string;
    status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        image_url: string;
    }>;
    total: number;
    deliveryFee: number;
    restaurantName: string;
    restaurantPhone: string;
    restaurantAddress: string;
    deliveryAddress: string;
    estimatedDeliveryTime: string;
    orderTime: string;
    paymentMethod: string;
    deliveryPerson?: DeliveryPerson;
    orderHistory: OrderStatus[];
}

const OrderTrackingScreen = () => {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Mock order data
    const mockOrderData: OrderDetails = {
        id: (orderId as string) || "1",
        orderNumber: "ORD-2024-001",
        status: "delivering",
        items: [
            {
                id: "1",
                name: "Whopper Burger",
                quantity: 2,
                price: 85000,
                image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
            },
            {
                id: "2",
                name: "Khoai tây chiên",
                quantity: 1,
                price: 35000,
                image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop",
            },
        ],
        total: 205000,
        deliveryFee: 20000,
        restaurantName: "Burger King",
        restaurantPhone: "+84 901 234 567",
        restaurantAddress: "123 Nguyễn Huệ, Q.1, TP.HCM",
        deliveryAddress: "456 Lê Lợi, Q.3, TP.HCM",
        estimatedDeliveryTime: "15:30",
        orderTime: "14:30",
        paymentMethod: "Tiền mặt",
        deliveryPerson: {
            id: "delivery_1",
            name: "Nguyễn Văn A",
            phone: "+84 912 345 678",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            rating: 4.8,
            vehicle: "Xe máy",
            vehicleNumber: "59A1-12345",
        },
        orderHistory: [
            {
                id: "1",
                status: "pending",
                timestamp: "14:30",
                description: "Đơn hàng đã được đặt",
                icon: "schedule",
                color: "#FFA726",
            },
            {
                id: "2",
                status: "confirmed",
                timestamp: "14:32",
                description: "Nhà hàng đã xác nhận đơn hàng",
                icon: "check-circle",
                color: "#42A5F5",
            },
            {
                id: "3",
                status: "preparing",
                timestamp: "14:35",
                description: "Nhà hàng đang chuẩn bị món ăn",
                icon: "restaurant",
                color: "#FF7043",
            },
            {
                id: "4",
                status: "delivering",
                timestamp: "15:10",
                description: "Shipper đang giao hàng đến bạn",
                icon: "delivery-dining",
                color: "#66BB6A",
            },
        ],
    };

    useEffect(() => {
        loadOrderDetails();
    }, []);

    useEffect(() => {
        if (orderDetails) {
            const statusIndex = orderDetails.orderHistory.findIndex((item) => item.status === orderDetails.status);
            setCurrentStep(statusIndex);

            Animated.timing(progressAnim, {
                toValue: statusIndex / (orderDetails.orderHistory.length - 1),
                duration: 1000,
                useNativeDriver: false,
            }).start();

            if (orderDetails.status === "delivering") {
                const pulse = () => {
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.2,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ]).start(() => pulse());
                };
                pulse();
            }
        }
    }, [orderDetails, progressAnim, pulseAnim]);

    const loadOrderDetails = async () => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setOrderDetails(mockOrderData);
        } catch (error) {
            console.error("Load order details error:", error);
            Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng");
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const handleCallRestaurant = () => {
        if (orderDetails?.restaurantPhone) {
            Linking.openURL(`tel:${orderDetails.restaurantPhone}`);
        }
    };

    const handleCallDelivery = () => {
        if (orderDetails?.deliveryPerson?.phone) {
            Linking.openURL(`tel:${orderDetails.deliveryPerson.phone}`);
        }
    };

    const handleCancelOrder = () => {
        Alert.alert("Hủy đơn hàng", "Bạn có chắc chắn muốn hủy đơn hàng này?", [
            { text: "Không", style: "cancel" },
            {
                text: "Hủy đơn",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Thành công", "Đơn hàng đã được hủy");
                    router.back();
                },
            },
        ]);
    };

    const renderProgressBar = () => {
        if (!orderDetails) return null;

        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ["0%", "100%"],
                                }),
                            },
                        ]}
                    />
                </View>

                <View style={styles.stepsContainer}>
                    {orderDetails.orderHistory.map((step, index) => (
                        <View key={step.id} style={styles.stepContainer}>
                            <Animated.View
                                style={[
                                    styles.stepCircle,
                                    {
                                        backgroundColor: index <= currentStep ? step.color : "#E0E0E0",
                                        transform: index === currentStep ? [{ scale: pulseAnim }] : [{ scale: 1 }],
                                    },
                                ]}
                            >
                                <MaterialIcons
                                    name={step.icon as keyof typeof MaterialIcons.glyphMap}
                                    size={20}
                                    color="#fff"
                                />
                            </Animated.View>

                            <View style={styles.stepInfo}>
                                <Text style={[styles.stepTitle, { color: index <= currentStep ? "#333" : "#999" }]}>
                                    {step.description}
                                </Text>
                                <Text style={styles.stepTime}>{step.timestamp}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderDeliveryInfo = () => {
        if (!orderDetails?.deliveryPerson || orderDetails.status !== "delivering") return null;

        const { deliveryPerson } = orderDetails;

        return (
            <View style={styles.deliveryInfoContainer}>
                <Text style={styles.sectionTitle}>Thông tin shipper</Text>

                <View style={styles.deliveryPersonCard}>
                    <Image source={{ uri: deliveryPerson.avatar }} style={styles.deliveryAvatar} />

                    <View style={styles.deliveryPersonInfo}>
                        <Text style={styles.deliveryPersonName}>{deliveryPerson.name}</Text>
                        <View style={styles.ratingContainer}>
                            <MaterialIcons name="star" size={16} color="#FFD700" />
                            <Text style={styles.rating}>{deliveryPerson.rating}</Text>
                        </View>
                        <Text style={styles.vehicleInfo}>
                            {deliveryPerson.vehicle} • {deliveryPerson.vehicleNumber}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.callButton} onPress={handleCallDelivery}>
                        <MaterialIcons name="phone" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderOrderSummary = () => {
        if (!orderDetails) return null;

        return (
            <View style={styles.orderSummaryContainer}>
                <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>

                <View style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                        <Text style={styles.orderNumber}>{orderDetails.orderNumber}</Text>
                        <Text style={styles.orderTime}>Đặt lúc {orderDetails.orderTime}</Text>
                    </View>

                    <View style={styles.restaurantInfo}>
                        <MaterialIcons name="restaurant" size={20} color={AppColors.primary} />
                        <View style={styles.restaurantDetails}>
                            <Text style={styles.restaurantName}>{orderDetails.restaurantName}</Text>
                            <Text style={styles.restaurantAddress}>{orderDetails.restaurantAddress}</Text>
                        </View>
                        <TouchableOpacity style={styles.callRestaurantButton} onPress={handleCallRestaurant}>
                            <MaterialIcons name="phone" size={20} color={AppColors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.itemsList}>
                        {orderDetails.items.map((item) => (
                            <View key={item.id} style={styles.orderItem}>
                                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                </View>
                                <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.orderTotal}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tạm tính:</Text>
                            <Text style={styles.totalValue}>{formatPrice(orderDetails.total)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Phí giao hàng:</Text>
                            <Text style={styles.totalValue}>{formatPrice(orderDetails.deliveryFee)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.finalTotalRow]}>
                            <Text style={styles.finalTotalLabel}>Tổng cộng:</Text>
                            <Text style={styles.finalTotalValue}>
                                {formatPrice(orderDetails.total + orderDetails.deliveryFee)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (!orderDetails) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Estimated Delivery Time */}
                <View style={styles.estimatedTimeContainer}>
                    <MaterialIcons name="access-time" size={32} color={AppColors.primary} />
                    <View style={styles.timeInfo}>
                        <Text style={styles.estimatedTimeLabel}>Dự kiến giao hàng</Text>
                        <Text style={styles.estimatedTime}>{orderDetails.estimatedDeliveryTime}</Text>
                    </View>
                </View>

                {/* Progress Tracking */}
                {renderProgressBar()}

                {/* Delivery Person Info */}
                {renderDeliveryInfo()}

                {/* Order Summary */}
                {renderOrderSummary()}

                {/* Delivery Address */}
                <View style={styles.addressContainer}>
                    <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                    <View style={styles.addressCard}>
                        <MaterialIcons name="location-on" size={24} color={AppColors.primary} />
                        <Text style={styles.addressText}>{orderDetails.deliveryAddress}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            {(orderDetails.status === "pending" || orderDetails.status === "confirmed") && (
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                        <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: AppColors.primary,
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 50,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
    },
    content: {
        flex: 1,
    },
    estimatedTimeContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        margin: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    timeInfo: {
        marginLeft: 15,
    },
    estimatedTimeLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    estimatedTime: {
        fontSize: 24,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    progressContainer: {
        backgroundColor: "#fff",
        margin: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressTrack: {
        height: 4,
        backgroundColor: "#E0E0E0",
        borderRadius: 2,
        marginBottom: 20,
    },
    progressFill: {
        height: "100%",
        backgroundColor: AppColors.primary,
        borderRadius: 2,
    },
    stepsContainer: {
        gap: 15,
    },
    stepContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    stepInfo: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 2,
    },
    stepTime: {
        fontSize: 12,
        color: "#666",
    },
    deliveryInfoContainer: {
        margin: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 10,
    },
    deliveryPersonCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    deliveryAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    deliveryPersonInfo: {
        flex: 1,
    },
    deliveryPersonName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    rating: {
        fontSize: 14,
        color: "#666",
        marginLeft: 4,
    },
    vehicleInfo: {
        fontSize: 12,
        color: "#666",
    },
    callButton: {
        backgroundColor: AppColors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    orderSummaryContainer: {
        margin: 15,
    },
    orderCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    orderTime: {
        fontSize: 14,
        color: "#666",
    },
    restaurantInfo: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    restaurantDetails: {
        flex: 1,
        marginLeft: 10,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
        marginBottom: 2,
    },
    restaurantAddress: {
        fontSize: 12,
        color: "#666",
    },
    callRestaurantButton: {
        padding: 5,
    },
    itemsList: {
        padding: 15,
    },
    orderItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        marginBottom: 2,
    },
    itemQuantity: {
        fontSize: 12,
        color: "#666",
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: AppColors.primary,
    },
    orderTotal: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    totalLabel: {
        fontSize: 14,
        color: "#666",
    },
    totalValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
    },
    finalTotalRow: {
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
        paddingTop: 10,
        marginTop: 10,
    },
    finalTotalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    finalTotalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    addressContainer: {
        margin: 15,
        marginBottom: 30,
    },
    addressCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: "#333",
        marginLeft: 10,
        lineHeight: 20,
    },
    actionContainer: {
        padding: 20,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    cancelButton: {
        backgroundColor: "#FF6B6B",
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});

export default OrderTrackingScreen;
