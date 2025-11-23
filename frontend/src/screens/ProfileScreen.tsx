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
    Image,
    Platform,
} from "react-native";
import { MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../contexts/AuthContext";
import { AppColors } from "../assets/styles/AppColor";
import { UpdateProfileData, ChangePasswordData } from "../types/auth";

const ProfileScreen = () => {
    const { user, logout, updateProfile, changePassword } = useAuth();
    const [avatarUri, setAvatarUri] = useState<string | null>(
        (user as any)?.avatar_path || (user as any)?.avatar_url || null,
    );
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Profile form state (support multiple addresses)
    const initialAddresses: string[] = Array.isArray((user as any)?.addresses)
        ? (user as any).addresses
        : (user as any)?.address
        ? [(user as any).address]
        : [];

    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || "",
        phone: user?.phone || "",
        email: user?.email || "",
        addresses: initialAddresses,
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // helpers for addresses
    const addAddressField = () => {
        setProfileForm((prev) => ({ ...prev, addresses: [...(prev.addresses || []), ""] }));
    };
    const removeAddress = (index: number) => {
        setProfileForm((prev) => {
            const arr = [...(prev.addresses || [])];
            arr.splice(index, 1);
            return { ...prev, addresses: arr };
        });
    };
    const updateAddress = (index: number, text: string) => {
        setProfileForm((prev) => {
            const arr = [...(prev.addresses || [])];
            arr[index] = text;
            return { ...prev, addresses: arr };
        });
    };

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
            // include addresses (array) and address (first) in update payload
            const addresses = Array.isArray(profileForm.addresses)
                ? profileForm.addresses.map((a: string) => (a || "").trim()).filter(Boolean)
                : [];
            const updateData: any = {
                fullName: profileForm.fullName.trim(),
                phone: profileForm.phone.trim(),
                addresses: addresses,
                // keep legacy single-field for backward compatibility
                address: addresses.length > 0 ? addresses[0] : "",
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
        const resetAddresses: string[] = Array.isArray((user as any)?.addresses)
            ? (user as any).addresses
            : (user as any)?.address
            ? [(user as any).address]
            : [];
        setProfileForm({
            fullName: user?.fullName || "",
            phone: user?.phone || "",
            email: user?.email || "",
            addresses: resetAddresses,
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
            // request permission on platforms that need it
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

            if (result.cancelled) return;

            const uri = (result as any).uri;
            setAvatarUri(uri); // show preview immediately

            // upload / save avatar (backend may accept avatar_path as URL or handle upload separately)
            setAvatarLoading(true);
            try {
                const updateData: any = { avatar_path: uri };
                const res = await updateProfile(updateData);
                if (!res?.success) {
                    Alert.alert("Lỗi", res?.message || "Không lưu được avatar trên server");
                }
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

                    <Text style={styles.userName}>{user?.fullName}</Text>
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
                                    value={profileForm.fullName}
                                    onChangeText={(text) => setProfileForm((prev) => ({ ...prev, fullName: text }))}
                                    placeholder="Nhập họ tên"
                                />
                            ) : (
                                <Text style={styles.fieldValue}>{user?.fullName}</Text>
                            )}
                        </View>
                    </View>

                    {/* Addresses Field: support multiple */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>ĐỊA CHỈ</Text>
                        <View style={{ marginTop: 8 }}>
                            {isEditing ? (
                                <>
                                    {(profileForm.addresses || []).map((addr: string, idx: number) => (
                                        <View
                                            key={idx}
                                            style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                                        >
                                            <TextInput
                                                style={[
                                                    styles.fieldValue,
                                                    {
                                                        flex: 1,
                                                        minHeight: 40,
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: "#E0E0E0",
                                                        paddingVertical: 6,
                                                    },
                                                ]}
                                                value={addr}
                                                onChangeText={(text) => updateAddress(idx, text)}
                                                placeholder={`Địa chỉ ${idx + 1}`}
                                                multiline
                                            />
                                            <TouchableOpacity
                                                onPress={() => removeAddress(idx)}
                                                style={{ marginLeft: 8 }}
                                            >
                                                <Text style={{ color: "red" }}>Xóa</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity onPress={addAddressField} style={{ marginTop: 6 }}>
                                        <Text style={{ color: AppColors.primary, fontWeight: "600" }}>
                                            + Thêm địa chỉ
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={styles.inputContainer}>
                                    {Array.isArray((user as any)?.addresses) && (user as any).addresses.length > 0 ? (
                                        (user as any).addresses.map((a: string, i: number) => (
                                            <Text key={i} style={styles.fieldValue}>
                                                {a}
                                            </Text>
                                        ))
                                    ) : (user as any)?.address ? (
                                        <Text style={styles.fieldValue}>{(user as any).address}</Text>
                                    ) : (
                                        <Text style={styles.fieldValue}>Chưa có địa chỉ</Text>
                                    )}
                                </View>
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
            </ScrollView>
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
    disabledText: {
        color: "#666",
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
});

export default ProfileScreen;
