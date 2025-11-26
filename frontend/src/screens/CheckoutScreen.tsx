import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppColors } from "../assets/styles/AppColor";
import { CartItem, useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useAddress } from "../contexts/AddressContext";

const CheckoutScreen = () => {
    const [showAllAddresses, setShowAllAddresses] = useState(false);
    const router = useRouter();
    const { state, clearCart } = useCart();
    const { user } = useAuth();
    const cartItems = state.items;
    const cartTotal = state.total;

    // Lấy addresses từ context
    const { addresses, selectedAddress, selectAddress, isLoading } = useAddress();
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [note, setNote] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const subtotal =
        cartTotal ||
        (cartItems && cartItems.length > 0 ? cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0);
    const deliveryFee = 20000;
    const total = subtotal + deliveryFee;

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/invoice/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user?.user_id,
                    items: cartItems,
                    total,
                    address: selectedAddress?.address || "",
                    payment_method: paymentMethod,
                }),
            });
            const result = await res.json();
            if (result && result.data?.invoice_id) {
                await clearCart();
                const orderNumber = result.data.invoice_id;
                const estimatedTime = "30-45 phút";
                const paymentMethodText = paymentMethod === "cash" ? "Tiền mặt" : paymentMethod;
                if (paymentMethod === "vnpay") {
                    router.push({
                        pathname: "/payment",
                        params: {
                            orderNumber,
                            total: total.toString(),
                            address: selectedAddress?.address || "",
                            note,
                        },
                    });
                } else {
                    router.replace({
                        pathname: "/order-success",
                        params: {
                            orderNumber,
                            total: total.toString(),
                            estimatedTime,
                            paymentMethod: paymentMethodText,
                            address: selectedAddress?.address || "",
                        },
                    });
                }
            } else {
                alert(result.error || "Không thể tạo hóa đơn");
            }
        } catch (err) {
            alert("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const renderCartItem = (item: CartItem) => (
        <View key={`${item.id}`} style={styles.cartItem}>
            <Image
                source={{ uri: item.image_url || item.image || "https://via.placeholder.com/60" }}
                style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{`${item.name ?? ""}`}</Text>
                <View style={styles.itemBottom}>
                    <Text style={styles.itemPrice}>{`${formatPrice(item.price ?? 0)}`}</Text>
                    <Text style={styles.quantity}>{`x${item.quantity ?? 0}`}</Text>
                </View>
            </View>
            <Text style={styles.itemTotal}>{`${formatPrice((item.price ?? 0) * (item.quantity ?? 0))}`}</Text>
        </View>
    );

    const renderAddressOption = (address) => (
        <TouchableOpacity
            key={`${address.id}`}
            style={[
                styles.addressOption,
                selectedAddress && selectedAddress.id === address.id && styles.selectedAddressOption,
            ]}
            onPress={() => selectAddress(address)}
        >
            <View style={styles.radioButton}>
                {selectedAddress && selectedAddress.id === address.id && <View style={styles.radioButtonSelected} />}
            </View>
            <View style={styles.addressInfo}>
                <View style={styles.addressHeader}>
                    <Text style={styles.addressName}>{`${address.title ?? ""}`}</Text>
                    {address.is_default && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Mặc định</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.addressText}>{`${address.address ?? ""}`}</Text>
                {address.phone_number && <Text style={styles.phoneText}>{`${address.phone_number}`}</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Delivery Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="location-on" size={24} color={AppColors.primary} />
                        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                        <TouchableOpacity>
                            <Text style={styles.changeText}>Thay đổi</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <Text>Đang tải địa chỉ...</Text>
                    ) : Array.isArray(addresses) && addresses.length > 0 ? (
                        <>
                            {(showAllAddresses ? addresses : addresses.slice(0, 2)).map((address) =>
                                renderAddressOption(address),
                            )}
                            {addresses.length > 2 ? (
                                <TouchableOpacity
                                    onPress={() => setShowAllAddresses((prev) => !prev)}
                                    style={{ marginTop: 8, alignSelf: "flex-start" }}
                                >
                                    <Text style={{ color: AppColors.primary, fontWeight: "500" }}>
                                        {showAllAddresses ? "Thu gọn" : `Xem thêm (${addresses.length - 2})`}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </>
                    ) : (
                        <Text style={{ color: "#888", fontStyle: "italic", marginTop: 8 }}>Chưa có địa chỉ nào</Text>
                    )}
                </View>

                {/* Order Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="restaurant" size={24} color={AppColors.primary} />
                        <Text style={styles.sectionTitle}>Món đã chọn</Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.changeText}>Chỉnh sửa</Text>
                        </TouchableOpacity>
                    </View>

                    {cartItems && cartItems.length > 0 ? (
                        cartItems.map((item) => renderCartItem(item))
                    ) : (
                        <View style={styles.emptyCartContainer}>
                            <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
                        </View>
                    )}
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="payment" size={24} color={AppColors.primary} />
                        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === "cash" && styles.selectedPaymentOption]}
                        onPress={() => setPaymentMethod("cash")}
                    >
                        <View style={styles.radioButton}>
                            {paymentMethod === "cash" && <View style={styles.radioButtonSelected} />}
                        </View>
                        <MaterialIcons name="money" size={24} color="#333" />
                        <Text style={styles.paymentText}>Tiền mặt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === "vnpay" && styles.selectedPaymentOption]}
                        onPress={() => setPaymentMethod("vnpay")}
                    >
                        <View style={styles.radioButton}>
                            {paymentMethod === "vnpay" && <View style={styles.radioButtonSelected} />}
                        </View>
                        <MaterialIcons name="qr-code" size={24} color="#333" />
                        <Text style={styles.paymentText}>Chuyển khoản</Text>
                    </TouchableOpacity>
                </View>

                {/* Note */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="note" size={24} color={AppColors.primary} />
                        <Text style={styles.sectionTitle}>Ghi chú</Text>
                    </View>

                    <TextInput
                        style={styles.noteInput}
                        placeholder="Thêm ghi chú cho đơn hàng (tùy chọn)"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tạm tính</Text>
                        <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phí giao hàng</Text>
                        <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
                    </View>

                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Tổng cộng</Text>
                        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.placeOrderButton,
                        (isPlacingOrder || !cartItems || cartItems.length === 0) && styles.disabledButton,
                    ]}
                    onPress={handlePlaceOrder}
                    disabled={isPlacingOrder || !cartItems || cartItems.length === 0}
                >
                    <Text style={styles.placeOrderText}>
                        {isPlacingOrder
                            ? "Đang đặt hàng..."
                            : !cartItems || cartItems.length === 0
                            ? "Giỏ hàng trống"
                            : `Đặt hàng - ${formatPrice(total)}`}
                    </Text>
                </TouchableOpacity>
            </View>
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
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: AppColors.primary,
        paddingTop: 50,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: "#fff",
        marginBottom: 10,
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginLeft: 10,
        flex: 1,
    },
    changeText: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: "500",
    },
    addressOption: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        marginBottom: 10,
    },
    selectedAddressOption: {
        borderColor: AppColors.primary,
        backgroundColor: "#FFF5F5",
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#ccc",
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
    },
    radioButtonSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: AppColors.primary,
    },
    addressInfo: {
        flex: 1,
    },
    addressHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    addressName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginRight: 10,
    },
    defaultBadge: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    defaultText: {
        fontSize: 12,
        color: "#fff",
        fontWeight: "500",
    },
    addressText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 3,
    },
    phoneText: {
        fontSize: 14,
        color: "#666",
    },
    cartItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    itemRestaurant: {
        fontSize: 14,
        color: "#666",
        marginBottom: 6,
    },
    itemBottom: {
        flexDirection: "row",
        alignItems: "center",
    },
    itemPrice: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: "600",
        marginRight: 10,
    },
    quantity: {
        fontSize: 14,
        color: "#666",
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        marginBottom: 10,
    },
    selectedPaymentOption: {
        borderColor: AppColors.primary,
        backgroundColor: "#FFF5F5",
    },
    paymentText: {
        fontSize: 16,
        color: "#333",
        marginLeft: 12,
    },
    noteInput: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#333",
        textAlignVertical: "top",
        minHeight: 80,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 16,
        color: "#666",
    },
    summaryValue: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        marginTop: 10,
        paddingTop: 15,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    bottomContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    placeOrderButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.6,
    },
    placeOrderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    emptyCartContainer: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyCartText: {
        fontSize: 16,
        color: "#666",
        fontStyle: "italic",
    },
});

export default CheckoutScreen;
