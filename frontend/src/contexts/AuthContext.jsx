import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authApi } from '../features/auth/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);       // Supabase IdP User
    const [dbUser, setDbUser] = useState(null);   // Flask Postgres User
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchDbUser();
            } else {
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);

            if (event === 'SIGNED_IN') {
                try {
                    // Trigger sync immediately to ensure DB has this user
                    await authApi.syncUser({
                        email: session.user.email,
                        display_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                    });
                    await fetchDbUser();
                } catch (error) {
                    console.error("Database sync failed", error);
                    setLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setDbUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchDbUser = async () => {
        try {
            const data = await authApi.getMe();
            setDbUser(data);
        } catch (error) {
            console.error("Failed to fetch database profile", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signup = async (email, password, displayName) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: displayName } }
        });
        if (error) throw error;
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, dbUser, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);