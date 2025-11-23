import { Entypo } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { AppColors } from "../assets/styles/AppColor";
import { foodApiClient } from "../services/foodApi";
import { FoodWithDetails } from "../types/food";
import FoodCard from "./FoodCard";

interface FoodSectionProps {
    title: string;
    foods: FoodWithDetails[];
    /** Optional backend category id; when provided the section will fetch its own foods */
    categoryId?: string;
    isLoading?: boolean;
    onFoodPress: (food: FoodWithDetails) => void;
    onAddToCart?: (food: FoodWithDetails) => void;
    onSeeAll?: () => void;
    favoriteIds?: Set<string>;
    onToggleFavorite?: (foodId: string) => void;
}

const FoodSection: React.FC<FoodSectionProps> = ({
    title,
    foods,
    categoryId,
    isLoading = false,
    onFoodPress,
    onAddToCart,
    onSeeAll,
}) => {
    const [localFoods, setLocalFoods] = useState<FoodWithDetails[]>([]);
    const [localLoading, setLocalLoading] = useState<boolean>(false);

    // helper to extract array from API shapes
    const extract = (resp: any): FoodWithDetails[] => {
        if (!resp) return [];
        if (Array.isArray(resp)) return resp as FoodWithDetails[];
        if (Array.isArray(resp.data)) return resp.data as FoodWithDetails[];
        if (resp.data && Array.isArray(resp.data.foods)) return resp.data.foods as FoodWithDetails[];
        if (resp.data && Array.isArray(resp.data.items)) return resp.data.items as FoodWithDetails[];
        if (Array.isArray(resp.foods)) return resp.foods as FoodWithDetails[];
        const vals = Object.values(resp || {});
        for (const v of vals) if (Array.isArray(v)) return v as FoodWithDetails[];
        return [];
    };

    useEffect(() => {
        let mounted = true;
        const fetchByCategory = async () => {
            if (!categoryId) return;
            setLocalLoading(true);
            try {
                const resp = await foodApiClient.getFoodsByCategory(categoryId);
                if (!mounted) return;
                const arr = extract(resp);
                setLocalFoods(arr);
            } catch (err) {
                console.error("FoodSection fetch error:", err);
                if (mounted) setLocalFoods([]);
            } finally {
                if (mounted) setLocalLoading(false);
            }
        };

        fetchByCategory();
        return () => {
            mounted = false;
        };
    }, [categoryId]);

    const renderFoodItem = ({ item }: { item: FoodWithDetails }) => (
        <FoodCard item={item} onPress={() => onFoodPress(item)} onAddToCart={() => onAddToCart?.(item)} />
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {onSeeAll && <Entypo name="chevron-right" size={24} color="black" onPress={onSeeAll} />}
            </View>

            {categoryId ? (
                localLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={AppColors.primary} />
                    </View>
                ) : Array.isArray(localFoods) && localFoods.length > 0 ? (
                    <FlatList
                        data={localFoods}
                        renderItem={renderFoodItem}
                        keyExtractor={(item, index) =>
                            String(item.id ?? (item as any).dish_id ?? item.name ?? `${title}-${index}`)
                        }
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Không có món ăn nào</Text>
                    </View>
                )
            ) : isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={AppColors.primary} />
                </View>
            ) : Array.isArray(foods) && foods.length > 0 ? (
                <FlatList
                    data={foods}
                    renderItem={renderFoodItem}
                    keyExtractor={(item, index) =>
                        String(item.id ?? (item as any).dish_id ?? item.name ?? `${title}-${index}`)
                    }
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
        marginVertical: 20,
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
        paddingVertical: 10,
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
