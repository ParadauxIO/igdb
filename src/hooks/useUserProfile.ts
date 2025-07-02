import { useEffect, useState } from 'react';
import { supabase } from '../state/supabaseClient';
import type { User } from '@supabase/supabase-js';

/**
 * This hook retrieves the current user profile details.
 * @returns {User | null} The current session user details
 */
export function useUserProfile() {
    const [user, setUser] = useState<User | null>(null);
  
    useEffect(() => {
      // Get current user
      const getUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error.message);
          setUser(null);
        } else {
          setUser(data.user);
        }
      };
  
      getUser();
  
      // set up a listener for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
  
      // Cleanup the listener on unmount
      return () => {
        authListener.subscription.unsubscribe();
      };
    }, []);
  
    return { user };
};