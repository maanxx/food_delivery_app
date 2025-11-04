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

const ForgotPasswordScreen: React.FC = () => {
    const { forgotPassword, isLoading, error, clearError } = useAuth();
    const [email, setEmail] = useState<string>("");
    const [emailSent, setEmailSent] = useState<boolean>(false);

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSendResetEmail = async () => {
        // Clear any previous errors
        clearError();

        if (!email.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập email của bạn");
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert("Lỗi", "Email không hợp lệ");
            return;
        }

        try {
            const success = await forgotPassword(email);

            if (success) {
                setEmailSent(true);
                Alert.alert(
                    "Thành công",
                    "Email khôi phục mật khẩu đã được gửi đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.",
                );
            } else {
                Alert.alert("Lỗi", error || "Không thể gửi email khôi phục. Vui lòng thử lại.");
            }
        } catch {
            Alert.alert("Lỗi", "Lỗi kết nối. Vui lòng thử lại.");
        }
    };

    const handleResendEmail = () => {
        setEmailSent(false);
        handleSendResetEmail();
    };

    const handleBackToLogin = () => {
        router.push("/login");
    };

    if (emailSent) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={AppColors.text} />
                    </TouchableOpacity>

                    {/* Success Icon */}
                    <View style={styles.successIconContainer}>
                        <View style={styles.successIcon}>
                            <Ionicons name="mail-outline" size={60} color={AppColors.primary} />
                        </View>
                    </View>

                    {/* Success Content */}
                    <View style={styles.successContent}>
                        <Text style={styles.successTitle}>Email đã được gửi!</Text>
                        <Text style={styles.successSubtitle}>Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến</Text>
                        <Text style={styles.emailText}>{email}</Text>
                        <Text style={styles.instructionText}>
                            Vui lòng kiểm tra hộp thư (kể cả thư mục spam) và làm theo hướng dẫn để đặt lại mật khẩu.
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.resendButton} onPress={handleResendEmail}>
                            <Text style={styles.resendButtonText}>Gửi lại email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.backToLoginButton} onPress={handleBackToLogin}>
                            <Text style={styles.backToLoginButtonText}>Quay lại đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

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
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color={AppColors.text} />
                        </TouchableOpacity>

                        <AppLogo fontSize={40} color={AppColors.primary} fontFamily="Lobster" />

                        <Text style={styles.title}>Quên mật khẩu?</Text>
                        <Text style={styles.subtitle}>
                            Đừng lo lắng! Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu đến email của bạn.
                        </Text>
                    </View>

                    {/* Reset Form */}
                    <View style={styles.formContainer}>
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Nhập email đã đăng ký"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus={true}
                                />
                            </View>
                        </View>

                        {/* Send Reset Email Button */}
                        <TouchableOpacity
                            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                            onPress={handleSendResetEmail}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.sendButtonText}>Đang gửi...</Text>
                                </View>
                            ) : (
                                <Text style={styles.sendButtonText}>Gửi email khôi phục</Text>
                            )}
                        </TouchableOpacity>

                        {/* Help Text */}
                        <View style={styles.helpContainer}>
                            <Ionicons name="information-circle-outline" size={20} color="#666" />
                            <Text style={styles.helpText}>
                                Bạn sẽ nhận được email với liên kết để đặt lại mật khẩu. Nếu không thấy email, hãy kiểm
                                tra thư mục spam.
                            </Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Nhớ mật khẩu rồi? </Text>
                        <TouchableOpacity onPress={handleBackToLogin}>
                            <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                        </TouchableOpacity>
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
        paddingVertical: 40,
        justifyContent: "space-between",
    },
    successContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: "center",
        alignSelf: "flex-start",
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
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AppColors.surface,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
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
        width: 60,
        height: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    formContainer: {
        width: "100%",
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 30,
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
    sendButton: {
        backgroundColor: AppColors.primary,
        borderRadius: 12,
        height: 56,
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
    sendButtonDisabled: {
        opacity: 0.7,
    },
    sendButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: AppColors.surface,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    helpContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F8F9FA",
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: AppColors.primary,
    },
    helpText: {
        flex: 1,
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
        marginLeft: 12,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    footerText: {
        fontSize: 16,
        color: "#666",
    },
    footerLink: {
        fontSize: 16,
        color: AppColors.primary,
        fontWeight: "600",
    },
    // Success Screen Styles
    successIconContainer: {
        alignItems: "center",
        marginBottom: 32,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: AppColors.surface,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: AppColors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    successContent: {
        alignItems: "center",
        marginBottom: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: AppColors.primary,
        marginBottom: 16,
        textAlign: "center",
    },
    successSubtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 8,
    },
    emailText: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.text,
        textAlign: "center",
        marginBottom: 16,
    },
    instructionText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    actionButtons: {
        width: "100%",
    },
    resendButton: {
        backgroundColor: AppColors.surface,
        borderWidth: 2,
        borderColor: AppColors.primary,
        borderRadius: 12,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    resendButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.primary,
    },
    backToLoginButton: {
        backgroundColor: AppColors.primary,
        borderRadius: 12,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
    },
    backToLoginButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: AppColors.surface,
    },
});

export default ForgotPasswordScreen;
