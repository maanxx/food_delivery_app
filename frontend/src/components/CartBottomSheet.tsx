import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput } from "react-native";
import Modal from "react-native-modal";
import { AppColors } from "../assets/styles/AppColor";
import { formatCurrency } from "../utils/MoneyUtil";

interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    cartItems: CartItem[];
}

const CartBottomSheet: React.FC<CartBottomSheetProps> = ({ visible, onClose, cartItems }) => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const hanleDeleteAll = () => {};

    return (
        <Modal
            isVisible={visible}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection="down"
            style={styles.modal}
            backdropTransitionOutTiming={0}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Giỏ hàng</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                        <TouchableOpacity onPress={hanleDeleteAll}>
                            <Text style={{ fontWeight: "bold", color: "red" }}>Xóa hết</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose}>
                            <AntDesign name="close" size={12} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    data={cartItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.itemContainer}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <TouchableOpacity
                                    style={[styles.button, item.quantity <= 1 ? styles.disabledButton : {}]}
                                    disabled={item.quantity <= 1}
                                    onPress={() => {
                                        item.quantity = item.quantity > 1 ? item.quantity - 1 : 1;
                                    }}
                                >
                                    <AntDesign name="minus" size={13} color="white" />
                                </TouchableOpacity>
                                <TextInput
                                    style={{
                                        color: AppColors.primary,
                                        fontSize: 12,
                                        fontWeight: "bold",
                                        marginHorizontal: 10,
                                        textAlign: "center",
                                        width: 20,
                                    }}
                                    value={String(item.quantity)}
                                    onChangeText={(text) => {
                                        item.quantity =
                                            Number(text) >= 1 && Number(text) <= 99 ? Number(text) : item.quantity;
                                    }}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    style={[styles.button, item.quantity >= 99 ? styles.disabledButton : {}]}
                                    onPress={() => {
                                        item.quantity = item.quantity < 99 ? item.quantity + 1 : 99;
                                    }}
                                >
                                    <AntDesign name="plus" size={13} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />

                <TouchableOpacity style={styles.checkoutButton}>
                    <Text style={styles.checkoutText}>Xem đơn hàng {formatCurrency(total)}</Text>
                </TouchableOpacity>
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
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
        zIndex: 1000,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#cecbcb",
        marginBottom: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "left",
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: "500",
    },
    itemPrice: {
        fontSize: 13,
        color: "#777",
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: "600",
    },
    checkoutButton: {
        backgroundColor: "#E53935",
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
    },
    checkoutText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "600",
        fontSize: 14,
    },
    button: {
        textAlign: "center",
        padding: 3,
        backgroundColor: AppColors.primary,
        borderRadius: 5,
    },
    disabledButton: {
        backgroundColor: "#ccc",
    },
});

export default CartBottomSheet;
