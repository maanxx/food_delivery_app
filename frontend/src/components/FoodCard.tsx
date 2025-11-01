import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";
import { FoodWithDetails } from "../types/food";

interface FoodCardProps {
    item: FoodWithDetails;
    onPress: () => void;
    onAddToCart?: () => void;
}

const FoodCard: React.FC<FoodCardProps> = ({ item, onPress, onAddToCart }) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    return (
        <TouchableOpacity style={styles.foodCard} onPress={onPress}>
            <View style={styles.foodImage}>
                <View style={styles.imagePlaceholder}>
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            resizeMode="cover"
                            style={styles.image}
                            onError={() => console.log("Failed to load image:", item.image_url)}
                        />
                    ) : (
                        <View style={styles.noImageContainer}>
                            <Text style={styles.noImageText}>🍔</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.priceContainer}>
                    <Text style={styles.foodPrice}>{formatPrice(item.price)}</Text>
                    {item.discount_price && item.discount_price > item.price && (
                        <Text style={styles.foodPriceDiscount}>{formatPrice(item.discount_price)}</Text>
                    )}
                </View>
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>
                        ★ {item.rating.toFixed(1)} ({item.total_reviews})
                    </Text>
                    <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
                        <AntDesign name="plus" size={10} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    foodCard: {
        width: 140,
        backgroundColor: "#fff",
        borderRadius: 12,
        shadowColor: "#222020",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginRight: 10,
    },
    foodImage: {
        width: "100%",
        height: 100,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: "hidden",
        marginBottom: 8,
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    noImageContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
    },
    noImageText: {
        fontSize: 32,
    },
    foodInfo: {
        flex: 1,
        padding: 8,
        paddingTop: 4,
    },
    foodName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    foodPrice: {
        fontSize: 13,
        fontWeight: "600",
        color: AppColors.primary,
        marginRight: 8,
    },
    foodPriceDiscount: {
        fontSize: 11,
        fontWeight: "400",
        color: "#999",
        textDecorationLine: "line-through",
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    rating: {
        fontSize: 11,
        color: AppColors.primary,
        fontWeight: "500",
    },
    addButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: AppColors.primary,
    },
});

export default FoodCard;
