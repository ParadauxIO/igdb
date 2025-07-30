import {supabase} from "../state/supabaseClient.js";

export const getUsers = async () => {
    const {data, error} = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Error searching users:', error.message);
        return [];
    }

    return data ?? [];
};
