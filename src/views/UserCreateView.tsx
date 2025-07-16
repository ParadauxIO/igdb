import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../state/supabaseClient";
import type { User } from "../types/User";
//import "./UserCreateView.scss";
import Header from "../components/Header.tsx";

// Define system fields that should not be manually set during creation
const SYSTEM_FIELDS = [
    "user_id",
    "createdAt",
    "updatedAt",
    //"user_created_by",
    //"user_last_edited_by"
];

/**
 *
 * @returns
 */
export default function UserCreateView() {

    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<User>>({
        is_active: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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

        // Remove system fields from insertion data
        // const insertData: Partial<User> = { ...form };
        // SYSTEM_FIELDS.forEach(f => delete insertData[f as keyof User]);

        // todo  - here i think we need to send an email invite
        const { data, error } = await supabase.auth.admin.createUser({
            email: form.email,
            user_metadata: { name: "Yoda" },
            app_metadata: { name: "other" },
        });

        if (error) {
            setError("Failed to create user.");
            console.error(error);
        }
        else {
            console.log(data);
        }

        // const { error } = await supabase
        //     .from("user")
        //     .insert(insertData)
        //     .select();

        setLoading(false);
        if (error) {
            setError("Failed to create user.");
            console.error(error);
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/users"), 1200);
        }
    };

    return (
        <div className="user-create-view">
            <Header/>
            <div className="user-create-container">
                <h1>Add New User</h1>
                <form className="user-create-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>First Name</label>
                        <input
                            name="first_name"
                            value={form.firstname || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Surname</label>
                        <input
                            name="user_surname"
                            value={form.surname || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Role</label>
                        <select
                            name="dog_role"
                            value={form.role || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="male">Admin</option>
                            <option value="female">Breeder</option>
                            <option value="female">Trainer</option>
                            <option value="female">Boarder</option>
                            <option value="female">Service User</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Phone</label>
                        <input
                            name="user_phone"
                            value={form.phone || ""}
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
                        <button type="submit" disabled={loading}>Create</button>
                        <button type="button" onClick={() => navigate("/users")}>Cancel</button>
                    </div>
                    {success && <div className="success-msg">User created successfully!</div>}
                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );

}