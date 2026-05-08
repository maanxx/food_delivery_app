import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface AttachmentSheetProps {
    isVisible: boolean;
    onClose: () => void;
    onSelect: (type: "camera" | "gallery" | "document" | "location") => void;
}

const AttachmentSheet = ({ isVisible, onClose, onSelect }: AttachmentSheetProps) => {
    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection={["down"]}
            style={styles.modal}
            backdropOpacity={0.3}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            useNativeDriver
        >
            <View style={styles.container}>
                <View style={styles.handle} />
                <Text style={styles.title}>Gửi đính kèm</Text>
                
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.option} onPress={() => onSelect("camera")}>
                        <View style={[styles.iconContainer, { backgroundColor: "#FF4B3A" }]}>
                            <Ionicons name="camera" size={30} color="#fff" />
                        </View>
                        <Text style={styles.label}>Máy ảnh</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={() => onSelect("gallery")}>
                        <View style={[styles.iconContainer, { backgroundColor: "#4CAF50" }]}>
                            <Ionicons name="images" size={30} color="#fff" />
                        </View>
                        <Text style={styles.label}>Thư viện</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={() => onSelect("document")}>
                        <View style={[styles.iconContainer, { backgroundColor: "#2196F3" }]}>
                            <Ionicons name="document-text" size={30} color="#fff" />
                        </View>
                        <Text style={styles.label}>Tài liệu</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={() => onSelect("location")}>
                        <View style={[styles.iconContainer, { backgroundColor: "#FF9800" }]}>
                            <Ionicons name="location" size={30} color="#fff" />
                        </View>
                        <Text style={styles.label}>Vị trí</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: "flex-end",
        margin: 0,
    },
    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: "#e0e0e0",
        borderRadius: 3,
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 25,
        textAlign: "center",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    option: {
        width: (width - 60) / 4,
        alignItems: "center",
        marginBottom: 10,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    label: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
});

export default AttachmentSheet;
