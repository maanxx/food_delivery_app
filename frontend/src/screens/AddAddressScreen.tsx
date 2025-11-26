import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../assets/styles/AppColor";
import { useAddress } from "../contexts/AddressContext";

const AddAddressScreen = () => {
    const router = useRouter();
    const { addAddress } = useAddress();

    const [formData, setFormData] = useState({
        title: "",
        address: "",
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        is_default: false,
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        // Validate form
        if (!formData.title.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tên địa chỉ");
            return;
        }

        if (!formData.address.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập địa chỉ chi tiết");
            return;
        }

        setIsLoading(true);

        try {
            await addAddress({
                title: formData.title.trim(),
                address: formData.address.trim(),
                latitude: formData.latitude,
                longitude: formData.longitude,
                is_default: formData.is_default,
            });

            Alert.alert("Thành công", "Đã thêm địa chỉ mới", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error("Add address error:", error);
            Alert.alert("Lỗi", "Không thể thêm địa chỉ. Vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        // TODO: Implement get current location functionality
        Alert.alert("Thông báo", "Chức năng lấy vị trí hiện tại sẽ được cập nhật trong phiên bản tiếp theo");
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Thêm địa chỉ mới</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Address Title */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên địa chỉ *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: Nhà riêng, Văn phòng..."
                            value={formData.title}
                            onChangeText={(text) => handleInputChange("title", text)}
                            maxLength={50}
                        />
                    </View>

                    {/* Address Details */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ chi tiết *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                            value={formData.address}
                            onChangeText={(text) => handleInputChange("address", text)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Get Current Location Button */}
                    <TouchableOpacity style={styles.locationButton} onPress={handleGetCurrentLocation}>
                        <Feather name="map-pin" size={20} color={AppColors.primary} />
                        <Text style={styles.locationButtonText}>Sử dụng vị trí hiện tại</Text>
                    </TouchableOpacity>

                    {/* Set as Default */}
                    <View style={styles.switchGroup}>
                        <View style={styles.switchInfo}>
                            <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
                            <Text style={styles.switchDescription}>Địa chỉ này sẽ được chọn tự động khi đặt hàng</Text>
                        </View>
                        <Switch
                            value={formData.is_default}
                            onValueChange={(value) => handleInputChange("is_default", value)}
                            trackColor={{ false: "#e0e0e0", true: AppColors.primary + "30" }}
                            thumbColor={formData.is_default ? AppColors.primary : "#fff"}
                        />
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        <Text style={styles.saveButtonText}>{isLoading ? "Đang lưu..." : "Lưu địa chỉ"}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    headerRight: {
        width: 34, // To center the title
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginTop: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: "#333",
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
    locationButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        marginTop: 15,
        borderWidth: 1,
        borderColor: AppColors.primary,
        borderRadius: 8,
        backgroundColor: AppColors.primary + "10",
    },
    locationButtonText: {
        fontSize: 16,
        color: AppColors.primary,
        fontWeight: "500",
        marginLeft: 8,
    },
    switchGroup: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 20,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    switchInfo: {
        flex: 1,
        marginRight: 15,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
        marginBottom: 4,
    },
    switchDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 18,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    saveButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    saveButtonDisabled: {
        backgroundColor: "#ccc",
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});

export default AddAddressScreen;
