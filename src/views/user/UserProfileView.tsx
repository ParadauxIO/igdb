import { useState } from "react";
import { supabase } from "../../state/supabaseClient.ts";
import type { User } from "../../types/User.ts";
import "./UserProfileView.scss";
import {useAuth} from "../../state/hooks/useAuth.ts";
import IGDBForm, {type FormField} from "../../components/form/IGDBForm.tsx";
import StatusCard from "../../components/general/StatusCard.tsx";

export default function UserProfileView() {
    const {user} = useAuth();
    if (!user) {
        return <div className="user-profile-view error">You must be logged in to view this page.</div>;
    }

    const [form, setForm] = useState<Partial<User>>(user);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string|null >(null);
    const [isError, setIsError] = useState<boolean>(false);

    const fields: FormField[] = [
        {name: 'name', label: 'Name', type: 'text', required: true},
        {name: 'phone', label: 'Phone Number', type: 'text', required: true},
        {name: 'password', label: 'Password', type: 'password', required: false},
        {name: 'confirm_password', label: 'Confirm Password', type: 'password', required: false}
    ]

    const onSubmit = async (form: Partial<User>) => {
        setLoading(true);
        setIsError(false);
        setMessage(null);

        if (!form) {
            setLoading(false);
            return;
        }

        if (form.password && (form.password !== form.confirm_password)) {
            setIsError(true);
            setMessage("Passwords do not match.");
            setLoading(false);
            return;
        }

        const updateData: Partial<User> = { ...form };

        if (form.password) {
            const { error: passwordError } = await supabase.auth.updateUser({
                password: form.password
            });

            if (passwordError) {
                setIsError(true);
                setMessage("Failed to update password: " + passwordError);
            }
        }

        updateData.password = undefined;
        updateData.confirm_password = undefined;

        const { error } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", user.id);

        setLoading(false);
        if (error) {
            setIsError(true);
            setMessage("Failed to update your profile. Please try again later.");
        } else {
            setMessage("Your profile has been updated successfully.");
        }
    };

    if (loading) return <div className="dog-edit-view">Loading...</div>;

    return (
        <div className="user-profile-view">
            <h1>Your Profile</h1>
            <StatusCard message={message} isError={isError} />
            <IGDBForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={(update) => onSubmit(update)}
            />
        </div>
    );
}
