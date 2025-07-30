import {supabase} from "../state/supabaseClient.ts";
import type {Dog} from "../types/Dog.ts";

export const getDogsPublic = async () => {
    const {data} = await supabase.functions.invoke("views", {body: {view: "dogs"}})
    console.log(data);
    return data;
}

export const getDogsWithNames = async () => {
    const {data, error} = await supabase
        .from('dogs')
        .select(`
            *,
            dog_created_by_user:users!dogs_dog_created_by_fkey (
                name
            ),
            dog_last_edited_by_user:users!dogs_dog_last_edited_by_fkey (
                name
            ),
            dog_current_handler_user:users!dogs_dog_current_handler_fkey (
                name
            )
        `)
        .order('dog_created_at', {ascending: false});

    if (error) {
        console.log("Error occurred while fetching dogs:", error);
        return;
    }

    if (data) {
        const flattenedData: Dog[] = data.map((dog: any) => ({
            ...dog,
            dog_created_by_name: dog.dog_created_by_user?.name,
            dog_last_edited_by_name: dog.dog_last_edited_by_user?.name,
            dog_current_handler_name: dog.dog_current_handler_user?.name,
        }));
        return flattenedData;
    }
};

export const deleteDog = async (dogId: string) => {
    const {error} = await supabase
        .from('dogs')
        .delete()
        .eq('dog_id', dogId);

    if (error) {
        console.error("Failed to delete dog:", error);
        return;
    }
};

export const archiveDog = async (dogId: string) => {
    const {error} = await supabase
        .from('dogs')
        .update({dog_is_active: false})
        .eq('dog_id', dogId);

    if (error) {
        console.error("Failed to disable dog:", error);
        return;
    }
}