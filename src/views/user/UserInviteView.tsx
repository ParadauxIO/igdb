import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../state/supabaseClient.ts";
import type { User } from "../../types/User.ts";
//import "./UserCreateView.scss";
import Header from "../../components/Header.tsx";

// Define system fields that should not be manually set during creation
const SYSTEM_FIELDS = [
    "user_id",
    "createdAt",
    "updatedAt",
    //"user_created_by",
    //"user_last_edited_by"
];

/**
 * Sends an initial email invitation to the user to register and then edit their profile.
 * @returns
 */
export default function UserInviteView() {

    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<User>>({});
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

        //console.log(form.email);
        // i think this is how we need to send an email invite
        // reference: https://supabase.com/docs/reference/javascript/auth-admin-generatelink
        // https://github.com/J0/supabase_auth_testing_app/blob/d6a9336a8abcdb7c58289f5b8982702f2c35c5bb/app/admin/page.tsx#L38
        const { data, error } = await supabase.functions.invoke(
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
            console.log(data);
            setTimeout(() => navigate("/users"), 1200);
        }
    };

    return (
        <div className="user-create-view">
            <Header/>
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