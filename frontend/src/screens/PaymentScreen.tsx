import React, { useMemo, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useRouter, useLocalSearchParams } from "expo-router";
import qs from "qs";
import CryptoJS from "crypto-js";

const VNPAY_TMNCODE = process.env.EXPO_PUBLIC_VNPAY_TMNCODE;
const VNPAY_HASH_SECRET = process.env.EXPO_PUBLIC_VNPAY_HASH_SECRET;
const VNPAY_URL = process.env.EXPO_PUBLIC_VNPAY_URL;
const VNPAY_RETURN_URL = process.env.EXPO_PUBLIC_VNPAY_RETURN_URL;

function buildVnpayUrl({ amount, orderId, orderInfo }) {
    const vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: VNPAY_TMNCODE,
        vnp_Amount: amount * 100,
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: VNPAY_RETURN_URL,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: new Date()
            .toISOString()
            .replace(/[-:T.Z]/g, "")
            .slice(0, 14),
    };

    function encodeRFC3986(str) {
        return encodeURIComponent(str)
            .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
            .replace(/%20/g, "+"); // space -> +
    }

    const sortedKeys = Object.keys(vnp_Params).sort();
    const signData = sortedKeys.map((k) => `${k}=${encodeRFC3986(vnp_Params[k])}`).join("&");
    const secureHash = CryptoJS.HmacSHA512(signData, VNPAY_HASH_SECRET).toString(CryptoJS.enc.Hex);

    const vnp_ParamsWithHash = { ...vnp_Params, vnp_SecureHash: secureHash };
    const url = VNPAY_URL + "?" + qs.stringify(vnp_ParamsWithHash, { encode: true });
    return url;
}

const PaymentScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const total = Number(params.total) || 0;
    const note = params.note || "Thanh toán đơn hàng";
    const orderId = useMemo(() => `ORDER${Date.now()}`, []);

    const vnpayUrl = useMemo(() => {
        const url = buildVnpayUrl({ amount: total, orderId, orderInfo: note });
        console.log("\nVNPay URL:", url);
        return url;
    }, [total, orderId, note]);

    const handleNavigationStateChange = useCallback(
        (navState) => {
            if (navState.url && navState.url.startsWith(VNPAY_RETURN_URL)) {
                router.replace({
                    pathname: "/order-success",
                    params: {
                        orderNumber: orderId,
                        total: total.toString(),
                        estimatedTime: "30-45 phút",
                        paymentMethod: "VNPay",
                        address: params.address || "",
                    },
                });
            }
        },
        [router, orderId, total, params.address],
    );

    return (
        <View style={{ flex: 1 }}>
            <WebView
                source={{ uri: vnpayUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#1890ff" />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default PaymentScreen;
