import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Image,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AppColors } from "../assets/styles/AppColor";
import AppLogo from "../components/AppLogo";
import CartBottomSheet from "../components/CartBottomSheet";
import FloatingCartButton from "../components/FloatingCartButton";
import FoodSection from "../components/FoodSection";
import { useFood } from "../contexts/FoodContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { FoodWithDetails } from "../types/food";

const HomeScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const {
        foods,
        categories,
        featuredFoods,
        popularFoods,
        isLoading,
        error,
        loadAllFoods,
        clearError,
        refreshAllData,
    } = useFood();

    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [showCart, setShowCart] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Demo foods for testing
    const demoFoods: FoodWithDetails[] = [
        {
            id: "demo-1",
            name: "Bánh mì thịt nướng",
            price: 25000,
            image_url: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop",
            restaurant_name: "Bánh mì Hồng",
            description: "Bánh mì thịt nướng thơm ngon, giòn rụm",
            is_available: true,
            preparation_time: 15,
            rating: 4.5,
            category_id: "1",
        },
        {
            id: "demo-2",
            name: "Phở bò tái",
            price: 45000,
            image_url: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop",
            restaurant_name: "Phở Hà Nội",
            description: "Phở bò tái đậm đà, nước dùng trong vắt",
            is_available: true,
            preparation_time: 20,
            rating: 4.8,
            category_id: "2",
        },
        {
            id: "demo-3",
            name: "Cơm gà xối mỡ",
            price: 35000,
            image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
            restaurant_name: "Cơm gà Hải Nam",
            description: "Cơm gà xối mỡ truyền thống, thơm lừng",
            is_available: true,
            preparation_time: 25,
            rating: 4.6,
            category_id: "3",
        },
        {
            id: "demo-4",
            name: "Pizza Margherita",
            price: 120000,
            image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
            restaurant_name: "Pizza House",
            description: "Pizza Margherita với phô mai mozzarella tươi",
            is_available: true,
            preparation_time: 30,
            rating: 4.7,
            category_id: "4",
        },
        {
            id: "demo-5",
            name: "Hamburger bò phô mai",
            price: 65000,
            image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
            restaurant_name: "Burger King",
            description: "Hamburger bò Angus với phô mai cheddar",
            is_available: true,
            preparation_time: 15,
            rating: 4.4,
            category_id: "5",
        },
        {
            id: "demo-6",
            name: "Trà sữa trân châu",
            price: 30000,
            image_url: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&h=300&fit=crop",
            restaurant_name: "Gong Cha",
            description: "Trà sữa trân châu đường đen thơm ngon",
            is_available: true,
            preparation_time: 10,
            rating: 4.3,
            category_id: "6",
        },
    ];

    useEffect(() => {
        console.log("HomeScreen mounted, loading initial data");
        if (Array.isArray(categories) && categories.length > 0) {
            loadAllFoods();
        }
    }, []);

    useEffect(() => {
        console.log("Food state:", {
            categoriesLength: Array.isArray(categories) ? categories.length : "not array",
            foodsLength: Array.isArray(foods) ? foods.length : "not array",
            featuredFoodsLength: Array.isArray(featuredFoods) ? featuredFoods.length : "not array",
            popularFoodsLength: Array.isArray(popularFoods) ? popularFoods.length : "not array",
            isLoading,
            error,
        });
    }, [categories, foods, featuredFoods, popularFoods, isLoading, error]);

    const handleFoodPress = (food: FoodWithDetails) => {
        console.log("Navigate to food detail:", food.name);
        router.push(`/dish-detail?foodId=${food.id}`);
    };

    const { addItem } = useCart();

    const handleAddToCart = (food: FoodWithDetails) => {
        addItem({
            id: food.id,
            name: food.name,
            price: food.price,
            image_url: food.image_url || "",
            restaurant_name: food.restaurant_name || "Unknown Restaurant",
        });
        console.log("Added to cart:", food.name);
    };

    const handleCategoryPress = (categoryId: string) => {
        setSelectedCategory(categoryId);
        if (categoryId === "All") {
            loadAllFoods();
        } else {
            loadAllFoods({ category_id: categoryId });
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            // Use refreshAllData from context
            await refreshAllData();
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const allCategories = [
        {
            id: "All",
            name: "Tất cả",
            is_active: true,
            sort_order: 0,
            description: "",
            image_url: "",
            created_at: "",
            updated_at: "",
        },
        ...(Array.isArray(categories) ? categories : []),
    ];

    const renderCategory = ({ item }: { item: (typeof allCategories)[0] }) => (
        <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipSelected]}
            onPress={() => handleCategoryPress(item.id)}
        >
            <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextSelected]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[AppColors.primary]}
                        tintColor={AppColors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                            <AppLogo color={"#fff"} fontSize={30} />
                            <Text style={styles.tagline}>Chào {user?.full_name || "bạn"}!</Text>
                        </View>

                        <Pressable onPress={() => router.push("/(tabs)/profile")}>
                            <Image
                                source={{ uri: "https://via.placeholder.com/50x50/4CAF50/ffffff?text=U" }}
                                style={styles.avatar}
                            />
                        </Pressable>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Pressable style={styles.searchButton} onPress={() => router.push("/search")}>
                            <Feather name="search" size={24} color="black" />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "#999", textAlign: "center" }}>Bạn đang thèm gì nào?</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.categoriesContainer}>
                    <FlatList
                        data={allCategories || []}
                        renderItem={renderCategory}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>

                {/* Food Sections */}
                {/* Demo Foods Section */}
                <FoodSection
                    title="🍴 Món ăn demo (Để test giỏ hàng)"
                    foods={demoFoods}
                    isLoading={false}
                    onFoodPress={handleFoodPress}
                    onAddToCart={handleAddToCart}
                />

                <FoodSection
                    title="Món nổi bật"
                    foods={Array.isArray(featuredFoods) ? featuredFoods : []}
                    isLoading={isLoading}
                    onFoodPress={handleFoodPress}
                    onAddToCart={handleAddToCart}
                />

                <FoodSection
                    title="Món phổ biến"
                    foods={Array.isArray(popularFoods) ? popularFoods : []}
                    isLoading={isLoading}
                    onFoodPress={handleFoodPress}
                    onAddToCart={handleAddToCart}
                />

                {Array.isArray(categories) &&
                    categories.map((category) => {
                        const categoryFoods = Array.isArray(foods)
                            ? foods.filter((food) => food.category_id === category.id)
                            : [];
                        if (categoryFoods.length === 0) return null;

                        return (
                            <FoodSection
                                key={category.id}
                                title={category.name}
                                foods={categoryFoods}
                                isLoading={isLoading}
                                onFoodPress={handleFoodPress}
                                onAddToCart={handleAddToCart}
                            />
                        );
                    })}

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={clearError} style={styles.errorButton}>
                            <Text style={styles.errorButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Floating Cart Button */}
            <FloatingCartButton onCartPress={() => setShowCart(true)} showQuickPreview={false} />

            {/* Cart Bottom Sheet */}
            <CartBottomSheet visible={showCart} onClose={() => setShowCart(false)} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: AppColors.primary,
        height: 150,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    greeting: {
        fontSize: 14,
        color: "#666",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    appName: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    tagline: {
        fontSize: 12,
        color: "#000",
        fontWeight: "600",
    },
    searchContainer: {
        paddingHorizontal: 15,
        marginTop: 18,
    },
    searchButton: {
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
        fontSize: 16,
        color: "#333",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    categoriesContainer: {
        paddingVertical: 10,
    },
    categoriesList: {
        paddingHorizontal: 15,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "#f5f5f5",
        borderRadius: 15,
        marginHorizontal: 5,
    },
    categoryChipSelected: {
        backgroundColor: AppColors.primary,
    },
    categoryText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    categoryTextSelected: {
        color: "#fff",
    },
    foodGrid: {
        padding: 10,
    },
    row: {
        justifyContent: "space-between",
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    foodCard: {
        width: 100,
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
        height: 120,
        borderRadius: 8,
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
    imageText: {
        fontSize: 40,
    },
    foodInfo: {
        flex: 1,
        padding: 5,
    },
    foodName: {
        fontSize: 14,
        fontWeight: "400",
        color: "#333",
        marginBottom: 4,
    },
    foodPrice: {
        fontSize: 12,
        fontWeight: "600",
        color: AppColors.primary,
        marginBottom: 4,
    },
    foodPriceDiscount: {
        fontSize: 10,
        fontWeight: "400",
        color: "#333",
        textDecorationLine: "line-through",
    },
    restaurantName: {
        fontSize: 14,
        color: "#666",
        marginBottom: 6,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    rating: {
        fontSize: 11,
        color: AppColors.primary,
        fontWeight: "600",
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: "50%",
    },
    foodsTitle: {
        fontSize: 18,
        color: "#333",
        marginLeft: 15,
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 7,
    },

    errorContainer: {
        margin: 20,
        padding: 15,
        backgroundColor: "#fee",
        borderRadius: 8,
        alignItems: "center",
    },
    errorText: {
        color: "#d32f2f",
        fontSize: 14,
        marginBottom: 10,
        textAlign: "center",
    },
    errorButton: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    errorButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
});

export default HomeScreen;
