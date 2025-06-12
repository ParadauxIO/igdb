import { useEffect } from "react"
import { supabase } from "../state/supabaseClient";

export default function LogoutView() {
    useEffect(() => {
        const logout = async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
        }
        logout();
    }, []);

    return (
        <div>
            You've been successfully logged out.
        </div>
    )
}