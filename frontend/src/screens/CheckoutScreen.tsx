import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Switch,
    Pressable,
    Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Entypo } from "@expo/vector-icons";
import { formatCurrency } from "../utils/MoneyUtil";
import { AppColors } from "../assets/styles/AppColor";

type RootStackParamList = {
    Checkout: undefined;
    OrderSuccess: undefined;
};

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Checkout">;

const CheckoutScreen: React.FC = () => {
    const navigation = useNavigation<CheckoutScreenNavigationProp>();
    const [selectedPayment, setSelectedPayment] = useState<string>("mastercard");
    const [saveCardDetails, setSaveCardDetails] = useState<boolean>(false);

    const handlePayNow = () => {
        // Navigate to order success screen
        navigation.navigate("OrderSuccess");
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Entypo name="back" size={17} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Thanh toán</Text>
                </View>

                <View style={styles.divider}></View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.addressRow}>
                        <View>
                            <Text style={styles.addressLabel}>
                                <Entypo name="location-pin" size={16} color="black" />
                                Địa chỉ
                            </Text>
                            <Text style={styles.addressValue}>
                                Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, Thành phố Hồ Chí Minh
                            </Text>
                        </View>
                        <Entypo name="chevron-right" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                <View style={styles.divider}></View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <View style={styles.cartItemRow}>
                        <Image
                            style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }}
                            source={require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg")}
                        />
                        <View style={styles.cartItemDetails}>
                            <Text style={{ fontSize: 12 }}>Burger phô mai</Text>
                            <Text style={{ fontSize: 12 }}>x {2}</Text>
                            <TouchableOpacity>
                                <Text style={{ color: "#1e7ad1", fontSize: 13 }}>Sửa</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ fontWeight: "bold", fontSize: 14 }}>{formatCurrency(50000)}</View>
                    </View>
                    <View style={styles.cartItemRow}>
                        <Image
                            style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }}
                            source={require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg")}
                        />
                        <View style={styles.cartItemDetails}>
                            <Text style={{ fontSize: 12 }}>Burger phô mai</Text>
                            <Text style={{ fontSize: 12 }}>x {2}</Text>
                            <TouchableOpacity>
                                <Text style={{ color: "#1e7ad1", fontSize: 13 }}>Sửa</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ fontWeight: "bold", fontSize: 14 }}>{formatCurrency(50000)}</View>
                    </View>
                    <View style={[styles.cartItemRow, { borderBottomWidth: 0 }]}>
                        <Image
                            style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }}
                            source={require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg")}
                        />
                        <View style={styles.cartItemDetails}>
                            <Text style={{ fontSize: 12 }}>Burger phô mai</Text>
                            <Text style={{ fontSize: 12 }}>x {2}</Text>
                            <TouchableOpacity>
                                <Text style={{ color: "#1e7ad1", fontSize: 13 }}>Sửa</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ fontWeight: "bold", fontSize: 14 }}>{formatCurrency(50000)}</View>
                    </View>
                </View>

                {/* Checkout Detail */}
                <View style={styles.section}>
                    <Text style={{ fontWeight: "bold", fontSize: 14 }}>Chi tiết thanh toán</Text>
                    <View style={styles.checkoutDetailRow}>
                        <Text style={{ fontSize: 12 }}>Tạm tính (3 phần)</Text>
                        <Text style={{ fontSize: 12 }}>{formatCurrency(150000)}</Text>
                    </View>
                    <View style={styles.checkoutDetailRow}>
                        <Text style={{ fontSize: 12 }}>Phí vận chuyển</Text>
                        <Text style={{ fontSize: 12 }}>{formatCurrency(30000)}</Text>
                    </View>
                    <View style={styles.checkoutDetailRow}>
                        <Text style={{ fontSize: 12 }}>Giảm giá</Text>
                        <Text style={{ fontSize: 12, color: "green" }}>{formatCurrency(-150000)}</Text>
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

                    {/* MasterCard */}
                    <TouchableOpacity
                        style={[styles.paymentMethod, selectedPayment === "mastercard" && styles.paymentMethodSelected]}
                        onPress={() => setSelectedPayment("mastercard")}
                    >
                        <View style={styles.paymentHeader}>
                            <Text style={styles.paymentType}>MasterCard</Text>
                            <Text style={styles.paymentSubtype}>Credit card</Text>
                        </View>
                        <Text style={styles.cardNumber}>105 **** *** 0505</Text>
                    </TouchableOpacity>

                    {/* VISA */}
                    <TouchableOpacity
                        style={[styles.paymentMethod, selectedPayment === "visa" && styles.paymentMethodSelected]}
                        onPress={() => setSelectedPayment("visa")}
                    >
                        <View style={styles.paymentHeader}>
                            <Text style={styles.paymentType}>VISA</Text>
                            <Text style={styles.paymentSubtype}>Debit card</Text>
                        </View>
                        <Text style={styles.cardNumber}>3566 **** *** 0505</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Footer with Total and Pay Button */}
            <View style={styles.footer}>
                <View style={styles.footerContent}>
                    <View style={styles.footerTotal}>
                        <Text style={styles.footerTotalLabel}>Tổng số tiền</Text>
                        <Text style={styles.footerTotalValue}>{formatCurrency(150000)}</Text>
                    </View>
                    <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
                        <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    divider: {
        height: 5,
        width: "100%",
        backgroundColor: "#E5E5E5",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginLeft: 16,
    },
    section: {
        paddingTop: 20,
        paddingBottom: 10,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    addressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 20,
    },
    addressLabel: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
    },
    addressValue: {
        color: "#666",
        fontSize: 12,
        maxWidth: 220,
    },
    cartItemRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    checkoutDetailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 16,
    },
    paymentMethod: {
        backgroundColor: "#f8f8f8",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: "transparent",
    },
    paymentMethodSelected: {
        borderColor: AppColors.primary,
        backgroundColor: "#fcdcd4",
    },
    paymentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    paymentType: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    paymentSubtype: {
        fontSize: 14,
        color: "#666",
    },
    cardNumber: {
        fontSize: 14,
        color: "#666",
        fontFamily: "monospace",
    },
    saveCardContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    saveCardText: {
        fontSize: 14,
        color: "#666",
        flex: 1,
        marginRight: 12,
    },
    footer: {
        backgroundColor: "#fff",
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    footerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerTotal: {
        flex: 1,
    },
    footerTotalLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    footerTotalValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    payButton: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 12,
        marginLeft: 16,
    },
    payButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
});

export default CheckoutScreen;
