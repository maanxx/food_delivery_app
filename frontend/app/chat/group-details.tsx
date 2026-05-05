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
    Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import ChatApi from "../../src/services/chatApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GroupDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    // Add Member Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    // Leave Modal State
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

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

    const loadAvailableUsers = async () => {
        setLoadingUsers(true);
        try {
            const users = await ChatApi.getAvailableUsers();
            // Filter out existing members
            const memberIds = group.participants.map((p: any) => p.userId);
            setAvailableUsers(users.filter((u: any) => !memberIds.includes(u.user_id)));
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (showAddModal) loadAvailableUsers();
    }, [showAddModal]);

    const isOwner = group?.participants?.find((p: any) => p.userId === (currentUser?.user_id || currentUser?.id))?.role === "owner";
    const isAdmin = isOwner || group?.participants?.find((p: any) => p.userId === (currentUser?.user_id || currentUser?.id))?.role === "admin";
    const isRestrictedGroup = group?.type === "school" || group?.isSystemGroup === true;

    const handleLeaveGroup = (type: "silent" | "notify") => {
        if (isRestrictedGroup) {
            Alert.alert("Thông báo", "Đây là nhóm trường học. Bạn không thể tự ý rời khỏi nhóm này.");
            return;
        }
        Alert.alert(
            "Rời nhóm",
            type === "silent" ? "Rời nhóm trong im lặng?" : "Rời nhóm và thông báo cho mọi người?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Đồng ý",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ChatApi.leaveGroup(id as string, type);
                            router.replace("/(tabs)/chat");
                        } catch (error: any) {
                            Alert.alert("Lỗi", error.message);
                        }
                    },
                },
            ]
        );
        setShowLeaveModal(false);
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;
        try {
            await ChatApi.addMember(id as string, selectedUsers);
            setShowAddModal(false);
            setSelectedUsers([]);
            // Refresh
            const details = await ChatApi.getConversationDetails(id as string);
            setGroup(details);
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        }
    };

    const handlePickAvatar = async () => {
        if (!isAdmin) return;
        
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            uploadAvatar(result.assets[0]);
        }
    };

    const uploadAvatar = async (asset: any) => {
        setIsUpdatingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("file", {
                uri: asset.uri,
                name: asset.fileName || "avatar.jpg",
                type: asset.mimeType || "image/jpeg",
            } as any);

            const uploadData = await ChatApi.uploadFile(formData);
            await ChatApi.updateGroupAvatar(id as string, uploadData.url);
            
            // Refresh
            const details = await ChatApi.getConversationDetails(id as string);
            setGroup(details);
            Alert.alert("Thành công", "Đã cập nhật ảnh đại diện nhóm");
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        } finally {
            setIsUpdatingAvatar(false);
        }
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

    const renderAvailableUser = ({ item }: { item: any }) => {
        const isSelected = selectedUsers.includes(item.user_id);
        return (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => {
                    if (isSelected) setSelectedUsers(prev => prev.filter(id => id !== item.user_id));
                    else setSelectedUsers(prev => [...prev, item.user_id]);
                }}
            >
                <Image
                    source={item.avatar_path ? { uri: item.avatar_path } : require("../../src/assets/images/user-avatar.jpg")}
                    style={styles.memberAvatar}
                />
                <Text style={styles.memberName}>{item.fullname || item.username}</Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
            </TouchableOpacity>
        );
    };

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
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={group?.avatarPath ? { uri: group.avatarPath } : { uri: "https://ui-avatars.com/api/?name=" + encodeURIComponent(group?.name || "Group") + "&background=ff914c&color=fff&size=128" }}
                            style={styles.largeAvatar}
                        />
                        {isAdmin && (
                            <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickAvatar} disabled={isUpdatingAvatar}>
                                {isUpdatingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={20} color="#fff" />}
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.groupNameText}>{group?.name}</Text>
                    <Text style={styles.memberCountText}>{group?.participants?.length} thành viên</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thành viên</Text>
                        {isAdmin && (
                            <TouchableOpacity onPress={() => setShowAddModal(true)}>
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
                    {!isRestrictedGroup && (
                        <TouchableOpacity style={styles.actionItem} onPress={() => setShowLeaveModal(true)}>
                            <Ionicons name="log-out-outline" size={24} color="#ff4d4d" />
                            <Text style={[styles.actionText, { color: "#ff4d4d" }]}>Rời nhóm</Text>
                        </TouchableOpacity>
                    )}

                    {isOwner && (
                        <TouchableOpacity style={styles.actionItem} onPress={handleDissolveGroup}>
                            <Ionicons name="trash-outline" size={24} color="#ff4d4d" />
                            <Text style={[styles.actionText, { color: "#ff4d4d" }]}>Giải tán nhóm</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Leave Options Modal */}
            <Modal visible={showLeaveModal} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLeaveModal(false)}>
                    <View style={styles.optionsCard}>
                        <Text style={styles.modalTitle}>Rời nhóm</Text>
                        <TouchableOpacity style={styles.optionBtn} onPress={() => handleLeaveGroup("silent")}>
                            <Ionicons name="notifications-off-outline" size={22} color="#333" />
                            <Text style={styles.optionText}>Rời nhóm trong im lặng</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.optionBtn, { borderTopWidth: 0.5, borderTopColor: "#eee" }]} onPress={() => handleLeaveGroup("notify")}>
                            <Ionicons name="notifications-outline" size={22} color="#ff914c" />
                            <Text style={[styles.optionText, { color: "#ff914c" }]}>Rời nhóm và thông báo</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Add Member Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.addMemberContainer}>
                    <View style={styles.addMemberHeader}>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Text style={styles.cancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <Text style={styles.addMemberTitle}>Thêm thành viên</Text>
                        <TouchableOpacity onPress={handleAddMembers} disabled={selectedUsers.length === 0}>
                            <Text style={[styles.addBtnText, selectedUsers.length === 0 && { color: "#ccc" }]}>Thêm</Text>
                        </TouchableOpacity>
                    </View>
                    {loadingUsers ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color="#ff914c" />
                    ) : (
                        <FlatList
                            data={availableUsers}
                            keyExtractor={item => item.user_id}
                            renderItem={renderAvailableUser}
                            ListEmptyComponent={<Text style={styles.emptyText}>Mọi người đều đã tham gia nhóm!</Text>}
                        />
                    )}
                </View>
            </Modal>
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
        paddingTop: 50
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
    avatarWrapper: { position: "relative" },
    largeAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
    editAvatarBtn: {
        position: "absolute",
        bottom: 15,
        right: 0,
        backgroundColor: "#ff914c",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff"
    },
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
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    optionsCard: { backgroundColor: "#fff", width: "80%", borderRadius: 15, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
    optionBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 15 },
    optionText: { fontSize: 16, marginLeft: 15, color: "#333" },
    addMemberContainer: { flex: 1, backgroundColor: "#fff", marginTop: 100, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    addMemberHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#eee" },
    addMemberTitle: { fontSize: 18, fontWeight: "bold" },
    cancelText: { color: "#888", fontSize: 16 },
    addBtnText: { color: "#ff914c", fontSize: 16, fontWeight: "bold" },
    userItem: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
    checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#ddd", justifyContent: "center", alignItems: "center", marginLeft: "auto" },
    checkboxSelected: { backgroundColor: "#ff914c", borderColor: "#ff914c" },
    emptyText: { textAlign: "center", color: "#888", marginTop: 50, fontSize: 14 },
});

export default GroupDetailsScreen;
