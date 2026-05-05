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

    async deleteForMe(messageId: string, conversationId: string) {
        return this.fetchWithAuth(`/api/messages/${messageId}/delete-for-me`, {
            method: "DELETE",
            body: JSON.stringify({ conversationId }),
        });
    }

    async deleteForEveryone(messageId: string, conversationId: string) {
        return this.fetchWithAuth(`/api/messages/${messageId}/delete-for-everyone`, {
            method: "DELETE",
            body: JSON.stringify({ conversationId }),
        });
    }

    async recallMessage(messageId: string, conversationId: string) {
        return this.fetchWithAuth(`/api/messages/${messageId}/recall`, {
            method: "PUT",
            body: JSON.stringify({ conversationId }),
        });
    }

    async deleteMessage(conversationId: string, messageId: string, forEveryone = false) {
        if (forEveryone) return this.deleteForEveryone(messageId, conversationId);
        return this.deleteForMe(messageId, conversationId);
    }

    // Group management
    async createGroup(name: string, participantIds: string[], avatar?: string) {
        return this.fetchWithAuth("/api/groups/create", {
            method: "POST",
            body: JSON.stringify({ name, participantIds, avatar }),
        });
    }

    async addMember(conversationId: string, participantIds: string[]) {
        return this.fetchWithAuth(`/api/groups/${conversationId}/add-member`, {
            method: "POST",
            body: JSON.stringify({ participantIds }),
        });
    }

    async removeMember(conversationId: string, userId: string) {
        return this.fetchWithAuth(`/api/groups/${conversationId}/remove-member/${userId}`, {
            method: "DELETE",
        });
    }

    async leaveGroup(conversationId: string) {
        return this.fetchWithAuth(`/api/groups/${conversationId}/leave`, {
            method: "DELETE",
        });
    }

    async dissolveGroup(conversationId: string) {
        return this.fetchWithAuth(`/api/groups/${conversationId}/dissolve`, {
            method: "DELETE",
        });
    }

    async assignRole(conversationId: string, targetUserId: string, role: string) {
        return this.fetchWithAuth(`/api/groups/${conversationId}/assign-role`, {
            method: "PUT",
            body: JSON.stringify({ targetUserId, role }),
        });
    }
}

export default new ChatApi();
