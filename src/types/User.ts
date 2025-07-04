export interface User {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    permission_role: string | null; 
    functional_role: string | null; // should we have enum types here?
    is_active: boolean;
    //createdAt: number;
    //updateAt: number;
    // add created_by number etc
}