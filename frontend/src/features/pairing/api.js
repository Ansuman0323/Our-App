import { apiClient } from '../../lib/axios';

export const pairingApi = {
    // Creates a new space and returns the initial invite code
    createSpace: async () => {
        const response = await apiClient.post('/pairing/create');
        return response.data;
    },

    // Joins an existing space using a partner's code
    joinSpace: async (inviteCode) => {
        const response = await apiClient.post('/pairing/join', {
            invite_code: inviteCode
        });
        return response.data;
    },

    // Used by AuthContext / ProtectedRoute to know if the user is in a space
    getStatus: async () => {
        const response = await apiClient.get('/pairing/status');
        return response.data;
    },

    // ------------------------------------------------------------------------
    // DASHBOARD CONSUMED ENDPOINTS
    // ------------------------------------------------------------------------

    // Used by the Dashboard to determine if it should show the Waiting or Connected screen
    getInvite: async () => {
        const response = await apiClient.get('/pairing/invite');
        return response.data;
    },

    // Used by the Dashboard (Waiting screen) to generate a new code for the Owner
    regenerateInvite: async () => {
        const response = await apiClient.post('/pairing/invite/regenerate');
        return response.data;
    }
};