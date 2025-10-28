import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {
    SplashScreen,
    LoginScreen,
    RegisterScreen,
    DishDetailScreen,
    OrderSuccessScreen,
    SearchScreen,
    CartScreen,
    CheckoutScreen,
} from "../screens/index";
import TabNavigator from "../navigation/TabNavigator";

const Stack = createNativeStackNavigator();

function AppNavigation() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="DishDetail" component={DishDetailScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
        </Stack.Navigator>
    );
}

export default AppNavigation;
