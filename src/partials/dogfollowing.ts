import {supabase} from "../state/supabaseClient.ts";
import type {DogFollowing} from "../types/DogFollowing.ts";

// could probally move these 3 functions to it's own partial.
// Return the list of dog_id which a user is following currently.
export const getDogsUserIsFollowing = async (userId: string): Promise<string[]> => {
    const {data, error} = await supabase
        .from("dog_following")
        .select("dog_id")
        .eq('user_id', userId);

    if (error) {
        throw new Error("Failed to fetch dogs whom user is following.");
    }

    // Ensure we return an array of strings (dog_id)
    return (data ?? []).map((item: {dog_id: string}) => item.dog_id);
}

export const followDog = async (userId: string, dogId: string) => {
    const {error} = await supabase
        .from('dog_following')
        .insert({'user_id': userId, 'dog_id': dogId});
    if (error) {
        console.error("Failed to insert dog_following row:", error);
        return;
    }
};

export const unfollowDog = async (userId: string, dogId: string) => {
    const {error} = await supabase
        .from('dog_following')
        .delete()
        .eq('user_id', userId)
        .eq('dog_id', dogId);
    if (error) {
        console.error("Failed to delete dog_following row:", error);
        return;
    }
};