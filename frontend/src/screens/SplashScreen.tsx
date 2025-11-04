import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, SafeAreaView, Animated } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";
import AppLogo from "../components/AppLogo";

const chickenImage = require("../assets/images/splash/fried-chicken.png");
const burger1Image = require("../assets/images/splash/burger1.png");
const burger2Image = require("../assets/images/splash/burger2.png");

function SplashScreen() {
    const router = useRouter();

    const logoScale = useRef(new Animated.Value(0.8)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;
    const loadingRotation = useRef(new Animated.Value(0)).current;
    const fadeOut = useRef(new Animated.Value(1)).current;
    const burgerSlide1 = useRef(new Animated.Value(-200)).current;
    const burgerSlide2 = useRef(new Animated.Value(-300)).current;
    const chickenSlide = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
        startAnimations();
    }, []);

    const startAnimations = () => {
        Animated.sequence([
            // Logo and images appear
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 80,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(burgerSlide1, {
                    toValue: 0,
                    tension: 60,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(burgerSlide2, {
                    toValue: 0,
                    tension: 60,
                    friction: 8,
                    delay: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(chickenSlide, {
                    toValue: 0,
                    tension: 60,
                    friction: 8,
                    delay: 400,
                    useNativeDriver: true,
                }),
            ]),
            // Title appears
            Animated.timing(titleOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            // Loading appears
            Animated.timing(loadingOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Start loading rotation
            startLoadingAnimation();

            // Auto navigate after 3 seconds
            setTimeout(() => {
                navigateToHome();
            }, 2000);
        });
    };

    const startLoadingAnimation = () => {
        Animated.loop(
            Animated.timing(loadingRotation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ).start();
    };

    const navigateToHome = () => {
        // Fade out animation before navigation
        Animated.timing(fadeOut, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            router.replace("/(tabs)/");
        });
    };

    const spin = loadingRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Animated.View style={[styles.container, { opacity: fadeOut }]}>
            <LinearGradient
                colors={[AppColors.primary, "#ffa0a0", "#e45441"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Chicken Image */}
                    <Animated.Image
                        source={chickenImage}
                        style={[
                            styles.chickenImage,
                            {
                                transform: [{ translateY: chickenSlide }],
                                opacity: logoOpacity,
                            },
                        ]}
                    />

                    {/* Logo */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: logoOpacity,
                                transform: [{ scale: logoScale }],
                            },
                        ]}
                    >
                        <AppLogo />
                    </Animated.View>

                    {/* App Title */}
                    <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
                        <Text style={styles.appSubtitle}>Thưởng thức món ngon mọi lúc mọi nơi</Text>
                    </Animated.View>

                    {/* Loading */}
                    <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
                        <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]}>
                            <MaterialIcons name="refresh" size={28} color="#fff" />
                        </Animated.View>
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </Animated.View>

                    {/* Burger Images */}
                    <Animated.Image
                        source={burger1Image}
                        style={[
                            styles.burgerImage,
                            {
                                left: 100,
                                transform: [{ translateX: burgerSlide1 }],
                                opacity: logoOpacity,
                            },
                        ]}
                    />
                    <Animated.Image
                        source={burger2Image}
                        style={[
                            styles.burgerImage,
                            {
                                left: 0,
                                transform: [{ translateX: burgerSlide2 }],
                                opacity: logoOpacity,
                            },
                        ]}
                    />
                </SafeAreaView>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    chickenImage: {
        width: "60%",
        height: "40%",
        resizeMode: "contain",
        position: "absolute",
        top: 0,
    },
    logoContainer: {
        alignItems: "center",
        zIndex: 2,
    },
    titleContainer: {
        alignItems: "center",
        marginTop: 20,
        paddingHorizontal: 20,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        letterSpacing: 1,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 8,
    },
    appSubtitle: {
        fontSize: 16,
        color: "#fff",
        textAlign: "center",
        opacity: 0.9,
        fontWeight: "300",
        letterSpacing: 0.5,
    },
    loadingContainer: {
        alignItems: "center",
        marginTop: 40,
        gap: 12,
    },
    loadingSpinner: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "500",
        opacity: 0.9,
    },
    burgerImage: {
        position: "absolute",
        resizeMode: "contain",
        bottom: 0,
    },
});

export default SplashScreen;
