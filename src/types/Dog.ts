export interface Dog {
    dog_id: string;
    dog_microchip_number: string | null;
    dog_name: string;
    dog_breed: string;
    dog_role: string;
    dog_dob: string | null; // ISO date string or null
    dog_sex: 'male' | 'female' | null;
    dog_color_markings: string | null;
    dog_picture: string | null;
    dog_status: string | null;
    dog_weight_kg: number | null;
    dog_current_owner: string | null;
    dog_initial_owner: string | null;
    dog_general_notes: string | null;
    dog_medical_notes: string | null;
    dog_is_active: boolean;
    dog_created_at: string; // ISO timestamp
    dog_updated_at: string; // ISO timestamp
    dog_created_by: string | null;
    dog_last_edited_by: string | null;
}