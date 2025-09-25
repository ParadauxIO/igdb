import {supabase} from "../state/supabaseClient.ts";
import type {Dog} from "../types/Dog.ts";

export const getDogsPublic = async () => {
    const {data} = await supabase.functions.invoke("views", {body: {view: "dogs"}})
    console.log(data);
    return data;
}

export type DogSearchResult = {
    dog_id: string;
    dog_name: string;
}

export const getUserDogs = async (userId: string): Promise<DogSearchResult[]> => {
    const {data, error} = await supabase
        .from("dogs")
        .select("dog_id, dog_name")
        .eq("dog_current_handler", userId)
        .eq("dog_is_archived", false);

    if (error) {
        throw new Error("Failed to fetch dogs");
    }

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

export const createDog = async (form: Partial<Dog>) => {
    const {data, error} = await supabase
        .from('dogs')
        .insert({
            dog_name: form.dog_name,
            dog_role: form.dog_role,
            dog_yob: form.dog_yob,
            dog_sex: form.dog_sex,
            dog_picture: form.dog_picture,
            dog_status: form.dog_status,
            dog_current_handler: form.dog_current_handler,
            dog_general_notes: form.dog_general_notes,
            dog_is_archived: false,
            dog_created_by: form.dog_created_by,
            dog_last_edited_by: form.dog_created_by
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to create dog:", error);
        throw new Error("Failed to create dog");
    }

    return data;
}

export const updateDog = async (form: Partial<Dog>) => {
    const {data, error} = await supabase
        .from('dogs')
        .update({...form})
        .eq('dog_id', form.dog_id)
        .select()
        .single();

    if (error) {
        console.error("Failed to update dog:", error);
        throw new Error("Failed to update dog");
    }

    return data;
}

export const getDogById = async (dogId: string) => {
    const {data, error} = await supabase
        .from('dogs')
        .select()
        .eq('dog_id', dogId)
        .single();

    if (error) {
        throw new Error("Failed to fetch dog by ID:");
    }

    return data;
}

export const deleteDog = async (dogId: string): Promise<void> => {
    const {error} = await supabase
        .from('dogs')
        .delete()
        .eq('dog_id', dogId);

    if (error) {
        console.error("Failed to delete dog:", error);
        throw new Error("Failed to delete dog");
    }
};

export const archiveDog = async (dogId: string) => {
    const {error} = await supabase
        .from('dogs')
        .update({dog_is_archived: true})
        .eq('dog_id', dogId);

    if (error) {
        console.error("Failed to disable dog:", error);
        return;
    }
}