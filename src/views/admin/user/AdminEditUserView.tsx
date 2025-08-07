import StatusCard from "../../../components/general/StatusCard.tsx";
import IGDBForm, {type FormField} from "../../../components/form/IGDBForm.tsx";
import {useParams} from "react-router";
import {useState, useEffect} from "react";
import type {User} from "../../../types/User.ts";
import {getUserById} from "../../../partials/users.ts";
import {supabase} from "../../../state/supabaseClient.ts";

export default function AdminEditUserView() {
    const {userId} = useParams();

    const [form, setForm] = useState<Partial<User>>({});
    const [message, setMessage] = useState<string|null >(null);
    const [isError, setIsError] = useState<boolean>(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) {
                setMessage("User ID is required");
                setIsError(true);
                return;
            }

            try {
                const user = await getUserById(userId);
                setForm(user);
            } catch (err) {
                setMessage("Failed to load user");
                setIsError(true);
            }
        };

        fetchUser();
    }, [userId]);

    const fields: FormField[] = [
        {name: 'name', label: 'Full Name', type: 'text', required: true},
        {name: 'permission_role', label: 'Permission Role', type: 'select', required: true, options: ['viewer', 'admin', 'updater'], description: "This determines the level of access the user has."},
        {name: 'functional_role', label: 'Functional Role', type: 'select', required: true, options: ['staff', 'volunteer', 'puppy raiser', 'trainer', 'temporary boarder', 'client', 'adoptive family', 'sponsor'], description: "This is a purely informational field that describes the user's role in the organisation."},
        {name: 'phone', label: 'Phone Number', type: 'text', required: true},
        {name: 'is_archived', label: 'Archived', type: 'checkbox', description: 'Check if this user is archived'},
        {name: 'can_approve_updates', label: 'Can Approve Updates', type: 'checkbox', description: 'Check if this user can approve update requests'},
    ];

    const onSubmit = async (form: Partial<User>) => {
        console.log(form);
        const { error } = await supabase
            .from("users")
            .update(form)
            .eq("id", userId);

        if (error) {
            setIsError(true);
            setMessage("Failed to update user: " + error.message);
            return;
        }

        setIsError(false);
        setMessage("Successfully updated user.");
    }

    return (
        <div className="user-profile-view">
            <h1>Edit User</h1>
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