export interface User {
    id: string;
    name: string;
    role: 'viewer' | 'admin' | 'updater';
    phone: string;
    is_active: boolean;
    can_approve_updates: boolean;
    created_at: string;
    updated_at: string;
}