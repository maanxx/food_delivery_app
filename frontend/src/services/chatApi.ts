import AsyncStorage from "@react-native-async-storage/async-storage";
import API_CONFIG from "../configs/api";

class ChatApi {
    private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
        const token = await AsyncStorage.getItem("access_token");
        
        const headers: Record<string, string> = {
            ...(options.headers as any),
        };

        // Don't set Content-Type if it's FormData
        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        console.log(`[ChatApi] Requesting: ${API_CONFIG.BASE_URL}${endpoint}`);
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Handle 204 No Content
        if (response.status === 204) {
            return { success: true };
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error(`[ChatApi] Non-JSON response from ${endpoint}:`, text.substring(0, 100));
            throw new Error(`Server returned non-JSON response (${response.status})`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data.data;
    }

    async getConversations(limit = 20, cursor?: string) {
        let url = `${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}?limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return this.fetchWithAuth(url);
    }

    async getOrCreateDirectConversation(participantId: string) {
        return this.fetchWithAuth(API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS, {
            method: "POST",
            body: JSON.stringify({ participantId }),
        });
    }

    async getConversationDetails(conversationId: string) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/details`, {
            method: "POST",
            body: JSON.stringify({ conversationId }),
        });
    }

    async getMessages(conversationId: string, limit = 50, cursor?: string) {
        return this.fetchWithAuth(API_CONFIG.ENDPOINTS.CHAT.MESSAGES, {
            method: "POST",
            body: JSON.stringify({ conversationId, limit, cursor }),
        });
    }

    async sendMessage(conversationId: string, content: string, type = "text", metadata?: any) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/messages`, {
            method: "POST",
            body: JSON.stringify({ content, type, ...metadata }),
        });
    }

    getBaseUrl() {
        return API_CONFIG.BASE_URL;
    }

    async uploadFile(formData: FormData) {
        return this.fetchWithAuth(API_CONFIG.ENDPOINTS.CHAT.UPLOAD, {
            method: "POST",
            body: formData,
        });
    }

    async markMessagesAsRead(conversationId: string, messageIds: string[]) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/messages/read`, {
            method: "PUT",
            body: JSON.stringify({ messageIds }),
        });
    }

    async getAvailableUsers() {
        return this.fetchWithAuth(API_CONFIG.ENDPOINTS.AUTH.USERS);
    }

    async deleteMessage(conversationId: string, messageId: string) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/messages/${messageId}`, {
            method: "DELETE",
        });
    }

    async recallMessage(messageId: string, conversationId: string) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/messages/${messageId}/recall`, {
            method: "PUT",
        });
    }

    // Group management
    async createGroup(name: string, participantIds: string[], avatar?: any) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("participantIds", JSON.stringify(participantIds));
        if (avatar) {
            formData.append("avatar", avatar);
        }

        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/group`, {
            method: "POST",
            body: formData,
        });
    }

    async addMember(conversationId: string, memberId: string) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/members`, {
            method: "POST",
            body: JSON.stringify({ memberId }),
        });
    }

    async removeMember(conversationId: string, memberId: string) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/members`, {
            method: "DELETE",
            body: JSON.stringify({ memberId }),
        });
    }

    async leaveGroup(conversationId: string) {
        // Leaving is often implemented as removing oneself
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/members/leave`, {
            method: "DELETE",
        });
    }

    async updateGroupAvatar(conversationId: string, avatar: any) {
        const formData = new FormData();
        formData.append("avatar", avatar);
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}`, {
            method: "PUT",
            body: formData,
        });
    }

    async dissolveGroup(conversationId: string) {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/disband`, {
            method: "DELETE",
        });
    }

    async assignRole(conversationId: string, memberId: string, role: "admin" | "member") {
        return this.fetchWithAuth(`${API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/members/role`, {
            method: "PUT",
            body: JSON.stringify({ memberId, role }),
        });
    }
}

export default new ChatApi();
