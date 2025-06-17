// Simple React hook to get Supabase auth session and listen for changes
import { useEffect, useState } from 'react';
import { supabase } from '../state/supabaseClient';
import type { Session } from '@supabase/supabase-js';

/**
 * This hook retrieves the current Supabase auth session and listens for changes.
 * @author Rían Errity
 * @returns {Session | null} The current session or null if not authenticated
 */
export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);
  return session;
}
