import { useState } from "react";
import { supabase } from "../../state/supabaseClient.ts";
import type { User } from "../../types/User.ts";
import "./UserProfileView.scss";
import { useAuth } from "../../state/hooks/useAuth.ts";
import IGDBForm, { type FormField } from "../../components/form/IGDBForm.tsx";
import StatusCard from "../../components/general/StatusCard.tsx";

type ProfileForm = Partial<User> & {
    password?: string;
    confirm_password?: string;
};

export default function UserProfileView() {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);

    if (!user) {
        return <div className="user-profile-view error">You must be logged in to view this page.</div>;
    }

    const [form, setForm] = useState<ProfileForm>({
        name: user.name,
        phone: user.phone,
    });


    const fields: FormField[] = [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "phone", label: "Phone Number", type: "text", required: true },
        { name: "password", label: "New Password", description: "Password must contain at least 8 characters.", type: "password", required: false },
        { name: "confirm_password", label: "Confirm New Password", type: "password", required: false },
    ];

    const onSubmit = async (update: ProfileForm) => {
        setLoading(true);
        setIsError(false);
        setMessage(null);

        try {
            if (update.password && update.password !== update.confirm_password) {
                setIsError(true);
                setMessage("Passwords do not match.");
                return;
            }

            if (update.password && update.password.length < 8) {
                setIsError(true);
                setMessage("Password must contain at least 8 characters.")
                return;
            }

            const { data, error } = await supabase.functions.invoke("update-user", {
                body: {
                    type: "update",
                    name: update.name || "",
                    phone: update.phone || "",
                    password: update.password || undefined,
                }
            });

            if (error) {
                setIsError(true);
                // Bubble up server message if present, else map common statuses
                const serverMsg = (data as any)?.error || (error as any)?.message;
                if (error.status === 401) setMessage(serverMsg ?? "You need to be signed in.");
                else if (error.status === 403) setMessage(serverMsg ?? "Origin not allowed.");
                else if (error.status === 405) setMessage(serverMsg ?? "Method not allowed.");
                else setMessage(serverMsg ?? "Failed to update your profile. Please try again later.");
                return;
            }

            // Clear password fields locally after success
            setForm((prev) => ({ ...prev, password: undefined, confirm_password: undefined }));
            setMessage("Your profile has been updated successfully.");
            await refreshProfile();
        } catch (e) {
            console.error(e);
            setIsError(true);
            setMessage("Unexpected error updating your profile.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="user-profile-view">Saving…</div>;

    return (
        <div className="user-profile-view">
            <h1>Your Profile</h1>
            <StatusCard message={message} isError={isError} />
            <IGDBForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={(update) => onSubmit(update as ProfileForm)}
            />
        </div>
    );
}
