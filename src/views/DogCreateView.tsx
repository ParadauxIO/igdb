import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../state/supabaseClient";
import type { Dog } from "../types/Dog";
import "./DogCreateView.scss";
import NavBar from "../components/NavBar.tsx";

// Define system fields that should not be manually set during creation
const SYSTEM_FIELDS = [
    "dog_id",
    "dog_created_at",
    "dog_updated_at",
    "dog_created_by",
    "dog_last_edited_by"
];

export default function DogCreateView() {
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
            <NavBar/>
            <div className="dog-create-container">
                <h1>Add New Dog</h1>
                <form className="dog-create-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>Name</label>
                        <input
                            name="dog_name"
                            value={form.dog_name || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Microchip Number</label>
                        <input
                            name="dog_microchip_number"
                            value={form.dog_microchip_number || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Breed</label>
                        <input
                            name="dog_breed"
                            value={form.dog_breed || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Role</label>
                        <input
                            name="dog_role"
                            value={form.dog_role || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Date of Birth</label>
                        <input
                            name="dog_dob"
                            type="date"
                            value={form.dog_dob ? form.dog_dob.substring(0, 10) : ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Sex</label>
                        <select
                            name="dog_sex"
                            value={form.dog_sex || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Color/Markings</label>
                        <input
                            name="dog_color_markings"
                            value={form.dog_color_markings || ""}
                            onChange={handleChange}
                        />
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
                        <input
                            name="dog_status"
                            value={form.dog_status || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Weight (kg)</label>
                        <input
                            name="dog_weight_kg"
                            type="number"
                            step="0.1"
                            value={form.dog_weight_kg ?? ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Current Owner</label>{ /* TODO: REMOVE DEFAULT VALUE */ }
                        <input
                            name="dog_current_owner"
                            value={form.dog_current_owner || "d9018bea-6537-443c-a61c-779e2db58a92"}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Initial Owner</label>
                        <input
                            name="dog_initial_owner"
                            value={form.dog_initial_owner || "d9018bea-6537-443c-a61c-779e2db58a92"}
                            onChange={handleChange}
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
                    <div className="form-row">
                        <label>Medical Notes</label>
                        <textarea
                            name="dog_medical_notes"
                            value={form.dog_medical_notes || ""}
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