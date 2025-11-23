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
import GridCategorySection from "../components/GridCategorySection";
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

    useEffect(() => {
        console.log("HomeScreen mounted, loading initial data");
        if (Array.isArray(categories) && categories.length > 0) {
            loadAllFoods();
        }
    }, []);

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
        console.log("Selected category:", categoryId);
        if (categoryId === "All") {
            loadAllFoods();
        } else {
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
            category_id: "All",
            name: "Tất cả",
            is_active: true,
            sort_order: 0,
            description: "",
            image_url: "",
            created_at: "",
            updated_at: "",
        },
        ...categories,
    ];

    // Lấy danh sách món ăn hiển thị theo category đã chọn
    let displayedFoods: FoodWithDetails[] = [];
    let displayedTitle: string = "Tất cả món ăn";
    if (selectedCategory === "All") {
        displayedFoods = Array.isArray(foods)
            ? foods.filter((food) => food && typeof food === "object" && food.id && food.name)
            : [];
        displayedTitle = "Tất cả món ăn";
    } else {
        displayedFoods = Array.isArray(foods)
            ? foods.filter(
                  (food) =>
                      food && typeof food === "object" && food.id && food.name && food.category_id === selectedCategory,
              )
            : [];
        displayedTitle =
            categories.find((cat) => cat.id === selectedCategory)?.name ||
            categories.find((cat) => cat.category_id === selectedCategory)?.name ||
            "Món ăn";
    }

    // Chuẩn bị dữ liệu sections cho FlatList
    let sections: Array<{
        key: string;
        title: string;
        foods: FoodWithDetails[];
        type?: "popular" | "category";
    }> = [];

    // Helper để lọc foods hợp lệ
    const validFoods = (arr: any[]) =>
        Array.isArray(arr)
            ? arr.filter(
                  (food) =>
                      food &&
                      typeof food === "object" &&
                      typeof food.id === "string" &&
                      typeof food.name === "string" &&
                      typeof food.image_url === "string",
              )
            : [];

    if (selectedCategory === "All") {
        sections.push({
            key: "popular",
            title: "Món phổ biến",
            foods: validFoods(popularFoods),
            type: "popular",
        });

        if (Array.isArray(categories)) {
            categories.forEach((category) => {
                const categoryFoods = validFoods(
                    foods.filter(
                        (food) =>
                            food && (food.category_id === category.id || food.category_id === category.category_id),
                    ),
                );
                if (categoryFoods.length > 0) {
                    sections.push({
                        key: category.id,
                        title: category.name,
                        foods: categoryFoods,
                        type: "category",
                    });
                }
            });
        }
    } else {
        sections.push({
            key: selectedCategory,
            title: displayedTitle,
            foods: validFoods(displayedFoods),
            type: "category",
        });
    }

    // Header cho FlatList
    const renderHeader = () => (
        <>
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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                >
                    {allCategories.map((item) => {
                        const isSelected = selectedCategory === item.category_id;
                        // Sửa key ở đây: dùng item.category_id hoặc item.id, fallback về index nếu cần
                        return (
                            <TouchableOpacity
                                key={item.category_id || item.id}
                                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                                onPress={() => handleCategoryPress(item.category_id)}
                            >
                                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </>
    );

    // Render từng section món ăn
    const renderSection = ({ item }: { item: (typeof sections)[0] }) => {
        if (selectedCategory === "All" || item.type === "popular") {
            return (
                <FoodSection
                    key={item.key}
                    title={item.title}
                    foods={item.foods}
                    isLoading={isLoading}
                    onFoodPress={handleFoodPress}
                    onAddToCart={handleAddToCart}
                />
            );
        }
        // Nếu chọn category khác "All", dùng GridCategorySection
        return (
            <GridCategorySection
                key={item.key}
                title={item.title}
                foods={item.foods}
                isLoading={isLoading}
                onFoodPress={handleFoodPress}
                onAddToCart={handleAddToCart}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={sections}
                renderItem={renderSection}
                keyExtractor={(item) => item.key}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={
                    error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={clearError} style={styles.errorButton}>
                                <Text style={styles.errorButtonText}>Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[AppColors.primary]}
                        tintColor={AppColors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
            />
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
        marginBottom: 60,
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
        borderRadius: 50,
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
