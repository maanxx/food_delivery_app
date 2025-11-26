import React, { useState, useEffect } from "react";
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
    Image,
    Platform,
    Modal,
} from "react-native";
import { MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { useAuth } from "../contexts/AuthContext";
import { AppColors } from "../assets/styles/AppColor";
import { UpdateProfileData, ChangePasswordData } from "../types/auth";

const ProfileScreen = () => {
    const router = useRouter();
    const { user, logout, updateProfile, changePassword, checkAuthStatus } = useAuth();
    const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_path || user?.avatar || null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [showDateInput, setShowDateInput] = useState(false);

    // Profile form state with all database fields
    const [profileForm, setProfileForm] = useState({
        fullname: user?.fullname || "",
        address: user?.address || "",
        gender: user?.gender || ("Other" as "Male" | "Female" | "Other"),
        date_of_birth: user?.date_of_birth || "",
        phone_number: user?.phone_number || "",
        email: user?.email || "",
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Refresh user data on component mount
    useEffect(() => {
        const refreshUserData = async () => {
            setRefreshing(true);
            try {
                await checkAuthStatus();
            } catch (error) {
                console.error("Error refreshing user data:", error);
            } finally {
                setRefreshing(false);
            }
        };

        refreshUserData();
    }, []);

    // Update form when user data changes
    useEffect(() => {
        if (user) {
            setProfileForm({
                fullname: user.fullname || "",
                address: user.address || "",
                gender: user.gender || "Other",
                date_of_birth: user.date_of_birth || "",
                phone_number: user.phone_number || "",
                email: user.email || "",
            });
            setAvatarUri(user.avatar_path || user.avatar || null);
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        // Validation
        if (!profileForm.fullname.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập họ tên");
            return;
        }

        if (!profileForm.phone_number.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
            return;
        }

        // Phone validation
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(profileForm.phone_number.replace(/\D/g, ""))) {
            Alert.alert("Lỗi", "Số điện thoại không hợp lệ");
            return;
        }

        setLoading(true);
        try {
            const updateData: UpdateProfileData = {
                fullname: profileForm.fullname.trim(),
                address: profileForm.address.trim(),
                gender: profileForm.gender as "Male" | "Female" | "Other",
                date_of_birth: profileForm.date_of_birth,
                phone_number: profileForm.phone_number.trim(),
            };

            const result = await updateProfile(updateData);
            console.log("result: ", result);

            if (result) {
                Alert.alert("Thành công", "Cập nhật thông tin thành công!");
                setIsEditing(false);
                // Refresh user data
                await checkAuthStatus();
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
                    router.replace("/login");
                },
            },
        ]);
    };

    const cancelEdit = () => {
        setProfileForm({
            fullname: user?.fullname || "",
            address: user?.address || "",
            gender: user?.gender || "Other",
            date_of_birth: user?.date_of_birth || "",
            phone_number: user?.phone_number || "",
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

    const handlePickImage = async () => {
        try {
            if (Platform.OS !== "web") {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Quyền truy cập", "Cần quyền truy cập ảnh để thay đổi avatar");
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (result.canceled) return;

            const uri = result.assets?.[0]?.uri;
            if (!uri) return;

            setAvatarUri(uri);
            setAvatarLoading(true);
            try {
                Alert.alert("Thông báo", "Tính năng upload avatar đang được phát triển");
            } catch (err) {
                console.error("Upload avatar error:", err);
                Alert.alert("Lỗi", "Có lỗi khi cập nhật avatar");
            } finally {
                setAvatarLoading(false);
            }
        } catch (err) {
            console.error("Image pick error:", err);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Chưa cập nhật";
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN");
    };

    const handleGenderSelect = (gender: "Male" | "Female" | "Other") => {
        setProfileForm((prev) => ({ ...prev, gender }));
        setShowGenderPicker(false);
    };

    const validateAndSetDate = (dateStr: string) => {
        // Simple date validation (YYYY-MM-DD format)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateStr)) {
            const date = new Date(dateStr);
            if (date <= new Date()) {
                // Must be in the past
                setProfileForm((prev) => ({ ...prev, date_of_birth: dateStr }));
                setShowDateInput(false);
                return;
            }
        }
        Alert.alert("Lỗi", "Vui lòng nhập ngày theo định dạng YYYY-MM-DD");
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handlePickImage} style={[styles.avatar, { overflow: "hidden" }]}>
                        {avatarLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                        ) : (
                            <Ionicons name="person" size={40} color="#fff" />
                        )}
                    </Pressable>

                    <Text style={styles.userName}>{user?.fullname || "Người dùng"}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Profile Information */}
                <View style={styles.profileSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                        {!isEditing && (
                            <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
                                <AntDesign name="edit" size={18} color={AppColors.primary} />
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
                                    value={profileForm.fullname}
                                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, fullname: text }))}
                                    placeholder="Nhập họ tên"
                                />
                            ) : (
                                <Text style={styles.fieldValue}>{user?.fullname || "Chưa cập nhật"}</Text>
                            )}
                        </View>
                    </View>

                    {/* Gender Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>GIỚI TÍNH</Text>
                        <View style={styles.inputContainer}>
                            {isEditing ? (
                                <TouchableOpacity onPress={() => setShowGenderPicker(true)} style={styles.pickerButton}>
                                    <Text style={styles.fieldValue}>
                                        {profileForm.gender === "Male"
                                            ? "Nam"
                                            : profileForm.gender === "Female"
                                            ? "Nữ"
                                            : "Khác"}
                                    </Text>
                                    <MaterialIcons name="arrow-drop-down" size={24} color={AppColors.primary} />
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.fieldValue}>
                                    {user?.gender === "Male" ? "Nam" : user?.gender === "Female" ? "Nữ" : "Khác"}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Date of Birth Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>NGÀY SINH</Text>
                        <View style={styles.inputContainer}>
                            {isEditing ? (
                                <TouchableOpacity onPress={() => setShowDateInput(true)} style={styles.pickerButton}>
                                    <Text style={styles.fieldValue}>
                                        {profileForm.date_of_birth
                                            ? formatDate(profileForm.date_of_birth)
                                            : "Chọn ngày sinh"}
                                    </Text>
                                    <MaterialIcons name="date-range" size={20} color={AppColors.primary} />
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.fieldValue}>{formatDate(user?.date_of_birth)}</Text>
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
                                    value={profileForm.phone_number}
                                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, phone_number: text }))}
                                    placeholder="Nhập số điện thoại"
                                    keyboardType="phone-pad"
                                />
                            ) : (
                                <Text style={styles.fieldValue}>{user?.phone_number || "Chưa cập nhật"}</Text>
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
                                    <ActivityIndicator size="small" color="#fff" />
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
                                <MaterialIcons name="lock-outline" size={18} color={AppColors.primary} />
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
                                        <ActivityIndicator size="small" color="#fff" />
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

                {/* Loading overlay when refreshing */}
                {refreshing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={AppColors.primary} />
                        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Gender Picker Modal */}
            <Modal
                visible={showGenderPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowGenderPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn giới tính</Text>

                        <TouchableOpacity style={styles.modalOption} onPress={() => handleGenderSelect("Male")}>
                            <Text style={styles.modalOptionText}>Nam</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={() => handleGenderSelect("Female")}>
                            <Text style={styles.modalOptionText}>Nữ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={() => handleGenderSelect("Other")}>
                            <Text style={styles.modalOptionText}>Khác</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowGenderPicker(false)}>
                            <Text style={styles.modalCancelText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date Input Modal */}
            <Modal
                visible={showDateInput}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDateInput(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nhập ngày sinh</Text>
                        <Text style={styles.modalSubtitle}>Định dạng: YYYY-MM-DD (ví dụ: 1990-01-15)</Text>

                        <TextInput
                            style={styles.dateInput}
                            placeholder="1990-01-15"
                            value={profileForm.date_of_birth}
                            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, date_of_birth: text }))}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDateInput(false)}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSave}
                                onPress={() => validateAndSetDate(profileForm.date_of_birth)}
                            >
                                <Text style={styles.modalSaveText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: AppColors.primary,
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AppColors.primary,
        borderWidth: 3,
        borderColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    userName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        fontWeight: "normal",
        color: "#fff",
        opacity: 0.8,
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: "#fff",
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
        fontWeight: "500",
        color: "#333",
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    editButtonText: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: "500",
        color: AppColors.primary,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
        marginBottom: 8,
    },
    inputContainer: {
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
        paddingVertical: 10,
    },
    fieldValue: {
        fontSize: 16,
        color: "#333",
        fontWeight: "normal",
        flex: 1,
    },
    multilineInput: {
        minHeight: 60,
        textAlignVertical: "top",
    },
    disabledText: {
        color: "#666",
    },
    pickerButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 5,
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
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#666",
        marginRight: 10,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#666",
    },
    saveButton: {
        backgroundColor: AppColors.primary,
        marginLeft: 10,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#fff",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30,
        paddingVertical: 15,
        backgroundColor: "#F5F5F5",
        borderRadius: 10,
    },
    logoutButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: "500",
        color: "red",
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: AppColors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        width: "80%",
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#333",
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 15,
        color: "#666",
    },
    modalOption: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    modalOptionText: {
        fontSize: 16,
        textAlign: "center",
        color: "#333",
    },
    modalCancel: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        marginTop: 10,
        backgroundColor: "#f0f0f0",
        borderRadius: 8,
    },
    modalCancelText: {
        fontSize: 16,
        textAlign: "center",
        color: "#666",
    },
    modalSave: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        marginTop: 10,
        backgroundColor: AppColors.primary,
        borderRadius: 8,
    },
    modalSaveText: {
        fontSize: 16,
        textAlign: "center",
        color: "#fff",
    },
    modalButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
    },
});

export default ProfileScreen;
