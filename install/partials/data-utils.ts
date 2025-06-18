import {SampleDog, SampleUpdate, SampleUser} from './types.ts';
import {SupabaseClient} from "@supabase/supabase-js";
import sampleDogJson from "../data/sample-dogs.json" with { type: 'json' };
import sampleUpdateJson from "../data/sample-updates.json" with { type: 'json' };

const sampleDogData = sampleDogJson as SampleDog[];
const sampleUpdateData = sampleUpdateJson as SampleUpdate[];

const createUsers = async (supabase: SupabaseClient, users: SampleUser[]) => {
    for (let sampleUser of users) {
        await supabase.from("users").insert({
            id: sampleUser.id,
            role: sampleUser.role,
            phone: sampleUser.phone,
            is_active: sampleUser.isActive,
            can_approve_updates: sampleUser.canApproveUpdates
        });
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
            dog_current_owner: replacePlaceholder(sampleDog.dog_current_owner),
            dog_initial_owner: replacePlaceholder(sampleDog.dog_initial_owner),
            dog_created_by: replacePlaceholder(sampleDog.dog_created_by)
        };

        await supabase.from("dogs").insert(dogData);
    }
}

export {createUsers, createDogs}