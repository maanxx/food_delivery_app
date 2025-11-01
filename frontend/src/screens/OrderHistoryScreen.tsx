import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";
interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
}

interface Order {
    id: string;
    order_number: string;
    status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";
    items: OrderItem[];
    total_amount: number;
    delivery_fee: number;
    restaurant_name: string;
    restaurant_image?: string;
    delivery_address: string;
    payment_method: string;
    order_date: string;
    estimated_delivery: string;
    delivery_time?: string;
    note?: string;
}

const OrderHistoryScreen = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<"all" | "active" | "completed">("all");

    // Mock orders data
    const mockOrders: Order[] = [
        {
            id: "1",
            order_number: "ORD-2024-001",
            status: "delivering",
            items: [
                {
                    id: "1",
                    name: "Whopper Burger",
                    price: 85000,
                    quantity: 2,
                    image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
                },
                {
                    id: "2",
                    name: "Khoai tây chiên",
                    price: 35000,
                    quantity: 1,
                    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop",
                },
            ],
            total_amount: 205000,
            delivery_fee: 20000,
            restaurant_name: "Burger King",
            delivery_address: "123 Nguyễn Huệ, Q.1, TP.HCM",
            payment_method: "Tiền mặt",
            order_date: "2024-11-01T14:30:00Z",
            estimated_delivery: "2024-11-01T15:00:00Z",
            note: "Không cay",
        },
        {
            id: "2",
            order_number: "ORD-2024-002",
            status: "delivered",
            items: [
                {
                    id: "3",
                    name: "Pizza Margherita",
                    price: 120000,
                    quantity: 1,
                    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
                },
            ],
            total_amount: 140000,
            delivery_fee: 20000,
            restaurant_name: "Pizza Hut",
            delivery_address: "456 Lê Lợi, Q.3, TP.HCM",
            payment_method: "Ví MoMo",
            order_date: "2024-10-31T19:15:00Z",
            estimated_delivery: "2024-10-31T20:00:00Z",
            delivery_time: "2024-10-31T19:55:00Z",
        },
        {
            id: "3",
            order_number: "ORD-2024-003",
            status: "cancelled",
            items: [
                {
                    id: "4",
                    name: "Pizza Pepperoni",
                    price: 145000,
                    quantity: 1,
                    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
                },
                {
                    id: "5",
                    name: "Coca Cola",
                    price: 25000,
                    quantity: 2,
                    image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
                },
            ],
            total_amount: 195000,
            delivery_fee: 20000,
            restaurant_name: "Pizza Hut",
            delivery_address: "789 Trần Hưng Đạo, Q.5, TP.HCM",
            payment_method: "Thẻ tín dụng",
            order_date: "2024-10-30T12:00:00Z",
            estimated_delivery: "2024-10-30T12:45:00Z",
            note: "Hủy do thay đổi kế hoạch",
        },
        {
            id: "4",
            order_number: "ORD-2024-004",
            status: "delivered",
            items: [
                {
                    id: "6",
                    name: "Cheeseburger Deluxe",
                    price: 95000,
                    quantity: 1,
                    image_url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
                },
            ],
            total_amount: 115000,
            delivery_fee: 20000,
            restaurant_name: "Burger King",
            delivery_address: "123 Nguyễn Huệ, Q.1, TP.HCM",
            payment_method: "Tiền mặt",
            order_date: "2024-10-29T18:30:00Z",
            estimated_delivery: "2024-10-29T19:15:00Z",
            delivery_time: "2024-10-29T19:10:00Z",
        },
    ];

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setOrders(mockOrders);
        } catch (error) {
            console.error("Load orders error:", error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const getStatusInfo = (status: Order["status"]) => {
        switch (status) {
            case "pending":
                return { label: "Chờ xác nhận", color: "#FFA726", icon: "schedule" };
            case "confirmed":
                return { label: "Đã xác nhận", color: "#42A5F5", icon: "check-circle" };
            case "preparing":
                return { label: "Đang chuẩn bị", color: "#FF7043", icon: "restaurant" };
            case "delivering":
                return { label: "Đang giao", color: "#66BB6A", icon: "delivery-dining" };
            case "delivered":
                return { label: "Đã giao", color: "#4CAF50", icon: "check-circle" };
            case "cancelled":
                return { label: "Đã hủy", color: "#F44336", icon: "cancel" };
            default:
                return { label: "Không xác định", color: "#9E9E9E", icon: "help" };
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getFilteredOrders = () => {
        switch (selectedTab) {
            case "active":
                return orders.filter((order) =>
                    ["pending", "confirmed", "preparing", "delivering"].includes(order.status),
                );
            case "completed":
                return orders.filter((order) => ["delivered", "cancelled"].includes(order.status));
            default:
                return orders;
        }
    };

    const handleOrderPress = (order: Order) => {
        // Navigate to order detail screen
        console.log("Navigate to order detail:", order.id);
    };

    const handleReorder = () => {
        Alert.alert("Đặt lại đơn hàng", "Bạn có muốn đặt lại đơn hàng này?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Đặt lại",
                onPress: () => {
                    Alert.alert("Thành công", "Đã thêm vào giỏ hàng!");
                },
            },
        ]);
    };

    const handleTrackOrder = (order: Order) => {
        router.push(`/order-tracking?orderId=${order.id}`);
    };

    const renderOrderItem = (item: OrderItem, isLast: boolean) => (
        <View key={item.id} style={[styles.orderItem, !isLast && styles.orderItemBorder]}>
            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                    {formatPrice(item.price)} x {item.quantity}
                </Text>
            </View>
            <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
        </View>
    );

    const renderOrder = ({ item: order }: { item: Order }) => {
        const statusInfo = getStatusInfo(order.status);

        return (
            <TouchableOpacity style={styles.orderCard} onPress={() => handleOrderPress(order)} activeOpacity={0.8}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                        <Text style={styles.orderNumber}>{order.order_number}</Text>
                        <Text style={styles.restaurantName}>📍 {order.restaurant_name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        <MaterialIcons
                            name={statusInfo.icon as keyof typeof MaterialIcons.glyphMap}
                            size={16}
                            color="#fff"
                        />
                        <Text style={styles.statusText}>{statusInfo.label}</Text>
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.orderItems}>
                    {order.items.map((item, index) => renderOrderItem(item, index === order.items.length - 1))}
                </View>

                {/* Order Summary */}
                <View style={styles.orderSummary}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tổng tiền:</Text>
                        <Text style={styles.summaryValue}>{formatPrice(order.total_amount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Thanh toán:</Text>
                        <Text style={styles.summaryValue}>{order.payment_method}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Đặt lúc:</Text>
                        <Text style={styles.summaryValue}>{formatDate(order.order_date)}</Text>
                    </View>
                </View>

                {/* Order Actions */}
                <View style={styles.orderActions}>
                    {order.status === "delivered" && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleReorder()}>
                            <MaterialIcons name="refresh" size={16} color={AppColors.primary} />
                            <Text style={styles.actionButtonText}>Đặt lại</Text>
                        </TouchableOpacity>
                    )}

                    {["preparing", "delivering"].includes(order.status) && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleTrackOrder(order)}>
                            <MaterialIcons name="location-on" size={16} color={AppColors.primary} />
                            <Text style={styles.actionButtonText}>Theo dõi</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleOrderPress(order)}>
                        <MaterialIcons name="info" size={16} color={AppColors.primary} />
                        <Text style={styles.actionButtonText}>Chi tiết</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptyDescription}>Hãy đặt món ngon đầu tiên của bạn ngay bây giờ!</Text>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push("/(tabs)/")}>
                <Text style={styles.exploreButtonText}>Đặt món ngay</Text>
            </TouchableOpacity>
        </View>
    );

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang xử lý" },
        { key: "completed", label: "Hoàn thành" },
    ];

    const filteredOrders = getFilteredOrders();

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
                <Text style={styles.orderCount}>{orders.length} đơn hàng</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
                        onPress={() => setSelectedTab(tab.key as "all" | "active" | "completed")}
                    >
                        <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[AppColors.primary]}
                            tintColor={AppColors.primary}
                        />
                    }
                >
                    {renderEmptyState()}
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[AppColors.primary]}
                            tintColor={AppColors.primary}
                        />
                    }
                />
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: AppColors.primary,
        paddingTop: 50,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
    },
    orderCount: {
        fontSize: 14,
        color: "#fff",
        opacity: 0.8,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 20,
        marginHorizontal: 5,
    },
    activeTab: {
        backgroundColor: AppColors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#666",
    },
    activeTabText: {
        color: "#fff",
    },
    scrollView: {
        flex: 1,
    },
    listContainer: {
        padding: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
        marginTop: 10,
    },
    orderCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    orderHeaderLeft: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    restaurantName: {
        fontSize: 14,
        color: "#666",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#fff",
        marginLeft: 4,
    },
    orderItems: {
        padding: 15,
    },
    orderItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    orderItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 12,
        color: "#666",
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: "600",
        color: AppColors.primary,
    },
    orderSummary: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#666",
    },
    summaryValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
    },
    orderActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: AppColors.primary,
    },
    actionButtonText: {
        fontSize: 12,
        color: AppColors.primary,
        fontWeight: "500",
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingVertical: 60,
        minHeight: 400,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginTop: 20,
        marginBottom: 10,
    },
    emptyDescription: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 30,
    },
    exploreButton: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exploreButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});

export default OrderHistoryScreen;
