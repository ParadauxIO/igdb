import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "../../state/supabaseClient.ts";
import type { User } from "../../types/User.ts";
import "./UserProfileView.scss";
import Header from "../../components/Header.tsx";

const SYSTEM_FIELDS = [
    "created_at",
    "updated_at"
];

export default function UserProfileView() {
    const { initialUserId } = useParams<{ userId: string }>();
    const [userId, setUserId] = useState(initialUserId);
    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<User>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);

    useEffect(() => {
        async function loadUser() {
            if (!userId) {
                const {data: {user}} = await supabase.auth.getUser();
                setUserId(user.id);
                return;
            }
            console.log(userId);

            setLoading(true);

            const {data} = await supabase.from("users")
                .select("*")
                .eq("id", userId)
                .single();

            setForm(data);
            setLoading(false);
        }
        loadUser();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const updateData: Partial<User> = { ...form };
        SYSTEM_FIELDS.forEach(f => delete updateData[f as keyof User]);

        const { error } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", userId);

        if (password) {
            const { error: passwordError } = await supabase.auth.updateUser({
                password: password
            });
            if (passwordError) {
                setError("Failed to update password.", passwordError);
            }
        }

        setLoading(false);
        if (error) {
            setError("Failed to update user.");
        } else {
            setSuccess(true);
            // setTimeout(() => navigate("/"), 3000);
        }
    };

    const handleChange = (e: ChangeEvent) => {
        const { name, value, type, checked }: ChangeEventValues = e.target;
        let val: any = value;
        if (type === "checkbox") val = checked;
        if (type === "number") val = value === "" ? null : Number(value);
        setForm(f => ({ ...f, [name]: val }));
    };

    if (loading) return <div className="dog-edit-view">Loading...</div>;
    if (error) return <div className="dog-edit-view error">{error}</div>;
    if (!form) return null;

    return (
        <div className="dog-edit-view">
            <div className="dog-edit-container">
                <h1>Edit User: {form.name}</h1>
                <form className="dog-edit-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label className="required-label">Name</label>
                        <input
                            name="name"
                            value={form.name || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label className="required-label">Phone</label>
                        <input
                            name="phone"
                            value={form.phone || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label className="required-label">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label>
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                            />
                            Show Password
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading}>Save</button>
                        <button type="button" onClick={() => navigate("/dogs")}>Cancel</button>
                    </div>
                    {success && <div className="success-msg">User updated!</div>}
                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );
}
