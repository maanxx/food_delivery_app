import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Alert,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons, AntDesign } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";
import { useAuth } from "../contexts/AuthContext";
import { FoodWithDetails } from "../types/food";

interface FavoriteItem {
    id: string;
    food: FoodWithDetails;
    added_at: string;
}

const FavoriteScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Mock data for favorites
    const mockFavorites: FavoriteItem[] = [
        {
            id: "1",
            food: {
                id: "1",
                name: "Whopper Burger",
                description: "Burger bò nướng với rau xanh tươi",
                price: 85000,
                discount_price: 95000,
                category_id: "1",
                restaurant_id: "1",
                image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
                rating: 4.8,
                total_reviews: 324,
                is_available: true,
                prep_time: 15,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
                category: {
                    id: "1",
                    name: "Burgers",
                    description: "Các loại burger ngon",
                    image_url: null,
                    is_active: true,
                    sort_order: 1,
                    created_at: "2024-01-01T00:00:00Z",
                    updated_at: "2024-01-01T00:00:00Z",
                },
                restaurant: {
                    id: "1",
                    name: "Burger King",
                    description: "Chuỗi burger nổi tiếng",
                    address: "123 Nguyễn Huệ, Q.1, TP.HCM",
                    phone: "0901234567",
                    email: "contact@burgerking.com",
                    image_url: null,
                    rating: 4.5,
                    total_reviews: 1250,
                    is_active: true,
                    delivery_fee: 15000,
                    min_order: 50000,
                    delivery_time: "20-30 phút",
                    created_at: "2024-01-01T00:00:00Z",
                    updated_at: "2024-01-01T00:00:00Z",
                },
            },
            added_at: "2024-11-01T10:30:00Z",
        },
        {
            id: "2",
            food: {
                id: "3",
                name: "Pizza Margherita",
                description: "Pizza cổ điển với cà chua, phô mai mozzarella",
                price: 120000,
                discount_price: 135000,
                category_id: "2",
                restaurant_id: "2",
                image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
                rating: 4.7,
                total_reviews: 445,
                is_available: true,
                prep_time: 25,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
                category: {
                    id: "2",
                    name: "Pizza",
                    description: "Pizza Ý thơm ngon",
                    image_url: null,
                    is_active: true,
                    sort_order: 2,
                    created_at: "2024-01-01T00:00:00Z",
                    updated_at: "2024-01-01T00:00:00Z",
                },
                restaurant: {
                    id: "2",
                    name: "Pizza Hut",
                    description: "Pizza phong cách Mỹ",
                    address: "456 Lê Lợi, Q.1, TP.HCM",
                    phone: "0907654321",
                    email: "info@pizzahut.com",
                    image_url: null,
                    rating: 4.3,
                    total_reviews: 890,
                    is_active: true,
                    delivery_fee: 20000,
                    min_order: 80000,
                    delivery_time: "25-35 phút",
                    created_at: "2024-01-01T00:00:00Z",
                    updated_at: "2024-01-01T00:00:00Z",
                },
            },
            added_at: "2024-10-30T14:20:00Z",
        },
        {
            id: "3",
            food: {
                id: "4",
                name: "Pizza Pepperoni",
                description: "Pizza với xúc xích pepperoni thơm ngon",
                price: 145000,
                discount_price: null,
                category_id: "2",
                restaurant_id: "2",
                image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
                rating: 4.9,
                total_reviews: 378,
                is_available: true,
                prep_time: 30,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
                category: {
                    id: "2",
                    name: "Pizza",
                    description: "Pizza Ý thơm ngon",
                    image_url: null,
                    is_active: true,
                    sort_order: 2,
                    created_at: "2024-01-01T00:00:00Z",
                    updated_at: "2024-01-01T00:00:00Z",
                },
                restaurant: {
                    id: "2",
                    name: "Pizza Hut",
                    description: "Pizza phong cách Mỹ",
                    address: "456 Lê Lợi, Q.1, TP.HCM",
                    phone: "0907654321",
                    email: "info@pizzahut.com",
                    image_url: null,
                    rating: 4.3,
                    total_reviews: 890,
                    is_active: true,
                    delivery_fee: 20000,
                    min_order: 80000,
                    delivery_time: "25-35 phút",
                    created_at: "2024-01-01T00:00:00Z",
                    updated_at: "2024-01-01T00:00:00Z",
                },
            },
            added_at: "2024-10-28T09:15:00Z",
        },
    ];

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setFavorites(mockFavorites);
        } catch (error) {
            console.error("Load favorites error:", error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFavorites();
        setRefreshing(false);
    };

    const handleRemoveFromFavorites = (favoriteId: string, foodName: string) => {
        Alert.alert("Xóa khỏi yêu thích", `Bạn có chắc chắn muốn xóa "${foodName}" khỏi danh sách yêu thích?`, [
            {
                text: "Hủy",
                style: "cancel",
            },
            {
                text: "Xóa",
                style: "destructive",
                onPress: () => {
                    setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
                },
            },
        ]);
    };

    const handleFoodPress = (food: FoodWithDetails) => {
        router.push(`/dish-detail?foodId=${food.id}`);
    };

    const handleAddToCart = (food: FoodWithDetails) => {
        console.log("Add to cart:", food.name);
        Alert.alert("Thêm vào giỏ hàng", `Đã thêm ${food.name} vào giỏ hàng!`);
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
        });
    };

    const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => (
        <TouchableOpacity style={styles.favoriteCard} onPress={() => handleFoodPress(item.food)} activeOpacity={0.8}>
            <View style={styles.foodImageContainer}>
                {item.food.image_url ? (
                    <Image source={{ uri: item.food.image_url }} style={styles.foodImage} resizeMode="cover" />
                ) : (
                    <View style={styles.noImageContainer}>
                        <Text style={styles.noImageText}>🍔</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleRemoveFromFavorites(item.id, item.food.name)}
                >
                    <MaterialIcons name="favorite" size={20} color="#FF6B6B" />
                </TouchableOpacity>
            </View>

            <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                    {item.food.name}
                </Text>
                <Text style={styles.restaurantName} numberOfLines={1}>
                    📍 {item.food.restaurant?.name}
                </Text>
                <Text style={styles.foodDescription} numberOfLines={2}>
                    {item.food.description}
                </Text>

                <View style={styles.foodDetails}>
                    <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>
                            {item.food.rating.toFixed(1)} ({item.food.total_reviews})
                        </Text>
                    </View>
                    <Text style={styles.prepTime}>⏱️ {item.food.prep_time} phút</Text>
                </View>

                <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>{formatPrice(item.food.price)}</Text>
                        {item.food.discount_price && item.food.discount_price > item.food.price && (
                            <Text style={styles.originalPrice}>{formatPrice(item.food.discount_price)}</Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.addToCartButton} onPress={() => handleAddToCart(item.food)}>
                        <AntDesign name="plus" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.addedDate}>Đã thêm: {formatDate(item.added_at)}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="favorite-border" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có món yêu thích</Text>
            <Text style={styles.emptyDescription}>Hãy thêm các món ăn bạn yêu thích để dễ dàng tìm lại sau này</Text>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push("/(tabs)/")}>
                <Text style={styles.exploreButtonText}>Khám phá ngay</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yêu thích</Text>
                    <View style={styles.placeholder} />
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yêu thích</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.countText}>{favorites.length} món</Text>
                </View>
            </View>

            {favorites.length === 0 ? (
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
                    data={favorites}
                    renderItem={renderFavoriteItem}
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
    headerRight: {
        alignItems: "flex-end",
    },
    countText: {
        fontSize: 14,
        color: "#fff",
        opacity: 0.8,
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
    favoriteCard: {
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
    foodImageContainer: {
        position: "relative",
    },
    foodImage: {
        width: "100%",
        height: 180,
    },
    noImageContainer: {
        width: "100%",
        height: 180,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
    },
    noImageText: {
        fontSize: 60,
    },
    favoriteButton: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    foodInfo: {
        padding: 15,
    },
    foodName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    restaurantName: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    foodDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
        marginBottom: 10,
    },
    foodDetails: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    rating: {
        fontSize: 14,
        color: "#333",
        marginLeft: 4,
        fontWeight: "500",
    },
    prepTime: {
        fontSize: 14,
        color: "#666",
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    currentPrice: {
        fontSize: 18,
        fontWeight: "bold",
        color: AppColors.primary,
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 14,
        color: "#999",
        textDecorationLine: "line-through",
    },
    addToCartButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: AppColors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    addedDate: {
        fontSize: 12,
        color: "#999",
        fontStyle: "italic",
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

export default FavoriteScreen;
