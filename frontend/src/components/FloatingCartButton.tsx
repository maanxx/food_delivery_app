import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";
import { useCart } from "../contexts/CartContext";

interface FloatingCartButtonProps {
    onCartPress?: () => void;
    showQuickPreview?: boolean;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ onCartPress, showQuickPreview = false }) => {
    const router = useRouter();
    const { state } = useCart();
    const { items, total, itemCount } = state;

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;
    const bounceAnim = useRef(new Animated.Value(1)).current;

    // Show/hide animation based on cart content
    useEffect(() => {
        if (itemCount > 0) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
                Animated.spring(slideAnim, {
                    toValue: 100,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
            ]).start();
        }
    }, [itemCount, scaleAnim, slideAnim]);

    // Bounce animation when items are added
    useEffect(() => {
        if (itemCount > 0) {
            Animated.sequence([
                Animated.spring(bounceAnim, {
                    toValue: 1.2,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 10,
                }),
                Animated.spring(bounceAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 10,
                }),
            ]).start();
        }
    }, [itemCount, bounceAnim]);

    const handleCartPress = () => {
        if (onCartPress) {
            onCartPress();
        }
    };

    const handleCheckoutPress = () => {
        router.push("/checkout");
    };

    if (itemCount === 0) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                },
            ]}
        >
            {/* Quick Preview */}
            {showQuickPreview && items.length > 0 && (
                <Animated.View style={styles.previewContainer}>
                    <View style={styles.previewContent}>
                        <Text style={styles.previewTitle}>Giỏ hàng</Text>
                        <View style={styles.previewItems}>
                            {items.slice(0, 2).map((item) => (
                                <View key={item.id} style={styles.previewItem}>
                                    <Text style={styles.previewItemName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.previewItemQuantity}>x{item.quantity}</Text>
                                </View>
                            ))}
                            {items.length > 2 && <Text style={styles.moreItems}>+{items.length - 2} món khác</Text>}
                        </View>
                    </View>
                </Animated.View>
            )}

            {/* Main Cart Button */}
            <View style={styles.cartContainer}>
                {/* Cart Info Button */}
                <TouchableOpacity style={styles.cartInfoButton} onPress={handleCartPress} activeOpacity={0.8}>
                    <Animated.View style={[styles.cartIconContainer, { transform: [{ scale: bounceAnim }] }]}>
                        <Feather name="shopping-cart" size={20} color="#fff" />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{itemCount}</Text>
                        </View>
                    </Animated.View>
                    <View style={styles.cartInfo}>
                        <Text style={styles.cartItems}>{itemCount} món</Text>
                        <Text style={styles.cartTotal}>{new Intl.NumberFormat("vi-VN").format(total)}đ</Text>
                    </View>
                </TouchableOpacity>

                {/* Checkout Button */}
                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckoutPress} activeOpacity={0.8}>
                    <Text style={styles.checkoutText}>Đặt hàng</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 20,
        left: 15,
        right: 15,
        zIndex: 1000,
    },
    previewContainer: {
        marginBottom: 10,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderRadius: 12,
        padding: 12,
    },
    previewContent: {
        alignItems: "flex-start",
    },
    previewTitle: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    previewItems: {
        width: "100%",
    },
    previewItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    previewItemName: {
        color: "#fff",
        fontSize: 12,
        flex: 1,
        marginRight: 10,
    },
    previewItemQuantity: {
        color: "#ccc",
        fontSize: 12,
        fontWeight: "500",
    },
    moreItems: {
        color: "#ccc",
        fontSize: 11,
        fontStyle: "italic",
        marginTop: 4,
    },
    cartContainer: {
        flexDirection: "row",
        backgroundColor: AppColors.primary,
        borderRadius: 12,
        overflow: "hidden",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cartInfoButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    cartIconContainer: {
        position: "relative",
        marginRight: 12,
    },
    badge: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: "#FF6B6B",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    cartInfo: {
        flex: 1,
    },
    cartItems: {
        color: "#fff",
        fontSize: 12,
        opacity: 0.9,
    },
    cartTotal: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    checkoutButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderLeftWidth: 1,
        borderLeftColor: "rgba(255, 255, 255, 0.3)",
    },
    checkoutText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        marginRight: 8,
    },
});

export default FloatingCartButton;
