import {supabase} from "../state/supabaseClient.ts";
import type {DogUpdate} from "../types/DogUpdate.ts";
import {uploadAndGetUrl} from "./fileUpload";

/**
 * Posts a new dog update.
 */
export const postUpdate = async (
    form: Partial<DogUpdate> & { files?: File[] }
): Promise<DogUpdate> => {
    let update_media_urls: string[] = [];

    if (form.files && form.files.length > 0) {
        update_media_urls = await uploadAndGetUrl(
            form.files,
            "sample", // TODO: change bucket name in prod
            "updates"
        );
    }

    const {data, error} = await supabase
        .from("dog_updates")
        .insert({
            dog_id: form.dog_id,
            update_title: form.update_title,
            update_description: form.update_description,
            update_type: form.update_type,
            update_media_urls,
            update_location: form.update_location,
            update_tags: form.update_tags,
            update_created_by: form.update_created_by,
        })
        .select()
        .single<DogUpdate>();

    if (error) {
        console.error("Error posting update:", error.message);
        throw new Error("Failed to post update");
    }

    return data;
};

/**
 * Gets a user's feed.
 */
export const getUserFeed = async (): Promise<DogUpdate[]> => {
    const {data, error} = await supabase.functions.invoke("views", {
        body: {view: "feed"},
    });

    if (error) {
        throw new Error(`Feed fetch failed: ${error.message}`);
    }

    // supabase-js already passes the user’s JWT automatically,
    // no need to manually set Authorization headers.
    return data as DogUpdate[];
};
/**
 * Updates an existing dog update.
 */
export const updateDogUpdate = async (
    updateId: string,
    form: Partial<DogUpdate>
): Promise<DogUpdate> => {
    const {data, error} = await supabase
        .from("dog_updates")
        .update({...form})
        .eq("update_id", updateId)
        .select()
        .single<DogUpdate>();

    if (error) {
        console.error("Error updating dog update:", error.message);
        throw new Error("Failed to update dog update");
    }

    return data;
};

/**
 * Approves a dog update.
 */
export const approveUpdate = async (
    updateId: string,
    approvedBy: string
): Promise<DogUpdate> => {
    const {data, error} = await supabase
        .from("dog_updates")
        .update({
            update_date_approved: new Date().toISOString(),
            update_approved_by: approvedBy,
        })
        .eq("update_id", updateId)
        .select()
        .single<DogUpdate>();

    if (error) {
        console.error("Error approving update:", error.message);
        throw new Error("Failed to approve update");
    }

    return data;
};

/**
 * Rejects (deletes) a dog update.
 */
export const rejectUpdate = async (updateId: string): Promise<DogUpdate> => {
    const {data, error} = await supabase
        .from("dog_updates")
        .delete()
        .eq("update_id", updateId)
        .select()
        .single<DogUpdate>();

    if (error) {
        console.error("Error rejecting update:", error.message);
        throw new Error("Failed to reject update");
    }

    return data;
};

/**
 * Gets the approval queue, filtered by approval status.
 */
export async function getApprovalQueue(showApproved: boolean): Promise<DogUpdate[]> {
    let query = supabase
        .from("dog_updates")
        .select(`
      update_id,
      dog_id,
      update_title,
      update_description,
      update_media_urls,
      update_date_approved,
      update_created_at,
      update_created_by,
      update_approved_by,

      creator:users!dog_updates_update_created_by_fkey(name),
      dog:dogs!dog_updates_dog_id_fkey(dog_name)
    `)
        .order("update_created_at", {ascending: false});

    // Filter pending vs approved
    query = showApproved
        ? query.not("update_date_approved", "is", null)
        : query.is("update_date_approved", null);

    const {data, error} = await query;
    if (error) throw error;

    // Flatten the joined objects into simple fields the table can use
    return (data ?? []).map((row: any) => ({
        ...row,
        creator_name: row.creator?.name ?? "",
        dog_name: row.dog?.dog_name ?? "",
    })) as DogUpdate[];
}