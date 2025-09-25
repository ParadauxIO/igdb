import { supabase } from "../state/supabaseClient.ts";

/**
 * Uploads files to the `dog-updates` bucket and returns their public URLs.
 *
 * Storage path format enforced by RLS:
 *   dog-updates/{dogId}/{userId}/{filename}
 *
 * @param files  An array of File objects to upload.
 * @param dogId  The UUID of the dog this update belongs to.
 * @param userId The UUID of the uploading user (should equal auth.uid()).
 * @returns A promise that resolves to an array of public URLs.
 */
export const uploadDogUpdateMedia = async (
    files: File[],
    dogId: string,
    userId: string
): Promise<string[]> => {
    const bucket = "dog-updates";

    try {
        const uploadPromises = files.map(async (file) => {
            const fileExt = file.name.split(".").pop() ?? "";
            const fileName = `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2)}.${fileExt}`;

            const filePath = `${dogId}/${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                console.error(
                    `Upload failed for ${file.name}: ${uploadError.message}`
                );
                throw new Error(`Upload failed for ${file.name}`);
            }

            const { data: publicData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return publicData.publicUrl;
        });

        return await Promise.all(uploadPromises);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Upload error:", error.message);
        } else {
            console.error("Unknown upload error:", error);
        }
        throw new Error("One or more media files failed to upload");
    }
};


/**
 * Upload a single avatar to the `dog-avatars` bucket and return its public URL.
 * Path enforced by RLS: dog-avatars/{dogId}/avatar.<ext>
 *
 * NOTE: Only admins can write here (per your RLS). Non-admins will get a 401/403.
 *
 * @param file   The image file to upload.
 * @param dogId  The dog's UUID.
 * @returns      Public URL string.
 */
export const uploadDogAvatar = async (
    file: File,
    dogId: string
): Promise<string> => {
    const bucket = "dog-avatars";
    const folder = `${dogId}`.replace(/^\/+|\/+$/g, "");

    // Normalise extension (default png). Keep it simple.
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "png";

    // Generate a UUID filename (browser-safe)
    const uuid =
        (typeof crypto !== "undefined" && "randomUUID" in crypto)
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const path = `${folder}/${uuid}.${safeExt}`;

    // 1) List everything in the dog's folder
    const { data: existing, error: listErr } = await supabase.storage
        .from(bucket)
        .list(folder);

    if (listErr) {
        console.error("Failed to list dog avatar folder:", listErr.message);
        throw new Error("Could not check existing avatars");
    }

    // 2) Delete all existing files in the folder
    if (existing?.length) {
        const toDelete = existing.map((f) => `${folder}/${f.name}`);
        const { error: delErr } = await supabase.storage.from(bucket).remove(toDelete);
        if (delErr) {
            console.error("Failed to delete old avatars:", delErr.message);
            throw new Error("Could not remove old avatar(s)");
        }
    }

    // 3) Upload new file under UUID name (no upsert required)
    const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            contentType: file.type || `image/${safeExt}`,
            cacheControl: "31536000", // long cache; filename is unique per upload
            upsert: false,
        });

    if (uploadErr) {
        console.error("Avatar upload failed:", uploadErr.message);
        throw new Error("Upload failed");
    }

    // 4) Public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl; // unique filename => no cache-buster required
};