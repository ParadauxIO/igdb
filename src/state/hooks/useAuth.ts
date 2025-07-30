// Simple React hook to get Supabase auth session and listen for changes


import {useContext} from "react";
import {AuthContext} from "../context/AuthContext.tsx";
/**
 * This hook retrieves the current Supabase auth session and listens for changes.
 * @author Rían Errity
 * @returns {Session | null} The current session or null if not authenticated
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  console.log("context", context);
  return context;
}
