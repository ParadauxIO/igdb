import {supabase} from "../state/supabaseClient.js";

export const searchUsers = async (query: string) => {
    const {data, error} = await supabase
        .from('user_basic_view')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching users:', error.message);
        return [];
    }

    return data ?? [];
};
