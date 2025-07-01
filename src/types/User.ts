export interface User {
    user_id: string;
    email: string | null;
    firstname: string | null;
    surname: string | null;
    role: string | null; // should we have enum types here?
    phone: string | null;
    isActive: boolean;
    createdAt: number;
    updateAt: number;
    // add created_by number etc
}