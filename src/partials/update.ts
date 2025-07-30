import {supabase} from "../state/supabaseClient.ts";
import type {DogUpdate} from "../types/DogUpdate.ts";

export const postUpdate = async (form: Partial<DogUpdate>): Promise<DogUpdate> => {
    const {data, error} = await supabase
        .from('dog_updates')
        .insert({
            dog_id: form.dog_id,
            update_title: form.update_title,
            update_description: form.update_description,
            update_type: form.update_type,
            update_media_urls: form.update_media_urls,
            update_location: form.update_location,
            update_tags: form.update_tags,
            update_created_by: form.update_created_by
        })
        .select()
        .single();

    if (error) {
        console.error('Error posting update:', error.message);
        throw new Error('Failed to post update');
    }

    return data;
}