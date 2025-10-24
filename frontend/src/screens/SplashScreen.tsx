import React from "react";
import { StyleSheet, View, Image } from "react-native";
import { AppColors } from "../assets/styles/AppColor";
import AppLogo from "../components/AppLogo";

function SplashScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require("../assets/images/splash/fried-chicken.png")}
                style={{ width: "60%", height: "40%", resizeMode: "contain", position: "absolute", top: 0 }}
            />
            <AppLogo />
            <Image
                source={require("../assets/images/splash/burger1.png")}
                style={[styles.burgerImage, { left: 100 }]}
            />
            <Image source={require("../assets/images/splash/burger2.png")} style={[styles.burgerImage, { left: 0 }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: AppColors.primary,
        position: "relative",
        width: "100%",
        height: "100%",
    },
    burgerImage: {
        position: "absolute",
        resizeMode: "contain",
        bottom: 0,
    },
});

export default SplashScreen;
