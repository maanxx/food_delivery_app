import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ChatApi from "../../src/services/chatApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CreateGroupScreen = () => {
    const router = useRouter();
    const [groupName, setGroupName] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await AsyncStorage.getItem("user_data");
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setCurrentUserId(parsed.user_id || parsed.id);
                }

                const availableUsers = await ChatApi.getAvailableUsers();
                setUsers(availableUsers || []);
            } catch (error) {
                console.error("Failed to load users:", error);
                Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const toggleUserSelection = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập tên nhóm");
            return;
        }
        if (selectedUsers.length < 2) {
            Alert.alert("Thông báo", "Group chat requires at least 3 members (including you).");
            return;
        }

        setCreating(true);
        try {
            const group = await ChatApi.createGroup(groupName, selectedUsers);
            Alert.alert("Thành công", "Đã tạo nhóm chat");
            router.replace("/(tabs)/chat");
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể tạo nhóm");
        } finally {
            setCreating(false);
        }
    };

    const renderUserItem = ({ item }: { item: any }) => {
        if (item.user_id === currentUserId) return null;
        const isSelected = selectedUsers.includes(item.user_id);

        return (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => toggleUserSelection(item.user_id)}
            >
                <Image
                    source={item.avatar_path ? { uri: item.avatar_path } : require("../../src/assets/images/user-avatar.jpg")}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.fullname || item.username}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo nhóm mới</Text>
                <TouchableOpacity
                    onPress={handleCreateGroup}
                    disabled={creating || !groupName.trim() || selectedUsers.length < 2}
                >
                    {creating ? (
                        <ActivityIndicator size="small" color="#ff914c" />
                    ) : (
                        <Text style={[styles.createBtn, (!groupName.trim() || selectedUsers.length === 0) && styles.disabledBtn]}>Xong</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={30} color="#888" />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Tên nhóm"
                    value={groupName}
                    onChangeText={setGroupName}
                />
            </View>

            <View style={styles.memberSection}>
                <Text style={styles.sectionTitle}>Chọn thành viên ({selectedUsers.length})</Text>
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 50 }} color="#ff914c" />
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.user_id}
                        renderItem={renderUserItem}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
    createBtn: { color: "#ff914c", fontSize: 16, fontWeight: "bold" },
    disabledBtn: { color: "#ccc" },
    inputSection: { flexDirection: "row", padding: 20, alignItems: "center" },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#ff914c",
        paddingVertical: 8,
    },
    memberSection: { flex: 1 },
    sectionTitle: { fontSize: 14, color: "#888", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#f9f9f9" },
    listContent: { paddingHorizontal: 15 },
    userItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f0f0f0",
    },
    avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 15 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: "500", color: "#333" },
    userEmail: { fontSize: 12, color: "#888" },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxSelected: { backgroundColor: "#ff914c", borderColor: "#ff914c" },
});

export default CreateGroupScreen;
