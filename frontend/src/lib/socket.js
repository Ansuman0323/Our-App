import { io } from "socket.io-client";
import { supabase } from "./supabase";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

class SocketService {
    constructor() {
        this.socket = null;
        this.connectionPromise = null;
    }

    async connect() {
        // Already connected
        if (this.socket?.connected) {
            return this.socket;
        }

        // Connection already in progress
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = (async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                const token = session?.access_token;

                if (!token) {
                    throw new Error("No authenticated Supabase session found.");
                }

                // Reuse existing socket if it exists
                if (!this.socket) {
                    this.socket = io(SOCKET_URL, {
                        auth: { token },
                        withCredentials: true,
                        autoConnect: false,
                        reconnection: true,
                        reconnectionAttempts: Infinity,
                        reconnectionDelay: 1000,
                        transports: ["websocket", "polling"],
                    });

                    this.socket.on("connect", () => {
                        console.log(
                            "[SOCKET] Connected:",
                            this.socket.id
                        );
                    });

                    this.socket.on("disconnect", (reason) => {
                        console.log("[SOCKET] Disconnected:", reason);
                    });

                    this.socket.on("connect_error", (err) => {
                        console.error("[SOCKET] Connection Error");
                        console.error("Message:", err.message);
                        console.error(err);
                    });
                } else {
                    // Refresh JWT before reconnecting
                    this.socket.auth = { token };
                }

                if (!this.socket.connected) {
                    await new Promise((resolve, reject) => {
                        const onConnect = () => {
                            cleanup();
                            resolve();
                        };

                        const onError = (err) => {
                            cleanup();
                            reject(err);
                        };

                        const cleanup = () => {
                            this.socket.off("connect", onConnect);
                            this.socket.off("connect_error", onError);
                        };

                        this.socket.once("connect", onConnect);
                        this.socket.once("connect_error", onError);

                        this.socket.connect();
                    });
                }

                return this.socket;
            } finally {
                this.connectionPromise = null;
            }
        })();

        return this.connectionPromise;
    }

    getSocket() {
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        this.connectionPromise = null;
    }
}

export const socketService = new SocketService();