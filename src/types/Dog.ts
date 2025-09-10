export interface Dog {
    dog_id: string;
    dog_name: string;
    dog_role: 'Guide Dog' | 'Assistance Dog' | 'Community Ambassador Dog';
    dog_yob: number;
    dog_sex: 'Male' | 'Female';
    dog_picture: string | null;
    dog_status: string | null;
    dog_current_handler: string | null;
    dog_current_handler_user?: DogHandlerName;
    dog_current_handler_name?: string;
    dog_general_notes: string | null;
    dog_is_archived: boolean;
    dog_created_at: string;
    dog_updated_at: string;
    dog_created_by: string;
    dog_created_by_user?: DogHandlerName;
    dog_created_by_name?: string;
    dog_last_edited_by: string;
    dog_last_edited_by_user?: DogHandlerName; // <-- missing
    dog_last_edited_by_name?: string;
}

export type DogHandlerName = {
    name: string;
}