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

export const archiveUser = async (userId: string) => {
    const { error } = await supabase
        .from('users')
        .update({ is_archived: true})
        .eq('id', userId);

    if (error) {
        console.error("Failed to disable user:", error);
        return;
    }
}

export const deleteUser = async (userId: string) => {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) {
        throw new Error("Failed to delete user");
    }
}