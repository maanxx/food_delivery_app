import React, { useState } from "react";
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
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather, Entypo, AntDesign } from "@expo/vector-icons";

import { AppColors } from "../assets/styles/AppColor";
import AppLogo from "../components/AppLogo";
import CartBottomSheet from "../components/CartBottomSheet";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

interface FoodItem {
    id: string;
    name: string;
    restaurant: string;
    rating: number;
    image?: string;
    category: string[];
}

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [showCart, setShowCart] = useState<boolean>(false);
    // const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const cartItems = [
        { id: "1", name: "Burger phô mai", price: 45000, image: "https://i.imgur.com/QnQZ1KZ.png", quantity: 2 },
        { id: "2", name: "Khoai tây chiên", price: 30000, image: "https://i.imgur.com/VB5U9UI.png", quantity: 1 },
    ];

    const foodItems: FoodItem[] = [
        {
            id: "1",
            name: "Cheeseburger",
            rating: 4.9,
            category: ["Burgers", "Combos"],
            thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
            price: 50000,
            discount: 60000,
        },
        {
            id: "2",
            name: "Hamburger",
            rating: 4.8,
            category: ["Burgers", "Vegetarian"],
            thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
            price: 50000,
            discount: 60000,
        },
        {
            id: "3",
            name: "Hamburger",
            rating: 4.6,
            category: ["Burgers", "Chicken"],
            thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
            price: 50000,
            discount: 60000,
        },
        {
            id: "4",
            name: "Hamburger",
            rating: 4.5,
            category: ["Burgers", "Chicken", "Fried"],
            thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
            price: 50000,
            discount: 60000,
        },
    ];

    const categories = ["All", "Combos", "Ưu đãi đặc biệt", "Burgers", "Classic", "Pizzas", "Mì", "Cơm", "Nước uống"];

    const filteredFoodItems = foodItems.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.restaurant.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.category.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const renderFoodItem = ({ item }: { item: FoodItem }) => (
        <TouchableOpacity style={styles.foodCard} onPress={() => navigation.navigate("DishDetail")}>
            <View style={styles.foodImage}>
                <View style={styles.imagePlaceholder}>
                    <Image source={item.thumbnail} resizeMode="" style={{ width: "100%", height: "100%" }} />
                </View>
            </View>
            <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <View
                    style={{ flexDirection: "row", padding: 1, alignItems: "center", justifyContent: "space-between" }}
                >
                    <Text style={styles.foodPrice}>{item.price}đ</Text>
                    <Text style={styles.foodPriceDiscount}>{item.discount}đ</Text>
                </View>
                <View style={styles.ratingContainer}>
                    <Text style={styles.rating}>★ {item.rating} (672)</Text>
                    <View
                        style={{ marginLeft: "auto", padding: 6, borderRadius: 6, backgroundColor: AppColors.primary }}
                    >
                        <AntDesign name="plus" size={10} color="white" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCategory = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryChipSelected]}
            onPress={() => setSelectedCategory(item)}
        >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextSelected]}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                            <AppLogo color={"#fff"} fontSize={30} />
                            <Text style={styles.tagline}>Chào {"Đặng Phúc Nguyên"}!</Text>
                        </View>

                        <Pressable onPress={() => navigation.navigate("Profile")}>
                            <Image source={require("../assets/images/user-avatar.jpg")} style={styles.avatar} />
                        </Pressable>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Pressable style={styles.searchButton} onPress={() => navigation.navigate("Search")}>
                            <Feather name="search" size={24} color="black" />
                            <Text style={{ color: "#999" }}>Bạn đang thèm gì nào?</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.categoriesContainer} horizontal showsHorizontalScrollIndicator={false}>
                    <FlatList
                        data={categories}
                        renderItem={renderCategory}
                        keyExtractor={(item) => item}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>

                {/* Food Items */}
                <View>
                    <Pressable style={styles.foodsTitle}>
                        <Text style={{ fontWeight: "600" }}>Burgers</Text>
                        <Entypo name="chevron-right" size={24} color="black" />
                    </Pressable>
                    <View style={styles.foodGrid}>
                        <FlatList
                            data={filteredFoodItems}
                            renderItem={renderFoodItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            horizontal
                        />
                    </View>
                </View>
                <View>
                    <Pressable style={styles.foodsTitle}>
                        <Text style={{ fontWeight: "600" }}>Burgers</Text>
                        <Entypo name="chevron-right" size={24} color="black" />
                    </Pressable>
                    <View style={styles.foodGrid}>
                        <FlatList
                            data={filteredFoodItems}
                            renderItem={renderFoodItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            horizontal
                        />
                    </View>
                </View>
                <View>
                    <Pressable style={styles.foodsTitle}>
                        <Text style={{ fontWeight: "600" }}>Burgers</Text>
                        <Entypo name="chevron-right" size={24} color="black" />
                    </Pressable>
                    <View style={styles.foodGrid}>
                        <FlatList
                            data={filteredFoodItems}
                            renderItem={renderFoodItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            horizontal
                        />
                    </View>
                </View>
            </View>

            {/* Cart */}
            <View style={styles.operationBar}>
                <TouchableOpacity
                    onPress={() => setShowCart(true)}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#d3d3d3",
                        borderRadius: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                    }}
                >
                    <Feather name="shopping-cart" size={18} color="#3d3d3d" />
                    <Text style={{ color: "#3d3d3d", marginLeft: 4, fontWeight: "600" }}>{1}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate("Checkout")}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: AppColors.primary,
                        borderRadius: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                    }}
                >
                    <Text style={{ color: "#ffffff" }}>Xem đơn hàng</Text>
                    <Entypo name="dot-single" size={18} color="white" />
                    <Text style={{ color: "#ffffff" }}>50.000đ</Text>
                </TouchableOpacity>
            </View>
            <CartBottomSheet visible={showCart} onClose={() => setShowCart(false)} cartItems={cartItems} />
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
    operationBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
});

export default HomeScreen;
