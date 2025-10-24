import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {
    SplashScreen,
    LoginScreen,
    RegisterScreen,
    HomeScreen,
    DishDetailScreen,
    CartScreen,
    ProfileScreen,
} from "../screens/index";

const Stack = createNativeStackNavigator();

function AppNavigation() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="DishDetail" component={DishDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
    );
}

export default AppNavigation;
