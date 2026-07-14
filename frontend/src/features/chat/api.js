import api from "../../utils/api";

export const chatApi = {
    getMessages: async (beforeMessageId = null, limit = 50) => {
        const params = new URLSearchParams({ limit });
        if (beforeMessageId) params.append('before_message_id', beforeMessageId);

        // Changed from '/api/v1/chat/messages' to '/chat/messages'
        const response = await api.get(`/chat/messages?${params.toString()}`);
        return response.data;
    },

    sendMessage: async (data) => {
        // Changed from '/api/v1/chat/messages' to '/chat/messages'
        const response = await api.post(`/chat/messages`, data);
        return response.data;
    }
};