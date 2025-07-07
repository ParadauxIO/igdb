import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "../state/supabaseClient";
import type { Dog } from "../types/Dog";
import "./DogEditView.scss";
import NavBar from "../components/NavBar.tsx";

const SYSTEM_FIELDS = [
    "dog_created_at",
    "dog_updated_at",
    "dog_created_by",
    "dog_last_edited_by"
];

export default function DogEditView() {
    const { dogId } = useParams<{ dogId: string }>();
    const navigate = useNavigate();
    const [dog, setDog] = useState<Dog | null>(null);
    const [form, setForm] = useState<Partial<Dog>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!dogId) return;
        setLoading(true);
        supabase
            .from("dogs")
            .select("*")
            .eq("dog_id", dogId)
            .single()
            .then(({ data, error }) => {
                if (error || !data) {
                    setError("Dog not found.");
                } else {
                    setDog(data);
                    setForm(data);
                }
                setLoading(false);
            });
    }, [dogId]);

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
        const updateData: Partial<Dog> = { ...form };
        SYSTEM_FIELDS.forEach(f => delete updateData[f as keyof Dog]);

        const { error } = await supabase
            .from("dogs")
            .update(updateData)
            .eq("dog_id", dogId);

        setLoading(false);
        if (error) {
            setError("Failed to update dog.");
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/dogs"), 1200);
        }
    };

    if (loading && !dog) return <div className="dog-edit-view">Loading...</div>;
    if (error) return <div className="dog-edit-view error">{error}</div>;
    if (!dog) return null;

    return (
        <div className="dog-edit-view">
            <NavBar/>
            <div className="dog-edit-container">
                <h1>Edit Dog: {dog.dog_name}</h1>
                <form className="dog-edit-form" onSubmit={handleSubmit}>
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
                        <label>Role</label>
                        <select
                            name="dog_role"
                            value={form.dog_role || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="Guide Dog">Guide Dog</option>
                            <option value="Assistance Dog">Assistance Dog</option>
                            <option value="Community Ambassador Dog">Community Ambassador Dog</option>
                        </select>
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
                        <label>Picture URL</label>
                        <input
                            name="dog_picture"
                            value={form.dog_picture || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="picture-preview">
                        <label>Picture Preview</label>
                        <img src={form.dog_picture ?? ""} alt="Picture Preview of Dog"/>
                    </div>
                    <div className="form-row">
                        <label>Status</label>
                        <input
                            name="dog_status"
                            value={form.dog_status || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-row">
                        <label>Current Owner</label>
                        <input
                            name="dog_current_owner"
                            value={form.dog_current_handler || ""}
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
                        <button type="submit" disabled={loading}>Save</button>
                        <button type="button" onClick={() => navigate("/dogs")}>Cancel</button>
                    </div>
                    {success && <div className="success-msg">Dog updated!</div>}
                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );
}
