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

    return error;
}

export const deleteUser = async (userId: string) => {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    return error;
}

export const resendInvite = async (userId: string) => {
    const { error } = await supabase.functions.invoke("update-user", {
        body: {
            type: "resend-invite",
            id: userId
        }
    });

    return error;
}

export const getUserById = async (userId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        throw new Error("Failed to fetch user by ID: " + userId + " - " + error.message);
    }

    return data;
}