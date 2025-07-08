import { useState } from "react";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router";
import type {DogUpdate} from "../types/DogUpdate";
import { supabase } from "../state/supabaseClient";
import "./PostUpdateView.scss";
import { useUserProfile } from "../hooks/useUserProfile";

const PostUpdateView = () => {

    const navigate = useNavigate();
    const {user} = useUserProfile(); // TODO: move it to context 
    const [form, setForm] = useState<Partial<DogUpdate>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    //TODO: Move this to a common type file
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
        const insertData: Partial<DogUpdate> = { ...form, update_created_by: user.id };

        const { error } = await supabase
            .from("dog_updates")
            .insert(insertData)
            .select();

        setLoading(false);
        if (error) {
            setError("Failed to post update.");
            console.error(error);
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/"), 1200);
        }
    };

    return (
            <div className="post-update-view">
                <NavBar/>
                <div className="post-update-container">
                <form className="post-update-form" onSubmit={handleSubmit}>
                    {success && <div className="success-msg"> Updated posted!</div>}
                    {error && <div className="error-msg">{error}</div>}
                    <div className="form-row">
                        <label>Dog Name</label>
                        <select
                            name="dog_id"
                            value={form.dog_id || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select a dog</option>
                            <option value="1a74d9b2-517a-4e7f-9c7f-d1b2c6b47d4a">Milo</option>
                            <option value="4a5aa72f-0102-4ec2-b76e-e0e9ecdd2a01">Max</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Title</label>
                        <input
                            name="update_title"
                            value={form.update_title || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Description</label>
                        <textarea
                            name="update_description"
                            value={form.update_description || ""}
                            onChange={handleChange}
                            placeholder="What's the update today?" 
                            rows={3} 
                        />
                    </div>
                    {/* <div className="form-row">
                        <label>Picture URL</label>
                        <input
                            name="update_media_urls"
                            value={form.update_media_urls || []}
                            onChange={handleChange}
                        />
                    </div> */}

                    <div className="form-actions">
                        <button type="submit" disabled={loading}>Post</button>
                        <button type="button" onClick={() => navigate("/")}>Cancel</button>
                    </div>
                </form>
                
                </div>
            </div>
    );
};

export default PostUpdateView;