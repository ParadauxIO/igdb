import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type {DogUpdate} from "../../types/DogUpdate";
import { supabase } from "../../state/supabaseClient";
import "./PostUpdateView.scss";
import {useAuth} from "../../state/hooks/useAuth.ts";

const PostUpdateView = () => {

    const navigate = useNavigate();
    const {user} = useAuth();
    const [form, setForm] = useState<Partial<DogUpdate>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [userDogs, setUserDogs] = useState<{ dog_id: string; dog_name: string }[]>([]);
    const [dogsLoading, setDogsLoading] = useState(false);
    const [dogsError, setDogsError] = useState<string | null>(null);

    if (!user) return <></>;

    useEffect(() => {
        const fetchDogs = async () => {
            setDogsLoading(true);
            setDogsError(null);

            const { data, error } = await supabase
                .from("dogs")
                .select("dog_id, dog_name")
                .eq("dog_current_handler", user.id)
                .eq("dog_is_active", true);

            if (error) {
                console.error("Error fetching dogs for user:", error);
                setDogsError("Could not load your dogs.");
            } else {
                setUserDogs(data ?? []);
            }
            setDogsLoading(false);
        };
        fetchDogs();
    }, [user]);

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
                <div className="post-update-container">
                <form className="post-update-form" onSubmit={handleSubmit}>
                    {success && <div className="success-msg"> Updated posted!</div>}
                    {error && <div className="error-msg">{error}</div>}
                    <div className="form-row">
                        <label className="required-label">Dog Name</label>
                        <select
                            name="dog_id"
                            value={form.dog_id || ""}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a dog</option>
                            {dogsLoading && <option disabled>Loading...</option>}
                            {dogsError && <option disabled>{dogsError}</option>}
                            {!dogsLoading && !dogsError && userDogs.length === 0 && (
                                <option disabled>No dogs assigned to you.</option>
                            )}
                            {userDogs.map((dog) => (
                                <option key={dog.dog_id} value={dog.dog_id}>
                                    {dog.dog_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <label className="required-label">Title</label>
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