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

    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [form, setForm] = useState<Partial<User>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        supabase
            .from("user")
            .select("*")
            .eq("user_id", userId)
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
    }, [userId]);

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
        SYSTEM_FIELDS.forEach(f => delete updateData[f as keyof User]);

        const { error } = await supabase
            .from("user")
            .update(updateData)
            .eq("user_id", userId);

        setLoading(false);
        if (error) {
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
                <h1>Edit User Profile: {user.firstname}</h1>
                <form className="dog-edit-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>First Name</label>
                        <input
                            name="dog_name"
                            value={form.firstname || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Surname</label>
                        <input
                            name="dog_microchip_number"
                            value={form.surname || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Phone</label>
                        <input
                            name="dog_breed"
                            value={form.phone || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Role</label>
                        <input
                            name="dog_role"
                            value={form.role || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row checkbox-row">
                        <label>
                            <input
                                name="user_is_active"
                                type="checkbox"
                                checked={!!form.isActive}
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