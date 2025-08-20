import { createContext, type ReactNode, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User } from '../../types/User';

interface AuthContextType {
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    user: User | null;
    isAdmin: boolean | null;
    isUpdater: boolean | null;
    refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isUpdater, setIsUpdater] = useState<boolean | null>(null);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error.message);
            return;
        }

        setUser(data);
        setIsAdmin(data.permission_role === 'admin');
        setIsUpdater(data.permission_role === 'updater' || data.permission_role === 'admin');
    }, []);

    const refreshProfile = useCallback(async () => {
        if (supabaseUser?.id) {
            await fetchProfile(supabaseUser.id);
        }
    }, [supabaseUser, fetchProfile]);

    useEffect(() => {
        let cancelled = false;

        const hardCheck = async () => {
            const { data, error } = await supabase.auth.getUser(); // triggers refresh if needed
            if (cancelled) return;

            if (error || !data.user) {
                // token invalid/expired and refresh failed
                setSession(null);
                setSupabaseUser(null);
                setUser(null);
                setIsAdmin(null);
                setIsUpdater(null);
                return;
            }

            setSupabaseUser(data.user);
            const { data: sess } = await supabase.auth.getSession();
            setSession(sess.session);
            await fetchProfile(data.user.id);
        };

        hardCheck();

        // re-check when tab gains focus (auto-refresh may be paused in background)
        const onFocus = () => void hardCheck();
        window.addEventListener('focus', onFocus);

        return () => { cancelled = true; window.removeEventListener('focus', onFocus); };
    }, [fetchProfile]);

    return (
        <AuthContext.Provider value={{ supabaseUser, session, user, isAdmin, isUpdater, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
