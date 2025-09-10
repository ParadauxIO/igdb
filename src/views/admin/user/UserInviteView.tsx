import { useState } from "react";
import { supabase } from "../../../state/supabaseClient.ts";
import StatusCard from "../../../components/general/StatusCard.tsx";
import IGDBForm, {type FormField} from "../../../components/form/IGDBForm.tsx";
import "./UserInviteView.scss";
type UserInvitation = {
    email: string;
    functional_role?: string;
}

/**
 * Sends an initial email invitation to the user to register and then edit their profile.
 * @returns
 */
export default function UserInviteView() {

    const [form, setForm] = useState<Partial<UserInvitation>>({});
    const [message, setMessage] = useState<string|null>(null);
    const [isError, setIsError] = useState<boolean>(false);

    const fields: FormField[] = [
        {name: 'email', label: 'Email Address', type: 'text', required: true},
        {name: 'functional_role', label: 'Functional Role', type: 'select', required: true, options: ['staff', 'volunteer', 'puppy raiser', 'trainer', 'temporary boarder', 'client', 'adoptive family', 'sponsor'], description: "This is a purely informational field that describes the user's role in the organisation."}
    ];

    const onSubmit = async (form: Partial<UserInvitation>) => {
        const { error } = await supabase.functions.invoke(
            'invite-user',
            {
                body: {
                    email: form.email,
                    functional_role: form.functional_role
                }
            }
        );
        if (error) {
            setIsError(true);
            setMessage("Failed to invite user.");
            console.error(error);
        } else {
            setIsError(false);
            setMessage("Successfully sent user invitation email.");
        }
    };

    return (
        <div className="user-invitation-view">
            <h1>Invite a user</h1>
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