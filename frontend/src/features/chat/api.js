import api from "../../utils/api";

export const chatApi = {
    getMessages: async (beforeMessageId = null, limit = 50) => {
        const params = new URLSearchParams({ limit });
        if (beforeMessageId) params.append("before_message_id", beforeMessageId);

        const response = await api.get(`/chat/messages?${params.toString()}`);
        return response.data;
    },

    sendMessage: async (data, onProgress) => {
        // 1. If there's a file, send as multipart/form-data
        if (data.file) {
            const formData = new FormData();
            formData.append("client_message_id", data.client_message_id);
            formData.append("content", data.content ?? "");
            formData.append("type", data.type);

            if (data.reply_to_id) {
                formData.append("reply_to_id", data.reply_to_id);
            }

            formData.append("file", data.file);

            // Let Axios automatically set the Content-Type with the correct boundary
            const response = await api.post(`/chat/messages`, formData, {
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                }
            });
            return response.data;
        }

        // 2. If no file, send normally as application/json
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
        const response = await api.delete(`/chat/messages/${messageId}`);
        return response.data;
    },

    toggleReaction: async (messageId, emoji) => {
        const response = await api.post(`/chat/messages/${messageId}/reaction`, { emoji });
        return response.data;
    },

    deleteMessageForMe: async (messageId) => {
        const response = await api.delete(`/chat/messages/${messageId}/me`);
        return response.data;
    }
};