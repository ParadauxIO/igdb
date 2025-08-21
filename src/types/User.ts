export interface User {
    id: string;
    name: string;
    permission_role: 'viewer' | 'admin' | 'updater';
    functional_role: string;
    phone: string;
    is_archived: boolean;
    has_accepted_terms: boolean;
    created_at: Date;
    updated_at: Date;
    password?: string; // Optional for user profile updates
    confirm_password?: string; // Optional for user profile updates
}


