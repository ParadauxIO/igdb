export interface Dog {
    dog_id: string;
    dog_name: string;
    dog_role: 'Guide Dog' | 'Assistance Dog' | 'Community Ambassador Dog';
    dog_yob: number;
    dog_sex: 'male' | 'female' | 'unknown';
    dog_picture: string | null;
    dog_status: string | null;
    dog_current_handler: string | null;
    dog_general_notes: string | null;
    dog_is_archived: boolean;
    dog_created_at: string;
    dog_updated_at: string;
    dog_created_by: string;
    dog_last_edited_by: string;
}