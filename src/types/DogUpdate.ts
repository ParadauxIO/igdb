export interface DogUpdate {
    update_id: string;
    dog_id: string;
    update_title: string;
    update_description: string;
    update_type: string;
    update_media_urls: string[];
    update_location: string;
    update_tags: string[];
    update_created_at: string;
    update_date_approved: string | null;
    update_created_by: string;
    update_approved_by: string | null;
    creator_name?: string; // For approval queue table
    dog_name?: string;
}