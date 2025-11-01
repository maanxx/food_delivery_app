import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppColors } from "../assets/styles/AppColor";
import { useAuth } from "../contexts/AuthContext";
import AppLogo from "../components/AppLogo";

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

import { useNavigation } from "@react-navigation/native";

const RegisterScreen: React.FC = () => {
    const navigation = useNavigation();
    const { register, isLoading, error, clearError } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateForm = (): boolean => {
        const { fullName, email, phone, password, confirmPassword } = formData;

        if (!fullName.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
            return false;
        }

        if (!email.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập email");
            return false;
        }

        if (!isValidEmail(email)) {
            Alert.alert("Lỗi", "Email không hợp lệ");
            return false;
        }

        if (!phone.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
            return false;
        }

        if (!isValidPhone(phone)) {
            Alert.alert("Lỗi", "Số điện thoại không hợp lệ");
            return false;
        }

        if (!password) {
            Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
            return false;
        }

        if (password.length < 6) {
            Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
            return false;
        }

        if (!agreeToTerms) {
            Alert.alert("Lỗi", "Vui lòng đồng ý với điều khoản sử dụng");
            return false;
        }

        return true;
    };

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPhone = (phone: string): boolean => {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone.replace(/\s/g, ""));
    };

    const handleRegister = async () => {
        // Clear any previous errors
        clearError();

        if (!validateForm()) {
            return;
        }

        try {
            const success = await register({
                fullname: formData.fullName,
                email: formData.email,
                phone_number: formData.phone,
                password: formData.password,
                country_code: "+84",
            });

            if (success) {
                Alert.alert("Thành công", "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.", [
                    {
                        text: "Đăng nhập",
                        onPress: () => router.replace("/login"),
                    },
                ]);
            } else {
                Alert.alert("Lỗi", error || "Đăng ký thất bại. Vui lòng thử lại.");
            }
        } catch {
            Alert.alert("Lỗi", "Lỗi kết nối. Vui lòng thử lại.");
        }
    };

    const handleLoginRedirect = () => {
        router.push("/login");
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
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={AppColors.text} />
                        </TouchableOpacity>

                        <AppLogo fontSize={40} color={AppColors.primary} fontFamily="Lobster" />
                        <Text style={styles.title}>Tạo tài khoản</Text>
                        <Text style={styles.subtitle}>Đăng ký để bắt đầu đặt món!</Text>
                    </View>

                    {/* Registration Form */}
                    <View style={styles.formContainer}>
                        {/* Full Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Họ và tên</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Nhập họ và tên"
                                    placeholderTextColor="#999"
                                    value={formData.fullName}
                                    onChangeText={(value) => handleInputChange("fullName", value)}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Nhập email của bạn"
                                    placeholderTextColor="#999"
                                    value={formData.email}
                                    onChangeText={(value) => handleInputChange("email", value)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        {/* Phone Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Số điện thoại</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor="#999"
                                    value={formData.phone}
                                    onChangeText={(value) => handleInputChange("phone", value)}
                                    keyboardType="phone-pad"
                                    maxLength={11}
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
                                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                    placeholderTextColor="#999"
                                    value={formData.password}
                                    onChangeText={(value) => handleInputChange("password", value)}
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

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.textInput, { flex: 1 }]}
                                    placeholder="Nhập lại mật khẩu"
                                    placeholderTextColor="#999"
                                    value={formData.confirmPassword}
                                    onChangeText={(value) => handleInputChange("confirmPassword", value)}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Terms and Conditions */}
                        <TouchableOpacity style={styles.termsContainer} onPress={() => setAgreeToTerms(!agreeToTerms)}>
                            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                                {agreeToTerms && <Ionicons name="checkmark" size={16} color={AppColors.surface} />}
                            </View>
                            <Text style={styles.termsText}>
                                Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{" "}
                                <Text style={styles.termsLink}>Chính sách bảo mật</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Text style={styles.registerButtonText}>Đang đăng ký...</Text>
                            ) : (
                                <Text style={styles.registerButtonText}>Đăng ký</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>hoặc</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social Register Buttons */}
                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color="#DB4437" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Đã có tài khoản? </Text>
                            <TouchableOpacity onPress={handleLoginRedirect}>
                                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 30,
        position: "relative",
    },
    backButton: {
        position: "absolute",
        left: 0,
        top: 0,
        padding: 8,
        zIndex: 1,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AppColors.surface,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        marginTop: 40,
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
        width: 50,
        height: 50,
    },
    title: {
        fontSize: 24,
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
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
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
        height: 52,
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
    termsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: "#E0E0E0",
        borderRadius: 4,
        marginRight: 12,
        marginTop: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    termsLink: {
        color: AppColors.primary,
        fontWeight: "500",
    },
    registerButton: {
        backgroundColor: AppColors.primary,
        borderRadius: 12,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: AppColors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.surface,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
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
        marginBottom: 24,
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
        height: 52,
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
        fontSize: 14,
        fontWeight: "500",
        color: AppColors.text,
        marginLeft: 8,
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 20,
    },
    loginText: {
        fontSize: 16,
        color: "#666",
    },
    loginLink: {
        fontSize: 16,
        color: AppColors.primary,
        fontWeight: "600",
    },
});

export default RegisterScreen;
