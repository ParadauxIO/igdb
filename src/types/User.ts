export interface User {
    id: string;
    name: string;
    permission_role: 'viewer' | 'admin' | 'updater';
    functional_role: string;
    phone: string;
    is_archived: boolean;
    can_approve_updates: boolean;
    created_at: Date;
    updated_at: Date;
}


