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

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        return data.data;
    }

    async getConversations(limit = 20, cursor?: string) {
        let url = `/api/conversations?limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return this.fetchWithAuth(url);
    }

    async getOrCreateDirectConversation(participantId: string) {
        return this.fetchWithAuth(`/api/conversations`, {
            method: "POST",
            body: JSON.stringify({ participantId }),
        });
    }

    async getMessages(conversationId: string, limit = 50, cursor?: string) {
        return this.fetchWithAuth(`/api/conversations/messages`, {
            method: "POST",
            body: JSON.stringify({ conversationId, limit, cursor }),
        });
    }

    async sendMessage(conversationId: string, content: string, type = "text", metadata?: any) {
        return this.fetchWithAuth(`/api/conversations/${conversationId}/messages`, {
            method: "POST",
            body: JSON.stringify({ content, type, ...metadata }),
        });
    }

    getBaseUrl() {
        return API_CONFIG.BASE_URL;
    }

    async uploadFile(formData: FormData) {
        return this.fetchWithAuth(`/api/upload`, {
            method: "POST",
            body: formData,
        });
    }

    async markMessagesAsRead(conversationId: string, messageIds: string[]) {
        return this.fetchWithAuth(`/api/conversations/${conversationId}/messages/read`, {
            method: "PUT",
            body: JSON.stringify({ messageIds }),
        });
    }

    async getAvailableUsers() {
        return this.fetchWithAuth(`/api/auth/users`);
    }
}

export default new ChatApi();
