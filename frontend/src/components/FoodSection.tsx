import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";
import { FoodWithDetails } from "../types/food";
import FoodCard from "./FoodCard";

interface FoodSectionProps {
    title: string;
    foods: FoodWithDetails[];
    isLoading?: boolean;
    onFoodPress: (food: FoodWithDetails) => void;
    onAddToCart?: (food: FoodWithDetails) => void;
    onSeeAll?: () => void;
}

const FoodSection: React.FC<FoodSectionProps> = ({
    title,
    foods,
    isLoading = false,
    onFoodPress,
    onAddToCart,
    onSeeAll,
}) => {
    const renderFoodItem = ({ item }: { item: FoodWithDetails }) => (
        <FoodCard item={item} onPress={() => onFoodPress(item)} onAddToCart={() => onAddToCart?.(item)} />
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {onSeeAll && <Entypo name="chevron-right" size={24} color="black" onPress={onSeeAll} />}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={AppColors.primary} />
                </View>
            ) : Array.isArray(foods) && foods.length > 0 ? (
                <FlatList
                    data={foods}
                    renderItem={renderFoodItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không có món ăn nào</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    listContainer: {
        paddingHorizontal: 15,
    },
    loadingContainer: {
        height: 150,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        height: 100,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
    },
});

export default FoodSection;
