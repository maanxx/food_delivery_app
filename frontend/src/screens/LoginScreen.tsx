import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator, // <-- added
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppColors } from "../assets/styles/AppColor";
import { useAuth } from "../contexts/AuthContext";
import AppLogo from "../components/AppLogo";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { ResponseType } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- added

// Ensure redirect handling
WebBrowser.maybeCompleteAuthSession();

const LoginScreen: React.FC = () => {
    const { login, isLoading, error, clearError } = useAuth();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [googleLoading, setGoogleLoading] = useState<boolean>(false);

    // Configure Google auth request - REPLACE client IDs with yours
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com", // expo client id (for dev in expo)
        iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
        androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
        webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com", // for backend token verification
        responseType: ResponseType.IdToken,
        scopes: ["profile", "email"],
    });

    useEffect(() => {
        // handle response after promptAsync
        (async () => {
            if (response?.type === "success") {
                const idToken = response.authentication?.idToken;
                if (!idToken) {
                    setGoogleLoading(false);
                    Alert.alert("Lỗi", "Không nhận được idToken từ Google.");
                    return;
                }

                try {
                    // Gửi idToken về backend để verify / tạo session
                    const res = await fetch("https://YOUR_BACKEND_URL/api/auth/google", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken }),
                    });

                    if (!res.ok) {
                        const errText = await res.text();
                        throw new Error(errText || "Server error");
                    }

                    const data = await res.json();
                    // Lưu token và user vào AsyncStorage (hoặc gọi context nếu bạn có hàm cập nhật auth)
                    // Backend nên trả về dạng: { token: '...', user: { id, name, email, ... } }
                    if (data?.token) {
                        await AsyncStorage.setItem("authToken", data.token);
                    }
                    if (data?.user) {
                        await AsyncStorage.setItem("user", JSON.stringify(data.user));
                    }

                    setGoogleLoading(false);
                    router.replace("/splash")
                } catch (err: any) {
                    setGoogleLoading(false);
                    Alert.alert("Lỗi", err.message || "Đăng nhập thất bại");
                }
            } else if (response?.type === "error") {
                setGoogleLoading(false);
                Alert.alert("Lỗi", "Google sign-in thất bại");
            }
        })();
    }, [response]);

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            // promptAsync opens the Google sign-in
            await promptAsync({ useProxy: true, showInRecents: true });
            // result handled in useEffect via `response`
        } catch (err: any) {
            setGoogleLoading(false);
            Alert.alert("Lỗi", err.message || "Không thể đăng nhập bằng Google");
        }
    };

    const handleLogin = async () => {
        // Clear any previous errors
        clearError();

        if (!email || !password) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert("Lỗi", "Email không hợp lệ");
            return;
        }

        try {
            const success = await login({ email, password });

            if (success) {
                router.replace("/splash")
            } else {
                Alert.alert("Lỗi", error || "Đăng nhập thất bại. Vui lòng thử lại.");
            }
        } catch {
            Alert.alert("Lỗi", "Lỗi kết nối. Vui lòng thử lại.");
        }
    };

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleForgotPassword = () => {
        router.push("/forgot-password");
    };

    const handleRegister = () => {
        router.push("/register");
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo and Header */}
                    <View style={styles.header}>
                        <AppLogo fontSize={40} color={AppColors.primary} fontFamily="Lobster" />
                        <Text style={styles.subtitle}>Chào mừng bạn trở lại!</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Nhập email của bạn"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Mật khẩu</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.textInput, { flex: 1 }]}
                                    placeholder="Nhập mật khẩu"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
                            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Text style={styles.loginButtonText}>Đang đăng nhập...</Text>
                            ) : (
                                <Text style={styles.loginButtonText}>Đăng nhập</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>hoặc</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleGoogleSignIn}
                                disabled={googleLoading}
                            >
                                {googleLoading ? (
                                    <ActivityIndicator />
                                ) : (
                                    <>
                                        <Ionicons name="logo-google" size={24} color="#DB4437" />
                                        <Text style={styles.socialButtonText}>Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
                            <TouchableOpacity onPress={handleRegister}>
                                <Text style={styles.registerLink}>Đăng ký ngay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AppColors.surface,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    logo: {
        width: 60,
        height: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: AppColors.primary,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    formContainer: {
        width: "100%",
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: AppColors.surface,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: AppColors.text,
        paddingVertical: 0,
    },
    eyeIcon: {
        padding: 4,
    },
    forgotPasswordContainer: {
        alignItems: "flex-end",
        marginBottom: 30,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: "500",
    },
    loginButton: {
        backgroundColor: AppColors.primary,
        borderRadius: 12,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
        shadowColor: AppColors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: AppColors.surface,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E0E0E0",
    },
    dividerText: {
        fontSize: 14,
        color: "#666",
        marginHorizontal: 16,
    },
    socialButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    socialButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: AppColors.surface,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        height: 56,
        marginHorizontal: 6,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: AppColors.text,
        marginLeft: 8,
    },
    registerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    registerText: {
        fontSize: 16,
        color: "#666",
    },
    registerLink: {
        fontSize: 16,
        color: AppColors.primary,
        fontWeight: "600",
    },
});

export default LoginScreen;
