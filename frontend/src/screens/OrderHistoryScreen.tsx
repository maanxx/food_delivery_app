import React from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppColors } from "../assets/styles/AppColor";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface OrderItem {
  id: string;
  name: string;
  description: string;
  thumbnail: any;
  category: string[];
  restaurantName: string;
  orderDate: string;
  quantity: number;
  price: number;
  totalPrice: number;
  orderStatus: "delivered" | "pending" | "cancelled";
  rating?: number;
}

function OrderHistoryScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const orderItems: OrderItem[] = [
    {
      id: "1",
      name: "Cheeseburger Whopper",
      description:
        "Bánh burger bò nướng với phô mai tan chảy và rau tươi giòn rụm.",
      thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
      category: ["Burgers", "Combos"],
      restaurantName: "Burger King",
      orderDate: "2025-10-29",
      quantity: 2,
      price: 50000,
      totalPrice: 100000,
      orderStatus: "delivered",
      rating: 5,
    },
    {
      id: "2",
      name: "Double Beef Burger",
      description:
        "Hai lớp thịt bò nướng đậm vị, ăn kèm sốt đặc biệt và phô mai cheddar.",
      thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
      category: ["Burgers", "Specials"],
      restaurantName: "Texas Chicken",
      orderDate: "2025-10-27",
      quantity: 1,
      price: 75000,
      totalPrice: 75000,
      orderStatus: "delivered",
    },
    {
      id: "3",
      name: "Veggie Burger",
      description:
        "Bánh burger rau củ cho người ăn chay, vị nhẹ nhưng vẫn đậm đà.",
      thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
      category: ["Burgers", "Vegetarian"],
      restaurantName: "Green Bites",
      orderDate: "2025-10-25",
      quantity: 1,
      price: 60000,
      totalPrice: 60000,
      orderStatus: "delivered",
      rating: 4,
    },
    {
      id: "4",
      name: "Spicy Chicken Burger",
      description:
        "Burger gà cay với lớp vỏ giòn rụm, vị cay vừa đủ, ăn hoài không ngán.",
      thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
      category: ["Burgers", "Chicken"],
      restaurantName: "Lotteria",
      orderDate: "2025-10-24",
      quantity: 3,
      price: 49000,
      totalPrice: 147000,
      orderStatus: "cancelled",
    },
    {
      id: "5",
      name: "Spicy Chicken Burger",
      description:
        "Burger gà cay với lớp vỏ giòn rụm, vị cay vừa đủ, ăn hoài không ngán.",
      thumbnail: require("../assets/images/foods/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg"),
      category: ["Burgers", "Chicken"],
      restaurantName: "Lotteria",
      orderDate: "2025-10-24",
      quantity: 3,
      price: 49000,
      totalPrice: 147000,
      orderStatus: "pending",
    },
  ];

  {
    /* render sản phẩm  */
  }
  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <TouchableOpacity
      style={styles.foodCard}
    >
      {/* Ảnh món ăn + overlay trạng thái và loại */}
      <View style={styles.imageContainer}>
        <Image source={item.thumbnail} style={styles.foodImage} />

        <View style={styles.overlayTop}>
          {/* Loại món */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category[0]}</Text>
          </View>

          {/* Trạng thái đơn */}
          <View
            style={[
              styles.statusTag,
              item.orderStatus === "delivered"
                ? styles.statusDelivered
                : item.orderStatus === "pending"
                ? styles.statusPending
                : styles.statusCancelled,
            ]}
          >
            <Text style={styles.statusText}>
              {item.orderStatus === "delivered"
                ? "Đã giao"
                : item.orderStatus === "pending"
                ? "Đang xử lý"
                : "Đã hủy"}
            </Text>
          </View>
        </View>
      </View>

      {/* Thông tin đơn hàng */}
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodRestaurant}>{item.restaurantName}</Text>
        <Text style={styles.foodPrice}>
          Tổng: {item.totalPrice.toLocaleString()}đ ({item.quantity} món)
        </Text>
        <Text style={styles.orderId}>Mã đơn: #{item.id}</Text>
        <Text style={styles.orderDate}>Ngày đặt: {item.orderDate}</Text>

        {/* Nút hành động */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.reviewButton}>
            <Text style={styles.reviewText}>Đánh giá</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reorderButton}>
            <Text style={styles.reorderText}>Mua lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // render đơn hàng đang chờ giao
  // cập nhật renderOrderPending
  const renderOrderPending = ({ item }: { item: OrderItem }) => (
    <TouchableOpacity style={styles.pendingCard}>
      <View style={styles.pendingInfo}>
        {/* ---------- PHẦN TRÊN: trạng thái, tên, nhà hàng ---------- */}
        <View style={styles.pendingTop}>
          <Image source={item.thumbnail} style={styles.pendingImage} />
          <View style={{ flexDirection: "column" }}>
            <View
              style={[
                styles.statusTag,
                item.orderStatus === "pending"
                  ? styles.statusPending
                  : styles.statusCancelled,
                { width: "60%" },
              ]}
            >
              <Text style={[styles.statusText, { marginHorizontal: 5 }]}>
                {item.orderStatus === "pending" ? "Đang xử lý" : "Đã hủy"}
              </Text>
            </View>

            <Text style={styles.pendingName}>{item.name}</Text>

            <Text style={styles.pendingRestaurant}>{item.restaurantName}</Text>
          </View>
        </View>

        {/* ---------- PHẦN DƯỚI: số lượng, tổng tiền, button (riêng 1 hàng) ---------- */}
        <View style={styles.pendingBottomRow}>
          <View style={styles.pendingLeft}>
            <Text style={styles.pendingQty}>Số lượng: {item.quantity}</Text>
          </View>

          <View style={styles.pendingCenter}>
            <Text style={styles.pendingTotal}>
              {item.totalPrice.toLocaleString()}đ
            </Text>
          </View>
        </View>
        <View style={styles.pendingRight}>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  {
    /* đơn hàng đang xử lý */
  }
  const pendingOrder = orderItems.filter(
    (item) => item.orderStatus === "pending"
  );
  {
    /* đơn hàng giao rồi */
  }
  const deliveryOrder = orderItems.filter(
    (item) => item.orderStatus === "delivered"
  );

  return (
    <View style={styles.container}>
      {/* Thanh tiêu đề */}
      <View style={styles.toolBar}>
        <Text style={styles.orderMine}>Đơn của tôi</Text>
        <Feather name="search" size={24} color="black" />
      </View>

      {/* Phần chờ giao hàng */}
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chờ giao hàng</Text>
        </View>

        {pendingOrder.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ color: "#999" }}>
              Hiện chưa có đơn hàng nào đang giao.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingOrder}
            renderItem={renderOrderPending}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        )}
      </View>

      {/* Phần đã giao */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Đơn đã giao</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orderItems}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  toolBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  orderMine: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  emptyBox: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    paddingVertical: 10,
  },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  foodImage: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  overlayTop: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryTag: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  statusDelivered: { backgroundColor: "#4caf50" },
  statusPending: { backgroundColor: "#ff9800" },
  statusCancelled: { backgroundColor: "#f44336" },
  foodInfo: {
    padding: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  foodRestaurant: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e53935",
  },
  orderId: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#777",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  reviewButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  reorderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e53935",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  reviewText: {
    color: "#333",
    fontWeight: "500",
  },
  reorderText: {
    color: "#e53935",
    fontWeight: "600",
  },
  // {/* style phần chờ giao hàng */}
  pendingCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: "flex-start",
  },
  pendingTop: {
    flexDirection: "row",
  },
  pendingImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },

  pendingInfo: {
    flex: 1,
    justifyContent: "space-between", // đảm bảo top và bottom tách biệt
  },

  statusDeliveredLight: {
    backgroundColor: "#f0fff4",
    borderColor: "#4caf50",
  },

  statusTextPending: { color: "#FFF" },
  statusTextCancelled: { color: "#b71c1c" },
  statusTextDelivered: { color: "#2e7d32" },

  pendingName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 2,
  },

  pendingRestaurant: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },

  /* --- Bottom row: qty | total | button --- */
  pendingBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },

  pendingLeft: {
    flex: 1,
  },
  pendingCenter: {
    flex: 1,
    alignItems: "center",
  },
  pendingRight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  pendingQty: {
    fontSize: 13,
    color: "#444",
  },

  pendingTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e53935",
  },

  detailsButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff9800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 9,
    marginHorizontal: 14,
    borderRadius: 20,
    width: "100%",
    height: 40,
  },
  detailsButtonText: {
    textAlign: "center",
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
});

export default OrderHistoryScreen;
