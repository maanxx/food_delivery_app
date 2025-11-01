import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    TextInput,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons";

import { useAuth } from "../contexts/AuthContext";
import { Colors } from "../constants/Colors";
import { Fonts } from "../constants/Fonts";
import { UpdateProfileData, ChangePasswordData } from "../types/auth";

const ProfileScreen = () => {
    const { user, logout, updateProfile, changePassword } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || "",
        phone: user?.phone || "",
        email: user?.email || "",
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleUpdateProfile = async () => {
        if (!profileForm.fullName.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập họ tên");
            return;
        }

        if (!profileForm.phone.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
            return;
        }

        setLoading(true);
        try {
            const updateData: UpdateProfileData = {
                fullName: profileForm.fullName.trim(),
                phone: profileForm.phone.trim(),
            };

            const result = await updateProfile(updateData);
            if (result.success) {
                Alert.alert("Thành công", "Cập nhật thông tin thành công!");
                setIsEditing(false);
            } else {
                Alert.alert("Lỗi", result.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Update profile error:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật thông tin");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword) {
            Alert.alert("Lỗi", "Vui lòng nhập mật khẩu hiện tại");
            return;
        }

        if (!passwordForm.newPassword) {
            Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
            return;
        }

        setLoading(true);
        try {
            const changeData: ChangePasswordData = {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            };

            const result = await changePassword(changeData);
            if (result.success) {
                Alert.alert("Thành công", "Đổi mật khẩu thành công!");
                setIsChangingPassword(false);
                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            } else {
                Alert.alert("Lỗi", result.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Change password error:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi đổi mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
            {
                text: "Hủy",
                style: "cancel",
            },
            {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                    await logout();
                },
            },
        ]);
    };

    const cancelEdit = () => {
        setProfileForm({
            fullName: user?.fullName || "",
            phone: user?.phone || "",
            email: user?.email || "",
        });
        setIsEditing(false);
    };

    const cancelPasswordChange = () => {
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setIsChangingPassword(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color={Colors.white} />
                    </View>
                    <Text style={styles.userName}>{user?.fullName}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Profile Information */}
                <View style={styles.profileSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                        {!isEditing && (
                            <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
                                <AntDesign name="edit" size={18} color={Colors.primary} />
                                <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Name Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>HỌ VÀ TÊN</Text>
                        <View style={styles.inputContainer}>
                            {isEditing ? (
                                <TextInput
                                    style={styles.fieldValue}
                                    value={profileForm.fullName}
                                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, fullName: text }))}
                                    placeholder="Nhập họ tên"
                                />
                            ) : (
                                <Text style={styles.fieldValue}>{user?.fullName}</Text>
                            )}
                        </View>
                    </View>

                    {/* Phone Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>SỐ ĐIỆN THOẠI</Text>
                        <View style={styles.inputContainer}>
                            {isEditing ? (
                                <TextInput
                                    style={styles.fieldValue}
                                    value={profileForm.phone}
                                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, phone: text }))}
                                    placeholder="Nhập số điện thoại"
                                    keyboardType="phone-pad"
                                />
                            ) : (
                                <Text style={styles.fieldValue}>{user?.phone}</Text>
                            )}
                        </View>
                    </View>

                    {/* Email Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>EMAIL</Text>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.fieldValue, styles.disabledText]}>{user?.email}</Text>
                        </View>
                    </View>

                    {isEditing && (
                        <View style={styles.buttonRow}>
                            <Pressable
                                onPress={cancelEdit}
                                style={[styles.button, styles.cancelButton]}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleUpdateProfile}
                                style={[styles.button, styles.saveButton]}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.saveButtonText}>Lưu</Text>
                                )}
                            </Pressable>
                        </View>
                    )}

                    {/* Change Password Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
                        {!isChangingPassword && (
                            <Pressable onPress={() => setIsChangingPassword(true)} style={styles.editButton}>
                                <MaterialIcons name="lock-outline" size={18} color={Colors.primary} />
                                <Text style={styles.editButtonText}>Đổi mật khẩu</Text>
                            </Pressable>
                        )}
                    </View>

                    {isChangingPassword && (
                        <>
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>MẬT KHẨU HIỆN TẠI</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.fieldValue}
                                        value={passwordForm.currentPassword}
                                        onChangeText={(text) =>
                                            setPasswordForm((prev) => ({ ...prev, currentPassword: text }))
                                        }
                                        placeholder="Nhập mật khẩu hiện tại"
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>MẬT KHẨU MỚI</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.fieldValue}
                                        value={passwordForm.newPassword}
                                        onChangeText={(text) =>
                                            setPasswordForm((prev) => ({ ...prev, newPassword: text }))
                                        }
                                        placeholder="Nhập mật khẩu mới"
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>XÁC NHẬN MẬT KHẨU MỚI</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.fieldValue}
                                        value={passwordForm.confirmPassword}
                                        onChangeText={(text) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                confirmPassword: text,
                                            }))
                                        }
                                        placeholder="Nhập lại mật khẩu mới"
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.buttonRow}>
                                <Pressable
                                    onPress={cancelPasswordChange}
                                    style={[styles.button, styles.cancelButton]}
                                    disabled={loading}
                                >
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleChangePassword}
                                    style={[styles.button, styles.saveButton]}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={Colors.white} />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Đổi mật khẩu</Text>
                                    )}
                                </Pressable>
                            </View>
                        </>
                    )}

                    {/* Logout Button */}
                    <Pressable style={styles.logoutButton} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={24} color="red" />
                        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        borderWidth: 3,
        borderColor: Colors.white,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    userName: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        color: Colors.white,
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.white,
        opacity: 0.8,
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        flex: 1,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.medium,
        color: Colors.black,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    editButtonText: {
        marginLeft: 5,
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 12,
        color: Colors.gray,
        fontFamily: Fonts.medium,
        marginBottom: 8,
    },
    inputContainer: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
        paddingVertical: 10,
    },
    fieldValue: {
        fontSize: 16,
        color: Colors.black,
        fontFamily: Fonts.regular,
        flex: 1,
    },
    disabledText: {
        color: Colors.gray,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        marginBottom: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray,
        marginRight: 10,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.gray,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        marginLeft: 10,
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.white,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30,
        paddingVertical: 15,
        backgroundColor: Colors.lightGray,
        borderRadius: 10,
    },
    logoutButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: "red",
    },
});

export default ProfileScreen;
