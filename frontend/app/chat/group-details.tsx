import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ChatApi from "../../src/services/chatApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GroupDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const userData = await AsyncStorage.getItem("user_data");
                if (userData) {
                    setCurrentUser(JSON.parse(userData));
                }

                const details = await ChatApi.getConversationDetails(id as string);
                setGroup(details);
            } catch (error) {
                console.error("Failed to load group details:", error);
                Alert.alert("Lỗi", "Không thể tải thông tin nhóm");
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [id]);

    const isOwner = group?.participants?.find((p: any) => p.userId === (currentUser?.user_id || currentUser?.id))?.role === "owner";
    const isAdmin = isOwner || group?.participants?.find((p: any) => p.userId === (currentUser?.user_id || currentUser?.id))?.role === "admin";

    const handleLeaveGroup = () => {
        Alert.alert(
            "Rời nhóm",
            "Bạn có chắc chắn muốn rời khỏi nhóm này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Rời nhóm",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ChatApi.leaveGroup(id as string);
                            router.replace("/(tabs)/chat");
                        } catch (error: any) {
                            Alert.alert("Lỗi", error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleDissolveGroup = () => {
        Alert.alert(
            "Giải tán nhóm",
            "Hành động này sẽ xóa toàn bộ nhóm và tin nhắn. Bạn có chắc chắn?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Giải tán",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ChatApi.dissolveGroup(id as string);
                            router.replace("/(tabs)/chat");
                        } catch (error: any) {
                            Alert.alert("Lỗi", error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleRemoveMember = (userId: string, name: string) => {
        Alert.alert(
            "Xóa thành viên",
            `Bạn có chắc chắn muốn xóa ${name} khỏi nhóm?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ChatApi.removeMember(id as string, userId);
                            // Refresh
                            const details = await ChatApi.getConversationDetails(id as string);
                            setGroup(details);
                        } catch (error: any) {
                            Alert.alert("Lỗi", error.message);
                        }
                    },
                },
            ]
        );
    };

    const renderParticipant = ({ item }: { item: any }) => (
        <View style={styles.memberItem}>
            <Image
                source={item.avatarPath ? { uri: item.avatarPath } : require("../../src/assets/images/user-avatar.jpg")}
                style={styles.memberAvatar}
            />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.fullname}</Text>
                <Text style={styles.memberRole}>{item.role === "owner" ? "Trưởng nhóm" : item.role === "admin" ? "Phó nhóm" : "Thành viên"}</Text>
            </View>
            {isAdmin && item.userId !== (currentUser?.user_id || currentUser?.id) && item.role !== "owner" && (
                <TouchableOpacity onPress={() => handleRemoveMember(item.userId, item.fullname)}>
                    <Ionicons name="close-circle" size={24} color="#ff4d4d" />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff914c" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin nhóm</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.groupInfoCard}>
                    <Image
                        source={group?.avatarPath ? { uri: group.avatarPath } : { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(group?.name || "Group") + "&background=ff914c&color=fff&size=128" }}
                        style={styles.largeAvatar}
                    />
                    <Text style={styles.groupNameText}>{group?.name}</Text>
                    <Text style={styles.memberCountText}>{group?.participants?.length} thành viên</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thành viên</Text>
                        {isAdmin && (
                            <TouchableOpacity onPress={() => Alert.alert("Tính năng", "Coming soon: Add member UI")}>
                                <Text style={styles.addText}>Thêm</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <FlatList
                        data={group?.participants}
                        keyExtractor={(item) => item.userId}
                        renderItem={renderParticipant}
                        scrollEnabled={false}
                    />
                </View>

                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.actionItem} onPress={handleLeaveGroup}>
                        <Ionicons name="log-out-outline" size={24} color="#ff4d4d" />
                        <Text style={[styles.actionText, { color: "#ff4d4d" }]}>Rời nhóm</Text>
                    </TouchableOpacity>

                    {isOwner && (
                        <TouchableOpacity style={styles.actionItem} onPress={handleDissolveGroup}>
                            <Ionicons name="trash-outline" size={24} color="#ff4d4d" />
                            <Text style={[styles.actionText, { color: "#ff4d4d" }]}>Giải tán nhóm</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
    scrollContent: { paddingBottom: 30 },
    groupInfoCard: {
        backgroundColor: "#fff",
        alignItems: "center",
        padding: 30,
        marginBottom: 10,
    },
    largeAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
    groupNameText: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 5 },
    memberCountText: { fontSize: 14, color: "#888" },
    section: { backgroundColor: "#fff", padding: 15, marginBottom: 10 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
    addText: { color: "#ff914c", fontWeight: "600" },
    memberItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f0f0f0",
    },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: "500", color: "#333" },
    memberRole: { fontSize: 12, color: "#888" },
    actionSection: { backgroundColor: "#fff", paddingVertical: 10 },
    actionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f0f0f0",
    },
    actionText: { fontSize: 16, marginLeft: 15, fontWeight: "500" },
});

export default GroupDetailsScreen;
