import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../state/supabaseClient.ts";

type InvitedUser = {
    email: string;
    functional_role?: string;
}

/**
 * Sends an initial email invitation to the user to register and then edit their profile.
 * @returns
 */
export default function UserInviteView() {

    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<InvitedUser>>({});
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

        const { error } = await supabase.functions.invoke(
            'invite-user',
            {
                body: {
                    email: form.email,
                    functional_role: form.functional_role
                }
            }
        );
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
            <div className="user-create-container">
                <h1>Invite New User</h1>
                <h2>Just need their email. they fill out the rest.</h2>
                <form className="user-create-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>Email Address</label>
                        <input
                            name="email"
                            value={form.email || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Functional Role - make as a dropdown.</label>
                        <input
                            name="functional_role"
                            value={form.functional_role || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={loading}>Send Invite</button>
                        <button type="button" onClick={() => navigate("/users")}>Cancel</button>
                    </div>
                    {success && <div className="success-msg">User invitation sent successfully!</div>}
                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );

}