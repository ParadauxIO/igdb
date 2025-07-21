import {supabase} from "../state/supabaseClient.js";

export const getUser = async (userId) => {
    return supabase.from("users").select().eq("id", userId).single();
}