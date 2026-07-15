import api from "../../utils/api";

export const chatApi = {
    getMessages: async (beforeMessageId = null, limit = 50) => {
        const params = new URLSearchParams({ limit });
        if (beforeMessageId) params.append("before_message_id", beforeMessageId);

        const response = await api.get(`/chat/messages?${params.toString()}`);
        return response.data;
    },

    sendMessage: async (data) => {
        const response = await api.post(`/chat/messages`, data);
        return response.data;
    },

    editMessage: async (messageId, content) => {
        const response = await api.patch(
            `/chat/messages/${messageId}`,
            { content }
        );
        return response.data;
    },

    deleteMessage: async (messageId) => {
        const response = await api.delete(
            `/chat/messages/${messageId}`
        );
        return response.data;
    }
};