import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { AppColors } from "../assets/styles/AppColor";
import { useCart } from "../contexts/CartContext";

interface CartBottomSheetProps {
    visible: boolean;
    onClose: () => void;
}

const CartBottomSheet: React.FC<CartBottomSheetProps> = ({ visible, onClose }) => {
    const router = useRouter();
    const { state, updateQuantity, removeItem, clearCart, formatPrice } = useCart();
    const { items, total, itemCount } = state;
    const [showSummary, setShowSummary] = useState(false);


    const deliveryFee = 20000;
    const finalTotal = total + deliveryFee;

    const handleDeleteAll = () => {
        Alert.alert("Xóa tất cả", "Bạn có chắc chắn muốn xóa tất cả món ăn khỏi giỏ hàng?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Xóa",
                style: "destructive",
                onPress: () => {
                    clearCart();
                    onClose();
                },
            },
        ]);
    };

    const handleRemoveItem = (id: string, name: string) => {
        Alert.alert("Xóa món ăn", `Bạn có muốn xóa "${name}" khỏi giỏ hàng?`, [
            { text: "Hủy", style: "cancel" },
            {
                text: "Xóa",
                style: "destructive",
                onPress: () => removeItem(id),
            },
        ]);
    };

    const handleCheckout = () => {
        onClose();
        router.push("/checkout");
    };

    const renderCartItem = ({ item }: { item: (typeof items)[0] }) => {
        const imageUri = (item as any).image_url || (item as any).thumbnail_path || "https://via.placeholder.com/60";
        return (
            <View style={styles.itemContainer}>
                <Image source={{ uri: imageUri }} style={styles.itemImage} />

                <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                    {item.note && <Text style={styles.itemNote}>Ghi chú: {item.note}</Text>}
                </View>

                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
                        disabled={item.quantity <= 1}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        <AntDesign name="minus" size={12} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <TouchableOpacity
                        style={[styles.quantityButton, item.quantity >= 99 && styles.disabledButton]}
                        disabled={item.quantity >= 99}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <AntDesign name="plus" size={12} color="#fff" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveItem(item.id, item.name)}>
                    <MaterialIcons name="delete-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmptyCart = () => (
        <View style={styles.emptyContainer}>
            <Feather name="shopping-cart" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptyDescription}>Hãy thêm một số món ngon vào giỏ hàng của bạn!</Text>
            <TouchableOpacity style={styles.continueShoppingButton} onPress={onClose}>
                <Text style={styles.continueShoppingText}>Tiếp tục mua sắm</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            isVisible={visible}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection="down"
            style={styles.modal}
            backdropTransitionOutTiming={0}
            animationIn="slideInUp"
            animationOut="slideOutDown"
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>Giỏ hàng</Text>
                        {itemCount > 0 && <Text style={styles.itemCount}>{itemCount} món</Text>}
                    </View>

                    <View style={styles.headerRight}>
                        {itemCount > 0 && (
                            <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllButton}>
                                <MaterialIcons name="delete-sweep" size={20} color="#FF6B6B" />
                                <Text style={styles.deleteAllText}>Xóa hết</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <AntDesign name="close" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                {items.length === 0 ? (
                    renderEmptyCart()
                ) : (
                    <>
                        {/* Cart Items */}
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.id}
                            renderItem={renderCartItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContainer}
                        />

                        {/* Summary Toggle */}
                        <TouchableOpacity style={styles.summaryToggle} onPress={() => setShowSummary(!showSummary)}>
                            <Text style={styles.summaryToggleText}>
                                {showSummary ? "Ẩn" : "Hiện"} chi tiết đơn hàng
                            </Text>
                            <AntDesign name={showSummary ? "up" : "down"} size={16} color={AppColors.primary} />
                        </TouchableOpacity>

                        {/* Order Summary */}
                        {showSummary && (
                            <View style={styles.summaryContainer}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Tạm tính</Text>
                                    <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Phí giao hàng</Text>
                                    <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
                                </View>
                                <View style={[styles.summaryRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                                    <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
                                </View>
                            </View>
                        )}

                        {/* Checkout Button */}
                        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                            <View style={styles.checkoutContent}>
                                <Text style={styles.checkoutText}>Đặt hàng ngay</Text>
                                <Text style={styles.checkoutPrice}>{formatPrice(finalTotal)}</Text>
                            </View>
                            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: "flex-end",
        margin: 0,
    },
    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "85%",
        paddingBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 2,
    },
    itemCount: {
        fontSize: 14,
        color: "#666",
    },
    deleteAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    deleteAllText: {
        fontSize: 14,
        color: "#FF6B6B",
        fontWeight: "500",
    },
    closeButton: {
        padding: 5,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: "500",
        marginBottom: 2,
    },
    itemNote: {
        fontSize: 12,
        color: "#666",
        fontStyle: "italic",
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 10,
    },
    quantityButton: {
        backgroundColor: AppColors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginHorizontal: 15,
        minWidth: 20,
        textAlign: "center",
    },
    deleteButton: {
        padding: 5,
    },
    disabledButton: {
        backgroundColor: "#ccc",
    },
    summaryToggle: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
        gap: 8,
    },
    summaryToggleText: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: "500",
    },
    summaryContainer: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
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
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
        marginTop: 8,
        paddingTop: 10,
    },
    totalLabel: {
        fontSize: 16,
        color: "#333",
        fontWeight: "600",
    },
    totalValue: {
        fontSize: 16,
        color: AppColors.primary,
        fontWeight: "bold",
    },
    checkoutButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: AppColors.primary,
        marginHorizontal: 20,
        marginTop: 15,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    checkoutContent: {
        flex: 1,
    },
    checkoutText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 2,
    },
    checkoutPrice: {
        color: "#fff",
        fontSize: 14,
        opacity: 0.9,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
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
    continueShoppingButton: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    continueShoppingText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default CartBottomSheet;
