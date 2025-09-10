import { supabase } from "../state/supabaseClient.ts";

/**
 * Uploads files to a Supabase Storage bucket and returns their public URLs.
 *
 * @param files      An array of File objects to upload.
 * @param bucketName The name of the Supabase Storage bucket.
 * @param folderName The folder path inside the bucket to store the files.
 * @returns A promise that resolves to an array of public URLs.
 */
export const uploadAndGetUrl = async (
    files: File[],
    bucketName: string,
    folderName: string
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split(".").pop() ?? "";
      const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
      const filePath = `${folderName}/${fileName}`;

      const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);

      if (uploadError) {
        console.error(
            `Upload failed for ${file.name}: ${uploadError.message}`
        );
        throw new Error(`Upload failed for ${file.name}`);
      }

      const { data: publicData } = supabase.storage
          .from(bucketName)
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