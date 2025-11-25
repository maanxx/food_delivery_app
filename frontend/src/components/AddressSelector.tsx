import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../assets/styles/AppColor";
import { useAddress, Address } from "../contexts/AddressContext";

interface AddressSelectorProps {
    onAddressSelect?: (address: Address) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ onAddressSelect }) => {
    const { addresses, selectedAddress, selectAddress, isLoading, deleteAddress } = useAddress();
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    const handleAddressSelect = (address: Address) => {
        selectAddress(address);
        onAddressSelect?.(address);
        setShowModal(false);
    };

    const renderAddressItem = ({ item }: { item: Address }) => (
        <View style={[styles.addressItem, selectedAddress?.id === item.id && styles.selectedAddressItem]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => handleAddressSelect(item)}>
                <View style={styles.addressInfo}>
                    <Text style={styles.addressTitle}>{item.title}</Text>
                    <Text style={styles.addressText} numberOfLines={2}>
                        {item.address}
                    </Text>
                    {item.is_default ? <Text style={styles.defaultBadge}>Mặc định</Text> : null}
                </View>
                {selectedAddress?.id === item.id ? <Feather name="check" size={20} color={AppColors.primary} /> : null}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                    Alert.alert("Xoá địa chỉ", "Bạn có chắc muốn xoá địa chỉ này?", [
                        { text: "Huỷ", style: "cancel" },
                        {
                            text: "Xoá",
                            style: "destructive",
                            onPress: () => deleteAddress(item.id),
                        },
                    ]);
                }}
            >
                <Feather name="trash-2" size={20} color="#e74c3c" />
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <TouchableOpacity style={styles.selector} onPress={() => setShowModal(true)} disabled={isLoading}>
                <View style={styles.locationIcon}>
                    <Feather name="map-pin" size={16} color={AppColors.primary} />
                </View>
                <View style={styles.addressContainer}>
                    <Text style={styles.deliverTo}>Giao đến</Text>
                    <Text style={styles.selectedAddressText} numberOfLines={1}>
                        {isLoading ? (
                            <Text>Đang tải...</Text>
                        ) : selectedAddress ? (
                            <Text>{`${selectedAddress.title} - ${selectedAddress.address}`}</Text>
                        ) : (
                            <Text>Chọn địa chỉ giao hàng</Text>
                        )}
                    </Text>
                </View>
                <Feather name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            <Modal
                visible={showModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn địa chỉ giao hàng</Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Feather name="x" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={addresses}
                        renderItem={renderAddressItem}
                        keyExtractor={(item) => item.id}
                        style={styles.addressList}
                        showsVerticalScrollIndicator={false}
                    />

                    <TouchableOpacity
                        style={styles.addAddressButton}
                        onPress={() => {
                            setShowModal(false);
                            router.push("/add-address");
                        }}
                    >
                        <Feather name="plus" size={20} color={AppColors.primary} />
                        <Text style={styles.addAddressText}>Thêm địa chỉ mới</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    deleteButton: {
        padding: 8,
        marginLeft: 8,
        alignSelf: "flex-start",
    },
    selector: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    locationIcon: {
        marginRight: 10,
    },
    addressContainer: {
        flex: 1,
    },
    deliverTo: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },
    selectedAddressText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },
    modal: {
        flex: 1,
        backgroundColor: "#fff",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    addressList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    addressItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    selectedAddressItem: {
        backgroundColor: "#f8f9ff",
    },
    addressInfo: {
        flex: 1,
    },
    addressTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    defaultBadge: {
        fontSize: 12,
        color: AppColors.primary,
        fontWeight: "500",
        marginTop: 4,
    },
    addAddressButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: AppColors.primary,
        borderRadius: 8,
    },
    addAddressText: {
        fontSize: 16,
        color: AppColors.primary,
        fontWeight: "500",
        marginLeft: 8,
    },
});

export default AddressSelector;
