import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "../state/supabaseClient";
import type { User } from "../types/User";
//import "./DogEditView.scss";
import Header from "../components/Header.tsx";

// const SYSTEM_FIELDS = [
//     "user_created_at",
//     "user_created_by",
//     "user_updated_at",
//     "user_updated_by"
// ];

/**
 * The User Profile/Edit page.
 * Can change their name, phone & password
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

    const fetchUser = async () => {
        setLoading(true);

        const userResponse = await supabase.auth.getUser()
        if (userResponse.data.user) {


            // load the user id
            const {data, error} = await supabase
                .from('users')
                .select("*")
                .eq('dog_id', userResponse.data.user.id);
            if (error) {
                console.log("Error occurred while fetching dogs:", error);
                return;
            }
            if (data) {
                setUser(data);
            }
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchUser();
    });

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
            <Header/>
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