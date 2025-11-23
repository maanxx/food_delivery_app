import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { FoodWithDetails } from "../types/food";
import FoodCard from "./FoodCard"; // Giả sử bạn đã có FoodCard, nếu chưa thì dùng View/Text thay thế

interface GridCategorySectionProps {
    title: string;
    foods: FoodWithDetails[];
    onFoodPress?: (food: FoodWithDetails) => void;
    onAddToCart?: (food: FoodWithDetails) => void;
    isLoading?: boolean;
}

const GridCategorySection: React.FC<GridCategorySectionProps> = ({
    title,
    foods,
    onFoodPress,
    onAddToCart,
    isLoading,
}) => {
    //print foods
    console.log(`Foods in ${title}:`, foods);

    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {isLoading ? (
                <Text style={styles.loadingText}>Đang tải...</Text>
            ) : (
                <FlatList
                    data={foods}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.grid}
                    renderItem={({ item }) => (
                        <FoodCard
                            key={item.id}
                            item={item}
                            onPress={() => onFoodPress?.(item)}
                            onAddToCart={() => onAddToCart?.(item)}
                        />
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>Không có món ăn nào.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333",
    },
    grid: {
        paddingBottom: 10,
    },
    row: {
        flex: 1,
        justifyContent: "space-between",
        gap: 2, 
        marginBottom: 30,
    },
    loadingText: {
        textAlign: "center",
        color: "#999",
        marginVertical: 20,
    },
    emptyText: {
        textAlign: "center",
        color: "#999",
        marginVertical: 20,
    },
});

export default GridCategorySection;
