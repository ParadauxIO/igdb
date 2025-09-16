import { createContext, type ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User } from '../../types/User';

interface AuthContextType {
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    user: User | null;
    isAdmin: boolean;
    isUpdater: boolean;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('id,name,email,permission_role,functional_role,phone,is_archived,has_accepted_terms,created_at,updated_at')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error.message);
            setUser(null);
            return;
        }
        setUser(data);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (supabaseUser?.id) {
            await fetchProfile(supabaseUser.id);
        }
    }, [supabaseUser, fetchProfile]);

    useEffect(() => {
        let cancelled = false;

        const hardCheck = async (setBusy = true) => {
            if (setBusy) setLoading(true);
            const { data, error } = await supabase.auth.getUser();
            if (cancelled) return;

            if (error || !data.user) {
                setSession(null);
                setSupabaseUser(null);
                setUser(null);
                setLoading(false);
                return;
            }

            setSupabaseUser(data.user);
            const { data: sess } = await supabase.auth.getSession();
            setSession(sess.session);
            await fetchProfile(data.user.id);
            setLoading(false);
        };

        // initial load
        void hardCheck(true);

        // refresh when user returns to the tab (not when file picker closes)
        const onVis = () => {
            if (document.visibilityState === 'visible') {
                void hardCheck(false); // soft: don’t flip global loading
            }
        };
        document.addEventListener('visibilitychange', onVis);

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setSupabaseUser(newSession?.user ?? null);
            if (newSession?.user?.id) void fetchProfile(newSession.user.id);
            else setUser(null);
        });

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVis);
            sub.subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const isAdmin = useMemo(() => user?.permission_role === 'admin', [user]);
    const isUpdater = useMemo(() => user?.permission_role === 'admin' || user?.permission_role === 'updater', [user]);

    return (
        <AuthContext.Provider value={{ supabaseUser, session, user, isAdmin: !!isAdmin, isUpdater: !!isUpdater, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}