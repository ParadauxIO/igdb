export type SampleUser = {
    placeholderId: string; // used for internally referencing the user in the sample data for placeholder purposes
    id?: string;
    email: string;
    password: string;
    permission_role: 'admin' | 'updater' | 'viewer';
    functional_role: 'staff' | 'volunteer' | 'puppy raiser' | 'trainer' | 'temporary boarder' | 'client' | 'adoptive family'
    phone: string;
    isActive: boolean;
    canApproveUpdates: boolean;
}

export type SampleDog = {
    dog_id: string;
    dog_name: string;
    dog_role: string;
    dog_yob: number;
    dog_sex: "male" | "female" | string; // assuming these are possible values
    dog_picture: string; // URL string
    dog_status: string;
    dog_current_handler: string; // probably a user ID
    dog_general_notes: string;
    dog_created_by: string; // user ID
};

export type SampleUpdate = {
    update_id: string;
    dog_id: string;
    update_title: string;
    update_description: string;
    update_type: string;
    update_media_urls: string[]; // array of URL strings
    update_location: string;
    update_tags: string[];
    update_is_public: boolean;
    update_created_at: string; // ISO date-time string
    update_date_approved: string; // ISO date-time string
    update_created_by: string; // user ID
    update_approved_by: string; // user ID
};

export type ImageUploadEntry = {
    sourcePath: string; // relative path to the image file on the local filesystem
    destinationPath: string; // path inside the bucket
};