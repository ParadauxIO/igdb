import {supabase} from "../state/supabaseClient.ts";

// Upload file to a bucket in supbase and generate a public url
export const uploadAndGetUrl = async (files, bucketName, folderName) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${folderName}/${fileName}`;
  
        const { error: uploadError } = await supabase
          .storage
          .from(bucketName)
          .upload(filePath, file);
  
        if (uploadError) {
          console.error(`Upload failed for ${file.name}: ${uploadError.message}`);
          throw new Error(`Upload failed for ${file.name}`);
        }
  
        const { publicUrl } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(filePath).data;
  
        return publicUrl;
      });
  
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error.message);
      throw new Error('One or more media files failed to upload');
    }
  };