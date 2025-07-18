import { useState } from "react";
import { useNavigate } from "react-router";

import "./AdminCreateDogView.scss";
import type {User} from "../../../types/User.ts";
import {supabase} from "../../../state/supabaseClient.ts";
import type {Dog} from "../../../types/Dog.ts";
import LookupInput from "../../../components/LookupInput.tsx";

// Define system fields that should not be manually set during creation
const SYSTEM_FIELDS = [
    "dog_id",
    "dog_created_at",
    "dog_updated_at",
    "dog_created_by",
    "dog_last_edited_by"
];

export default function AdminCreateDogView() {
    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<Dog>>({
        dog_is_active: true,
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

    const searchUsers = async (query: string): Promise<User[]> => {
        const { data, error } = await supabase
        .from('user_basic_view')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

        if (error) {
            console.error('Error searching users:', error.message);
        return []; }

        return data ?? [];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Remove system fields from insertion data
        const insertData: Partial<Dog> = { ...form };
        SYSTEM_FIELDS.forEach(f => delete insertData[f as keyof Dog]);

        const { error } = await supabase
            .from("dogs")
            .insert(insertData)
            .select();

        setLoading(false);
        if (error) {
            setError("Failed to create dog.");
            console.error(error);
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/dogs"), 1200);
        }
    };

    return (
        <div className="dog-create-view">
            <div className="dog-create-container">
                <h1>Add New Dog</h1>
                <form className="dog-create-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label className="required-label">Name</label>
                        <input
                            name="dog_name"
                            value={form.dog_name || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="required-label">Role</label>
                        <select
                            name="dog_role"
                            value={form.dog_role || ""}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select</option>
                            <option value="Guide Dog">Guide Dog</option>
                            <option value="Assistance Dog">Assistance Dog</option>
                            <option value="Community Ambassador Dog">Community Ambassador Dog</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <label className="required-label">Sex</label>
                        <select
                            name="dog_sex"
                            value={form.dog_sex || ""}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <label htmlFor="dog_yob">Year of Birth</label>
                        <select
                            name="dog_yob"
                            value={form.dog_yob || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            {Array.from({ length: 20 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
                                return (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Picture URL</label>
                        <input
                            name="dog_picture"
                            value={form.dog_picture || ""}
                            onChange={handleChange}
                        />
                    </div>
                    {form.dog_picture && (
                        <div className="picture-preview">
                            <label>Picture Preview</label>
                            <img src={form.dog_picture} alt="Picture Preview of Dog"/>
                        </div>
                    )}
                    <div className="form-row">
                        <label>Status</label>
                        <select
                            name="dog_status"
                            value={form.dog_status || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="Active Service">Active Service</option>
                            <option value="Assistance Dog">Assistance Dog</option>
                            <option value="Guide Dog Training">Guide Dog Training</option>
                            <option value="Initial Training">Initial Training</option>
                            <option value="Puppy Raising">Puppy Raising</option>
                            <option value="Retired">Retired</option>
                            <option value="Training">Training</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <LookupInput
                            name="current_handler"
                            label="Current Handler"
                            value={form.dog_current_handler}
                            placeholder="Search for a handler..."
                            onSelect={(user) =>
                                setForm(prev => ({...prev, dog_current_handler: user ? user.name : null, }))}
                            searchFunc={searchUsers}
                            displayField="name"
                        />
                    </div>
                    <div className="form-row">
                        <label>General Notes</label>
                        <textarea
                            name="dog_general_notes"
                            value={form.dog_general_notes || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row checkbox-row">
                        <label>
                            <input
                                name="dog_is_active"
                                type="checkbox"
                                checked={!!form.dog_is_active}
                                onChange={handleChange}
                            />
                            Active
                        </label>
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={loading}>Create</button>
                        <button type="button" onClick={() => navigate("/dogs")}>Cancel</button>
                    </div>
                    {success && <div className="success-msg">Dog created successfully!</div>}
                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );
}