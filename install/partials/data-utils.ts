import {SupabaseClient} from "@supabase/supabase-js";
import * as fs from "fs/promises";
import * as path from "path";

import {ImageUploadEntry, SampleDog, SampleUpdate, SampleUser} from './types.ts';
import sampleDogJson from "../data/sample-dogs.json" with { type: 'json' };
import sampleUpdateJson from "../data/sample-updates.json" with { type: 'json' };
import sampleImageJson from "../data/sample-images/sample-images.json" with { type: 'json' };

const sampleDogData = sampleDogJson as SampleDog[];
const sampleUpdateData = sampleUpdateJson as SampleUpdate[];
const sampleImageData = sampleImageJson as ImageUploadEntry[];

const createUsers = async (supabase: SupabaseClient, users: SampleUser[]) => {
    for (let sampleUser of users) {
        const {error} = await supabase.from("users").insert({
            id: sampleUser.id,
            permission_role: sampleUser.permission_role,
            functional_role: sampleUser.functional_role,
            phone: sampleUser.phone,
            is_active: sampleUser.isActive,
            can_approve_updates: sampleUser.canApproveUpdates
        });

        if (error) console.error(error);
    }
}

const createDogs = async (supabase: SupabaseClient, users: SampleUser[]) => {
    // Create a map for quick placeholder lookup
    console.log("Seeding sample dogs...")
    const userMap = new Map(users.map(user => [user.placeholderId, user.id!]));

    const replacePlaceholder = (value: string): string => {
        // Check if value is a placeholder (wrapped in {{}})
        const match = value.match(/^\{\{(.+)_ID\}\}$/);
        if (match) {
            const placeholderId = match[1]; // Extract "ADMIN1" from "{{ADMIN1_ID}}"
            return userMap.get(placeholderId) || value;
        }
        return value;
    };

    for (let sampleDog of sampleDogData) {
        const dogData = {
            ...sampleDog,
            dog_current_handler: replacePlaceholder(sampleDog.dog_current_handler),
            dog_created_by: replacePlaceholder(sampleDog.dog_created_by),
            dog_last_edited_by: replacePlaceholder(sampleDog.dog_created_by)
        };

        const {error} = await supabase.from("dogs").insert(dogData);
        if (error) console.error(error);
    }
}

const destroyBucket = async (supabase: SupabaseClient, bucketName: string) => {
    // Recursively list all files in the bucket
    const listAllFiles = async (prefix = ''): Promise<string[]> => {
        const { data: items, error } = await supabase.storage.from(bucketName).list(prefix, {
            limit: 1000,
        });

        if (error) {
            console.error(`Error listing "${prefix}" in bucket "${bucketName}":`, error);
            return [];
        }

        let filePaths: string[] = [];

        for (const item of items || []) {
            const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

            if (item.metadata) {
                // It's a file
                filePaths.push(itemPath);
            } else {
                // It's a folder — recurse into it
                const nestedFiles = await listAllFiles(itemPath);
                filePaths = filePaths.concat(nestedFiles);
            }
        }

        return filePaths;
    };

    const allFilePaths = await listAllFiles();

    // Delete all files
    if (allFilePaths.length > 0) {
        const { error: deleteFilesError } = await supabase.storage.from(bucketName).remove(allFilePaths);
        if (deleteFilesError) {
            console.error(`Error deleting files from bucket "${bucketName}":`, deleteFilesError);
            return;
        }
    }

    // Delete the bucket
    const { error: deleteBucketError } = await supabase.storage.deleteBucket(bucketName);
    if (deleteBucketError) {
        console.error(`Error deleting bucket "${bucketName}":`, deleteBucketError);
    } else {
        console.log(`Bucket "${bucketName}" successfully deleted.`);
    }
};

const createBucket = async (supabase: SupabaseClient, bucketName: string) => {
    const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 1024 * 1024 // 1 MB limit
    });

    if (error) {
        console.error("Error creating bucket:", error);
    } else {
        console.log("Bucket created successfully:", data);
    }
}

const uploadSampleImages = async (supabase: SupabaseClient) => {
    const uploadResults = [];

    for (const entry of sampleImageData) {
        try {
            const fileBuffer = await fs.readFile(entry.sourcePath);

            const [bucket, ...pathParts] = entry.destinationPath.split('/');
            const storagePath = pathParts.join('/');
            const contentType = getContentType(entry.sourcePath);

            const { error } = await supabase.storage
                .from(bucket)
                .upload(storagePath, fileBuffer, {
                    upsert: true,
                    contentType,
                });

            if (error) {
                console.error(`Failed to upload ${entry.sourcePath}:`, error.message);
                uploadResults.push({ source: entry.sourcePath, success: false, error });
            } else {
                console.log(`Uploaded ${entry.sourcePath} to ${entry.destinationPath}`);
                uploadResults.push({ source: entry.sourcePath, success: true });
            }
        } catch (err) {
            console.error(`Error reading file ${entry.sourcePath}:`, err);
            uploadResults.push({ source: entry.sourcePath, success: false, error: err });
        }
    }

    return uploadResults;
};

const getContentType = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}

const createUpdates = async (supabase: SupabaseClient, users: SampleUser[]) => {
    // Create a map for quick placeholder lookup
    console.log("Seeding sample updates...")
    const userMap = new Map(users.map(user => [user.placeholderId, user.id!]));
    const replacePlaceholder = (value: string | null): string | null => {
        // First check if the value is null or not a string
        if (value === null || typeof value !== 'string') {
            return value;
        }

        // Check if value is a placeholder (wrapped in {{}})
        const match = value.match(/^\{\{(.+)_ID\}\}$/);
        if (match) {
            const placeholderId = match[1]; // Extract "ADMIN1" from "{{ADMIN1_ID}}"
            return userMap.get(placeholderId) || value;
        }
        return value;
    };

    for (let sampleUpdate of sampleUpdateData) {
        const updateData = {
            ...sampleUpdate,
            update_created_by: replacePlaceholder(sampleUpdate.update_created_by),
            update_approved_by: replacePlaceholder(sampleUpdate.update_approved_by)
        };

        const {error} = await supabase.from("dog_updates").insert(updateData);
        if (error) console.error(error);
    }
}

export {createUsers, createDogs, destroyBucket, createBucket, uploadSampleImages, createUpdates}