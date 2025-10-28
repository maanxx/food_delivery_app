import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, TextInput } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { AppColors } from "../assets/styles/AppColor";
import { AntDesign, Entypo, FontAwesome } from "@expo/vector-icons";
import { formatCurrency } from "../utils/MoneyUtil";

type RootStackParamList = {
    DishDetail: undefined;
    OrderSuccess: undefined;
};

type DishDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DishDetail">;

const DishDetailScreen: React.FC = () => {
    const navigation = useNavigation<DishDetailScreenNavigationProp>();
    const [quantity, setQuantity] = useState<number>(1);
    const [currPrice] = useState<number>(50000);

    const handleAddToCart = () => {
        navigation.goBack();
    };



    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Food Image */}

                <View style={{ position: "relative" }}>
                    <TouchableOpacity
                        style={{ position: "absolute", top: 40, left: 16, zIndex: 99 }}
                        onPress={() => navigation.goBack()}
                    >
                        <Entypo name="back" size={30} color="black" />
                    </TouchableOpacity>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg")} // Replace with your image
                            style={styles.foodImage}
                            resizeMode="cover"
                        />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Burger phô mai Wendy’s</Text>
                            <View style={styles.ratingContainer}>
                                <FontAwesome name="cart-arrow-down" size={16} color="black" />
                                <Text>{234} đã bán</Text>
                                <Text> | </Text>
                                <AntDesign name="star" size={16} color={AppColors.primary} />
                                <Text style={styles.rating}>4.9</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.price}>{50000}đ</Text>
                            <Text style={styles.discount}>{60000}đ</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>
                        Burger phô mai Wendy’s là món burger cổ điển đậm đà hương vị, với phần thịt bò nướng mọng nước,
                        phô mai tan chảy béo ngậy, rau xà lách giòn, cà chua tươi và dưa chua hấp dẫn.
                    </Text>

                    {/* Note Section */}
                    <View style={styles.noteSection}>
                        <Text style={styles.noteTitle}>Ghi chú cho quán</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholderTextColor={"#8f8f8f"}
                            placeholder="Cho quán biết thêm về yêu cầu của bạn."
                        />
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />
                </View>
            </ScrollView>
            {/* Price and Order Button */}
            <View style={styles.footer}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "85%",
                        marginBottom: 10,
                    }}
                >
                    <Text style={styles.price}>{formatCurrency(currPrice * quantity)}</Text>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <TouchableOpacity
                            style={[styles.button, quantity <= 1 ? styles.disabledButton : {}]}
                            disabled={quantity <= 1}
                            onPress={() => {
                                setQuantity(quantity > 1 ? quantity - 1 : 1);
                            }}
                        >
                            <AntDesign name="minus" size={13} color="white" />
                        </TouchableOpacity>
                        <TextInput
                            style={{
                                color: AppColors.primary,
                                fontSize: 12,
                                fontWeight: "bold",
                                marginHorizontal: 10,
                                textAlign: "center",
                                width: 20,
                            }}
                            value={String(quantity)}
                            onChangeText={(text) => {
                                setQuantity(Number(text) >= 1 && Number(text) <= 99 ? Number(text) : quantity);
                            }}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity
                            style={[styles.button, quantity >= 99 ? styles.disabledButton : {}]}
                            onPress={() => {
                                setQuantity(quantity < 99 ? quantity + 1 : 99);
                            }}
                        >
                            <AntDesign name="plus" size={13} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.orderButton} onPress={handleAddToCart}>
                    <Text style={styles.orderButtonText}>Thêm vào giỏ</Text>
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
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    title: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
        maxWidth: 250,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    rating: {
        fontSize: 12,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    deliveryTime: {
        fontSize: 16,
        color: "#666",
        marginLeft: 4,
    },
    description: {
        fontSize: 12,
        color: "#666",
        lineHeight: 22,
        marginBottom: 24,
    },
    noteSection: {
        marginBottom: 24,
        borderTopWidth: 5,
        borderBottomWidth: 5,
        borderTopColor: "#e5e5e5a2",
        borderBottomColor: "#e5e5e5a2",
        paddingTop: 5,
    },
    noteTitle: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#000000",
    },
    noteInput: {
        borderColor: "#c5c5c5",
        padding: 10,
        marginTop: 10,
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 12,
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E5E5",
        marginVertical: 20,
    },
    footer: {
        position: "fixed",
        justifyContent: "space-between",
        alignItems: "center",
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 20,
        backgroundColor: "#fff",
    },
    price: {
        fontSize: 15,
        fontWeight: "bold",
        color: AppColors.primary,
    },
    discount: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#333",
        textDecorationLine: "line-through",
    },
    orderButton: {
        backgroundColor: AppColors.primary,
        width: "85%",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    orderButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    },
    button: {
        textAlign: "center",
        padding: 3,
        backgroundColor: AppColors.primary,
        borderRadius: 5,
    },
    disabledButton: {
        backgroundColor: "#ccc",
    },
});

export default DishDetailScreen;
