import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { HomeScreen, FavoriteScreen, ProfileScreen, OrderHistoryScreen } from "../screens/index";
import { AppColors } from "../assets/styles/AppColor";
import { Text } from "react-native";

const Tab = createBottomTabNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    height: 60,
                    elevation: 5,
                },
                tabBarIcon: ({ focused }) => {
                    let iconName;
                    if (route.name === "Home") iconName = focused ? "home" : "home-outline";
                    else if (route.name === "OrderHistory") iconName = focused ? "time" : "time-outline";
                    else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
                    else if (route.name === "Favorite") iconName = focused ? "cart" : "heart-outline";

                    return <Ionicons name={iconName} size={20} color={focused ? AppColors.primary : "#999"} />;
                },
                tabBarLabel: ({ focused }) => (
                    <Text
                        style={{
                            fontSize: 10,
                            marginBottom: 4,
                            color: focused ? AppColors.primary : "#999",
                        }}
                    >
                        {route.name === "Home"
                            ? "Trang chủ"
                            : route.name === "Favorite"
                            ? "Yêu thích"
                            : route.name === "Profile"
                            ? "Tài khoản"
                            : "Hoạt động"}
                    </Text>
                ),
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Favorite" component={FavoriteScreen} />
        </Tab.Navigator>
    );
}

export default TabNavigator;
