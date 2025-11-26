import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { AppColors } from "../src/assets/styles/AppColor";
import { FoodWithDetails } from "../src/types/food";
import { foodApiClient } from "../src/services/foodApi";
import { useCart } from "../src/contexts/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const DishDetailScreen = () => {
    const router = useRouter();
    const { foodId } = useLocalSearchParams<{ foodId: string }>();
    const { addItem } = useCart();

    const [food, setFood] = useState<FoodWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState("Vừa");
    const [error, setError] = useState<string | null>(null);
    const [isFav, setIsFav] = useState(false);

    const sizes = ["Nhỏ", "Vừa", "Lớn"];
    const FAVORITES_KEY = "favorites_v1";

    useEffect(() => {
        loadFoodDetail();
    }, [foodId]);

    useEffect(() => {
        const loadFav = async () => {
            try {
                const raw = await AsyncStorage.getItem(FAVORITES_KEY);
                if (!raw) return;
                const arr = JSON.parse(raw);
                if (Array.isArray(arr) && foodId) setIsFav(arr.includes(foodId));
            } catch (err) {
                console.warn("loadFav error", err);
            }
        };
        loadFav();
    }, [foodId]);

    const loadFoodDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!foodId) {
                setError("Không tìm thấy món ăn");
                return;
            }

            const response = await foodApiClient.getFoodById(foodId);

            if (response.success && response.data) {
                setFood(response.data);
            } else {
                setError(response.message || "Không thể tải thông tin món ăn");
            }
        } catch (error) {
            console.error("Load food detail error:", error);
            setError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const toggleFav = async () => {
        try {
            const raw = await AsyncStorage.getItem(FAVORITES_KEY);
            const arr = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw!) : [];
            const set = new Set(arr);
            if (foodId) {
                if (set.has(foodId)) {
                    set.delete(foodId);
                    setIsFav(false);
                } else {
                    set.add(foodId);
                    setIsFav(true);
                }
                await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
            }
        } catch (err) {
            console.warn("toggleFav error", err);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const getTotalPrice = () => {
        if (!food) return 0;
        const basePrice = food.price;
        const sizeMultiplier = selectedSize === "Nhỏ" ? 0.8 : selectedSize === "Lớn" ? 1.2 : 1;
        return basePrice * sizeMultiplier * quantity;
    };

    const handleAddToCart = () => {
        if (!food) return;

        // compute unit price according to selected size
        const sizeMultiplier = selectedSize === "Nhỏ" ? 0.8 : selectedSize === "Lớn" ? 1.2 : 1;
        const unitPrice = Math.round(food.price * sizeMultiplier);

        // Ensure we use a consistent id field (fallback to foodId)
        const itemId = (food as any).id || (food as any).dish_id || foodId || String(Date.now());

        addItem({
            id: itemId,
            name: food.name,
            price: unitPrice,
            image_url: (food as any).image_url || "",
            quantity,
            size: selectedSize,
        } as any);

        console.log("Added to cart:", { id: itemId, name: food.name, unitPrice, quantity, size: selectedSize });
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !food) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || "Không tìm thấy món ăn"}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadFoodDetail}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết món ăn</Text>
                <Pressable style={styles.favoriteButton} onPress={toggleFav}>
                    <Feather name="heart" size={24} color={isFav ? "#ff4d6d" : "#333"} />
                </Pressable>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Food Image */}
                <View style={styles.imageContainer}>
                    {food.image_url ? (
                        <Image source={{ uri: food.image_url }} style={styles.foodImage} />
                    ) : (
                        <View style={styles.noImageContainer}>
                            <Text style={styles.noImageText}>🍔</Text>
                        </View>
                    )}
                </View>

                {/* Food Info */}
                <View style={styles.contentContainer}>
                    <View style={styles.titleSection}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <View style={styles.ratingContainer}>
                            <MaterialIcons name="star" size={20} color="#FFD700" />
                            <Text style={styles.rating}>{food.rating.toFixed(1)}</Text>
                            <Text style={styles.reviewCount}>({food.total_reviews} đánh giá)</Text>
                        </View>
                    </View>

                    {/* Price */}
                    <View style={styles.priceSection}>
                        <Text style={styles.currentPrice}>{formatPrice(getTotalPrice())}</Text>
                        {food.discount_price && food.discount_price > food.price && (
                            <Text style={styles.originalPrice}>{formatPrice(food.discount_price)}</Text>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                        <Text style={styles.description}>{food.description}</Text>
                    </View>

                    {/* Size Selection */}
                    <View style={styles.sizeSection}>
                        <Text style={styles.sectionTitle}>Kích cỡ</Text>
                        <View style={styles.sizeOptions}>
                            {sizes.map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[styles.sizeOption, selectedSize === size && styles.selectedSizeOption]}
                                    onPress={() => setSelectedSize(size)}
                                >
                                    <Text style={[styles.sizeText, selectedSize === size && styles.selectedSizeText]}>
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Quantity Selection */}
                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>Số lượng</Text>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <AntDesign name="minus" size={18} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(quantity + 1)}>
                                <AntDesign name="plus" size={18} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Additional Info */}
                    <View style={styles.additionalInfo}>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="schedule" size={20} color="#666" />
                            <Text style={styles.infoText}>Thời gian chuẩn bị: {food.prep_time} phút</Text>
                        </View>

                        {/* If delivery fee is available at top-level (or returned by API), show it.
                            Use a safe access in case field doesn't exist. */}
                        {(food as any).delivery_fee !== undefined && (
                            <View style={styles.infoItem}>
                                <MaterialIcons name="delivery-dining" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    Phí giao hàng: {formatPrice((food as any).delivery_fee)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Add to Cart */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                    <Text style={styles.addToCartText}>Thêm vào giỏ - {formatPrice(getTotalPrice())}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    favoriteButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        width: "100%",
        height: 250,
    },
    foodImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    noImageContainer: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f8f9fa",
        justifyContent: "center",
        alignItems: "center",
    },
    noImageText: {
        fontSize: 60,
    },
    contentContainer: {
        padding: 20,
    },
    titleSection: {
        marginBottom: 15,
    },
    foodName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    rating: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 14,
        color: "#666",
        marginLeft: 8,
    },
    priceSection: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    currentPrice: {
        fontSize: 22,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    originalPrice: {
        fontSize: 16,
        color: "#999",
        textDecorationLine: "line-through",
        marginLeft: 10,
    },
    descriptionSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: "#666",
        lineHeight: 22,
    },
    sizeSection: {
        marginBottom: 20,
    },
    sizeOptions: {
        flexDirection: "row",
        gap: 10,
    },
    sizeOption: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    selectedSizeOption: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    sizeText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    selectedSizeText: {
        color: "#fff",
    },
    quantitySection: {
        marginBottom: 20,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        minWidth: 30,
        textAlign: "center",
    },
    additionalInfo: {
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: "#666",
        marginLeft: 10,
    },
    bottomContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
        backgroundColor: "#fff",
    },
    addToCartButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
    },
    addToCartText: {
        fontSize: 16,
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
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#d32f2f",
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
});

export default DishDetailScreen;
