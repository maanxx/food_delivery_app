import React, { useState, useEffect, useCallback } from "react";
import { Animated } from "react-native";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons, AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../assets/styles/AppColor";
import { useFood } from "../contexts/FoodContext";
import { FoodWithDetails } from "../types/food";

interface SearchHistory {
    id: string;
    query: string;
    timestamp: number;
}

interface PopularSearch {
    id: string;
    query: string;
    count: number;
}

const SearchScreen = () => {
    const router = useRouter();
    const { foods } = useFood();

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<FoodWithDetails[]>([]);
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showResults, setShowResults] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [aiDescription, setAiDescription] = useState<string>("");
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    // Hiệu ứng fade-in cho khung mô tả AI
    useEffect(() => {
        if (aiDescription) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [aiDescription]);

    // Popular searches data
    const popularSearches: PopularSearch[] = [
        { id: "1", query: "Burger", count: 152 },
        { id: "2", query: "Pizza", count: 98 },
        { id: "3", query: "Gà rán", count: 87 },
        { id: "4", query: "Mì", count: 76 },
        { id: "5", query: "Cơm", count: 65 },
        { id: "6", query: "Bánh mì", count: 54 },
        { id: "7", query: "Phở", count: 43 },
        { id: "8", query: "Trà sữa", count: 39 },
    ];

    // Category filters
    const searchCategories = [
        { id: "all", name: "Tất cả", icon: "restaurant" },
        { id: "1", name: "Burger", icon: "fastfood" },
        { id: "2", name: "Pizza", icon: "local-pizza" },
        { id: "3", name: "Đồ uống", icon: "local-drink" },
        { id: "4", name: "Tráng miệng", icon: "cake" },
    ];

    useEffect(() => {
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        try {
            const history = await AsyncStorage.getItem("searchHistory");
            if (history) {
                setSearchHistory(JSON.parse(history));
            }
        } catch (error) {
            console.error("Load search history error:", error);
        }
    };

    const saveSearchHistory = async (query: string) => {
        try {
            const newSearch: SearchHistory = {
                id: Date.now().toString(),
                query: query.trim(),
                timestamp: Date.now(),
            };

            const updatedHistory = [
                newSearch,
                ...searchHistory.filter((item) => item.query.toLowerCase() !== query.toLowerCase()),
            ].slice(0, 10);

            setSearchHistory(updatedHistory);
            await AsyncStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Save search history error:", error);
        }
    };

    const clearSearchHistory = async () => {
        try {
            await AsyncStorage.removeItem("searchHistory");
            setSearchHistory([]);
        } catch (error) {
            console.error("Clear search history error:", error);
        }
    };

    const searchFoodByAI = async (text: string) => {
        setAiLoading(true);
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/ai/describe-food`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: text }),
            });
            const data = await res.json();
            setAiDescription(data.description);
        } catch (err) {
            setAiDescription("");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSearch = useCallback(
        async (query: string) => {
            if (!query.trim()) {
                setShowResults(false);
                setSearchResults([]);
                setAiDescription("");
                return;
            }

            setIsLoading(true);
            setShowResults(true);

            try {
                await saveSearchHistory(query);
                await searchFoodByAI(query);

                const keywords = query
                    .toLowerCase()
                    .replace(/[^a-zA-Z0-9\u00C0-\u1EF9 ]/g, " ")
                    .split(" ")
                    .filter(Boolean);

                const mockResults = foods.filter((food) => {
                    const nameWords = food.name
                        .toLowerCase()
                        .replace(/[^a-zA-Z0-9\u00C0-\u1EF9 ]/g, " ")
                        .split(" ")
                        .filter(Boolean);
                    const descWords = (food.description || "")
                        .toLowerCase()
                        .replace(/[^a-zA-Z0-9\u00C0-\u1EF9 ]/g, " ")
                        .split(" ")
                        .filter(Boolean);
                    return keywords.some((kw) => nameWords.includes(kw) || descWords.includes(kw));
                });

                setTimeout(() => {
                    setSearchResults(mockResults);
                    setIsLoading(false);
                }, 500);
            } catch (error) {
                console.error("Search error:", error);
                setIsLoading(false);
                Alert.alert("Lỗi", "Không thể thực hiện tìm kiếm. Vui lòng thử lại.");
            }
        },
        [foods, saveSearchHistory],
    );

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            handleSearch(searchQuery);
        }
    };

    const handleSearchHistoryPress = (query: string) => {
        setSearchQuery(query);
        handleSearch(query);
    };

    const handlePopularSearchPress = (query: string) => {
        setSearchQuery(query);
        handleSearch(query);
    };

    const handleFoodPress = (food: FoodWithDetails) => {
        router.push(`/dish-detail?foodId=${food.id}`);
    };

    const handleAddToCart = (food: FoodWithDetails) => {
        Alert.alert("Thành công", `Đã thêm ${food.name} vào giỏ hàng!`);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const renderSearchResult = ({ item }: { item: FoodWithDetails }) => (
        <TouchableOpacity style={styles.resultItem} onPress={() => handleFoodPress(item)} activeOpacity={0.8}>
            <Image source={{ uri: item.image_url || "https://via.placeholder.com/80" }} style={styles.resultImage} />
            <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.resultDescription} numberOfLines={1}>
                    {item.description || "Món ăn ngon"}
                </Text>
                <View style={styles.resultMeta}>
                    <Text style={styles.resultPrice}>{formatPrice(item.price)}</Text>
                    <View style={styles.ratingContainer}>
                        <AntDesign name="star" size={12} color="#FFD700" />
                        <Text style={styles.rating}>4.5</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
                <AntDesign name="plus" size={16} color="#fff" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderSearchHistory = ({ item }: { item: SearchHistory }) => (
        <TouchableOpacity style={styles.historyItem} onPress={() => handleSearchHistoryPress(item.query)}>
            <MaterialIcons name="history" size={20} color="#666" />
            <Text style={styles.historyText}>{item.query}</Text>
            <TouchableOpacity
                onPress={() => {
                    const updatedHistory = searchHistory.filter((h) => h.id !== item.id);
                    setSearchHistory(updatedHistory);
                    AsyncStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
                }}
            >
                <MaterialIcons name="close" size={16} color="#999" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderPopularSearch = ({ item }: { item: PopularSearch }) => (
        <TouchableOpacity style={styles.popularItem} onPress={() => handlePopularSearchPress(item.query)}>
            <Text style={styles.popularText}>{item.query}</Text>
        </TouchableOpacity>
    );

    const renderCategory = ({ item }: { item: (typeof searchCategories)[0] }) => (
        <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipSelected]}
            onPress={() => setSelectedCategory(item.id)}
        >
            <MaterialIcons
                name={item.icon as keyof typeof MaterialIcons.glyphMap}
                size={18}
                color={selectedCategory === item.id ? "#fff" : "#666"}
            />
            <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextSelected]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptyDescription}>Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả</Text>
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                {/* Header with search bar */}
                <View style={styles.header}>
                    <View style={styles.searchContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Feather name="arrow-left" size={24} color="#333" />
                        </TouchableOpacity>

                        <View style={styles.searchInputContainer}>
                            <Feather name="search" size={20} color="#666" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Bạn đang thèm gì nào?"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearchSubmit}
                                returnKeyType="search"
                                autoFocus={true}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchQuery("");
                                        setShowResults(false);
                                        setSearchResults([]);
                                    }}
                                >
                                    <MaterialIcons name="close" size={20} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Category filters */}
                    {showResults && (
                        <View style={styles.categoriesContainer}>
                            <FlatList
                                data={searchCategories}
                                renderItem={renderCategory}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoriesList}
                            />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={AppColors.primary} />
                            <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                        </View>
                    ) : showResults ? (
                        <View style={styles.resultsContainer}>
                            {aiLoading ? (
                                <View style={styles.aiDescriptionContainer}>
                                    <ActivityIndicator size="small" color={AppColors.primary} />
                                    <Text style={styles.aiLoadingText}>Đang tạo mô tả AI...</Text>
                                </View>
                            ) : null}
                            <FlatList
                                data={searchResults}
                                renderItem={renderSearchResult}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.resultsList}
                                ListHeaderComponent={
                                    <>
                                        {aiDescription && (
                                            <Animated.View
                                                style={[styles.aiDescriptionContainer, { opacity: fadeAnim }]}
                                            >
                                                <Text style={styles.aiDescriptionTitle}>Mô tả AI:</Text>
                                                <Text
                                                    style={styles.aiDescriptionText}
                                                    numberOfLines={showFullDescription ? undefined : 4}
                                                >
                                                    {aiDescription}
                                                </Text>
                                                {aiDescription.length > 200 && (
                                                    <TouchableOpacity
                                                        onPress={() => setShowFullDescription((prev) => !prev)}
                                                    >
                                                        <Text style={styles.seeMoreText}>
                                                            {showFullDescription ? "Thu gọn" : "Xem thêm"}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </Animated.View>
                                        )}
                                        <View style={styles.resultsHeader}>
                                            <Text style={styles.resultsTitle}>
                                                Kết quả cho &ldquo;{searchQuery}&rdquo;
                                            </Text>
                                            <Text style={styles.resultsCount}>{searchResults.length} món ăn</Text>
                                        </View>
                                    </>
                                }
                                ListEmptyComponent={renderEmptyState}
                            />
                        </View>
                    ) : (
                        <View style={styles.suggestionsContainer}>
                            {/* Search History */}
                            {searchHistory.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                                        <TouchableOpacity onPress={clearSearchHistory}>
                                            <Text style={styles.clearButton}>Xóa tất cả</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={searchHistory}
                                        renderItem={renderSearchHistory}
                                        keyExtractor={(item) => item.id}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>
                            )}

                            {/* Popular Searches */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Tìm kiếm phổ biến</Text>
                                <FlatList
                                    data={popularSearches}
                                    renderItem={renderPopularSearch}
                                    keyExtractor={(item) => item.id}
                                    numColumns={2}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.popularList}
                                />
                            </View>

                            {/* Quick Access */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
                                <View style={styles.quickAccessContainer}>
                                    <TouchableOpacity style={styles.quickAccessItem}>
                                        <MaterialIcons name="favorite" size={24} color={AppColors.primary} />
                                        <Text style={styles.quickAccessText}>Yêu thích</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.quickAccessItem}>
                                        <MaterialIcons name="history" size={24} color={AppColors.primary} />
                                        <Text style={styles.quickAccessText}>Đã đặt</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.quickAccessItem}>
                                        <MaterialIcons name="local-offer" size={24} color={AppColors.primary} />
                                        <Text style={styles.quickAccessText}>Khuyến mãi</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.quickAccessItem}>
                                        <MaterialIcons name="star" size={24} color={AppColors.primary} />
                                        <Text style={styles.quickAccessText}>Đánh giá cao</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        backgroundColor: "#fff",
        paddingTop: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        marginLeft: 10,
    },
    categoriesContainer: {
        paddingVertical: 10,
    },
    categoriesList: {
        paddingHorizontal: 15,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: "#f5f5f5",
        borderRadius: 20,
        marginRight: 10,
    },
    categoryChipSelected: {
        backgroundColor: AppColors.primary,
    },
    categoryText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
        marginLeft: 5,
    },
    categoryTextSelected: {
        color: "#fff",
    },
    content: {
        flex: 1,
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
    resultsContainer: {
        flex: 1,
    },
    resultsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    resultsCount: {
        fontSize: 14,
        color: "#666",
    },
    resultsList: {
        padding: 15,
    },
    resultItem: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resultImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    resultInfo: {
        flex: 1,
        justifyContent: "space-between",
    },
    resultName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    resultDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    resultMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    resultPrice: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.primary,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    rating: {
        fontSize: 14,
        color: "#666",
        marginLeft: 4,
    },
    addButton: {
        backgroundColor: AppColors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
    },
    suggestionsContainer: {
        flex: 1,
        padding: 15,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    clearButton: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: "500",
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 8,
    },
    historyText: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        marginLeft: 12,
    },
    popularList: {
        justifyContent: "space-between",
    },
    popularItem: {
        flex: 1,
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
        alignItems: "center",
    },
    popularText: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
    },
    quickAccessContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    quickAccessItem: {
        width: "48%",
        backgroundColor: "#fff",
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 10,
    },
    quickAccessText: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        marginTop: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
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
    },
    aiDescriptionContainer: {
        backgroundColor: "#f0f0f0",
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 15,
        marginBottom: 12,
    },
    aiDescriptionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#d48806",
        marginBottom: 4,
    },
    aiDescriptionText: {
        fontSize: 15,
        color: "#333",
    },
    aiLoadingText: {
        color: AppColors.primary,
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
    },
    seeMoreText: {
        color: AppColors.primary,
        fontWeight: "500",
        marginTop: 6,
        fontSize: 14,
        textAlign: "right",
    },
});

export default SearchScreen;
