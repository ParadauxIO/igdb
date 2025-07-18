export interface User {
    id: string;
    name: string;
    permission_role: 'viewer' | 'admin' | 'updater';
    functional_role: string;
    phone: string;
    is_active: boolean;
    can_approve_updates: boolean;
    created_at: string;
    updated_at: string;
}