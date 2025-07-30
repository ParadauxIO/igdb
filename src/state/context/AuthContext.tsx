import { createContext, type ReactNode, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User } from '../../types/User';

interface AuthContextType {
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    user: User | null;
    isAdmin: boolean | null;
    isUpdater: boolean | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isUpdater, setIsUpdater] = useState<boolean | null>(null);

    // Fetch profile from users table
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error.message);
            return;
        }

        setUser((prev) => (prev?.id === data.id ? prev : data));
        setIsAdmin((prev) => (prev === (data.permission_role === 'admin') ? prev : data.permission_role === 'admin'));
        setIsUpdater((prev) => (prev === (data.permission_role === 'updater' || data.permission_role === 'admin')
            ? prev
            : data.permission_role === 'updater' || data.permission_role === 'admin'));
    };

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            setSession(session);
            setSupabaseUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setUser(null);
            }
        };

        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setSupabaseUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setUser(null);
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ supabaseUser, session, user, isAdmin, isUpdater }}>
            {children}
        </AuthContext.Provider>
    );
}