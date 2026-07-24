import { io } from 'socket.io-client';
import { supabase } from './supabase'; // NEW: Import Supabase to fetch the JWT

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.connectionPromise = null; // Prevents race conditions during initialization
    }

    async connect() {
        // If already connected, return the existing instance
        if (this.socket) return this.socket;

        // If a connection is already in progress, wait for it to finish
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                this.connectionPromise = null;
                return null;
            }

            this.socket = io(SOCKET_URL, {
                auth: { token }, // Inject JWT for backend authentication
                autoConnect: true,
                withCredentials: true, // Preserved from your current setup
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Global socket disconnected:', reason);
            });

            this.socket.on('connect_error', (err) => {
                console.error("Global socket connect error:", err.message);
            });

            return this.socket;
        })();

        return this.connectionPromise;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connectionPromise = null;
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();