import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Image,
    TextInput,
    Pressable,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Fontisto, MaterialIcons, AntDesign, Entypo } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { AppColors } from "../assets/styles/AppColor";

type RootStackParamList = {
    Profile: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">;

const ProfileScreen = () => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState<Date>(new Date(2000, 0, 1));
    const [isEditing, setIsEditing] = useState(false);
    const navigation = useNavigation<ProfileScreenNavigationProp>();

    const handleLogout = () => {
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Log Out",
                style: "destructive",
                onPress: () => console.log("User logged out"),
            },
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert("Delete Account", "Are you sure you want to delete your account?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => console.log("User account deleted"),
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}

                {/* Header */}
                <View style={styles.header}>
                    <Image
                        style={styles.avatar}
                        source={require("../assets/images/user-avatar.jpg")}
                        style={styles.avatar}
                    />
                    <Pressable
                        onPress={() => setIsEditing(!isEditing)}
                        style={{
                            position: "absolute",
                            top: 30,
                            right: 20,
                            padding: 6,
                            borderRadius: 20,
                            backgroundColor: "white",
                        }}
                    >
                        {isEditing ? (
                            <Entypo name="check" size={17} color="black" />
                        ) : (
                            <AntDesign name="edit" size={17} color="black" />
                        )}
                    </Pressable>
                </View>

                {/* Profile Information */}
                <View style={styles.profileSection}>
                    {/* Name Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.fieldLabel}>HỌ VÀ TÊN</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            {isEditing ? (
                                <TextInput style={styles.fieldValue} value="Đặng Phúc Nguyên" />
                            ) : (
                                <Text style={styles.fieldValue}>Đặng Phúc Nguyên</Text>
                            )}
                        </View>
                    </View>

                    {/* Email Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.fieldLabel}>EMAIL</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            {isEditing ? (
                                <TextInput style={styles.fieldValue} value="dnguyen@gmail.com" />
                            ) : (
                                <Text style={styles.fieldValue}>dnguyen@gmail.com</Text>
                            )}
                        </View>
                    </View>

                    {/* Delivery Address Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.fieldLabel}>ĐỊA CHỈ NHẬN HÀNG</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            {isEditing ? (
                                <TextInput
                                    style={styles.fieldValue}
                                    value="Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, Thành phố Hồ Chí Minh"
                                />
                            ) : (
                                <Text style={styles.fieldValue}>
                                    Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, Thành phố Hồ Chí Minh
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Birthday Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.fieldLabel}>NGÀY SINH</Text>
                        </View>
                        <Pressable onPress={() => setShowDatePicker(true)} style={styles.inputContainer}>
                            <Text style={styles.fieldValue}>{date.toLocaleDateString("vi-VN")}</Text>
                            <Fontisto name="date" size={18} color="black" />
                        </Pressable>
                    </View>

                    {/* Password Field */}
                    {isEditing ? (
                        <Pressable style={styles.button} onPress={() => navigation.navigate("ChangePassword")}>
                            <Text
                                style={{
                                    color: AppColors.secondary,
                                    marginBottom: 20,
                                    fontSize: 13,
                                    fontWeight: "bold",
                                }}
                            >
                                Đổi mật khẩu
                            </Text>
                        </Pressable>
                    ) : (
                        <View style={styles.fieldContainer}>
                            <View style={styles.fieldHeader}>
                                <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
                            </View>
                            <View style={styles.inputContainer}>
                                {/* <TextInput style={styles.fieldValue} value="● ● ● ● ● ● ● ● ● ●" secureTextEntry /> */}
                                <Text style={styles.fieldValue}>● ● ● ● ● ● ● ● ● ●</Text>
                            </View>
                        </View>
                    )}
                    {isEditing ? (
                        <Pressable style={styles.button} onPress={handleDeleteAccount}>
                            <Text style={{ color: "red", fontSize: 13, fontWeight: "bold" }}>Xóa tài khoản</Text>
                        </Pressable>
                    ) : (
                        <Pressable style={styles.button} onPress={handleLogout}>
                            <Text style={{ color: "red", marginRight: 8, fontSize: 13, fontWeight: "bold" }}>
                                Đăng xuất
                            </Text>
                            <MaterialIcons name="logout" size={24} color="red" />
                        </Pressable>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        borderWidth: 2,
        borderColor: "white",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#333",
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: AppColors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
    },
    fieldContainer: {
        marginBottom: 24,
    },
    fieldHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 10,
        color: "#666",
        fontWeight: "500",
    },
    inputContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        paddingVertical: 8,
    },
    fieldValue: {
        fontSize: 12,
        color: "#333",
        fontWeight: "500",
        flex: 1,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
    },
});

export default ProfileScreen;
