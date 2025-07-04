import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "../state/supabaseClient";
import type { User } from "../types/User";
//import "./DogEditView.scss";
import NavBar from "../components/NavBar.tsx";

const SYSTEM_FIELDS = [
    "user_created_at",
    "user_created_by",
    "user_updated_at",
    "user_updated_by"
];

/**
 * The User Profile/Edit page.
 * @returns
 */
export default function UserProfileView() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [form, setForm] = useState<Partial<User>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        supabase
            .from("users")
            .select("*")
            .eq("id",id)
            .single()
            .then(({ data, error }) => {
                if (error || !data) {
                    setError("Dog not found.");
                } else {
                    setUser(data);
                    setForm(data);
                }
                setLoading(false);
            });
    }, [id]);

    type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    type ChangeEventValues = {
        name: string;
        value: string;
        type: string;
        checked?: boolean;
    }
    const handleChange = (e: ChangeEvent) => {
        const { name, value, type, checked }: ChangeEventValues = e.target;
        let val: any = value;
        if (type === "checkbox") val = checked;
        if (type === "number") val = value === "" ? null : Number(value);
        setForm(f => ({ ...f, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Remove system fields from update
        const updateData: Partial<User> = { ...form };
        console.log('updateData:{}',updateData);
        //SYSTEM_FIELDS.forEach(f => delete updateData[f as keyof User]);

        const { error } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", id);

        setLoading(false);
        if (error) {
            console.log('Failed to update user:{}',error);
            setError("Failed to update user.");
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/users"), 1200);
        }
    };

    if (loading && !user) return <div className="user-profile-view">Loading...</div>;
    if (error) return <div className="dog-profile-view error">{error}</div>;
    if (!user) return null;

    return (
        <div className="dog-edit-view">
            <NavBar/>
            <div className="dog-edit-container">
                <h1>Edit User Profile: {user.name}</h1>
                <form className="dog-edit-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>Name</label>
                        <input
                            name="name"
                            value={form.name || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Email</label>
                        <input
                            name="email"
                            value={form.email || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Phone</label>
                        <input
                            name="phone"
                            value={form.phone || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Role</label>
                        <input
                            name="functional_role"
                            value={form.functional_role || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row checkbox-row">
                        <label>
                            <input
                                name="user_is_active"
                                type="checkbox"
                                checked={!!form.is_active}
                                onChange={handleChange}
                            />
                            Active
                        </label>
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={loading}>Save</button>
                        <button type="button" onClick={() => navigate("/users")}>Cancel</button>
                    </div>
                    {success && <div className="success-msg">User updated!</div>}
                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );
}