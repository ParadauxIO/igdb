import {supabase} from "../../state/supabaseClient.ts";
import IGDBForm, {type FormField} from "../../components/form/IGDBForm.tsx";
import TermsAndConditions from "../../components/onboarding/TermsAndConditions.tsx";
import {useState} from "react";
import StatusCard from "../../components/general/StatusCard.tsx";
import "./OnboardingView.scss";

type OnboardingForm = {
    name: string;
    phone: string;
    password?: string;
    confirm_password?: string;
    terms_accepted: boolean;
}

export default function OnboardingView() {
    const [form, setForm] = useState<Partial<OnboardingForm>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);

    const fields: FormField[] = [
        {name: 'name', label: 'Name', type: 'text', required: true},
        {name: 'phone', label: 'Phone Number', type: 'text', required: false},
        {name: 'password', label: 'Password', type: 'password', description: "Password must contain at least 8 characters.", required: true},
        {name: 'confirm_password', label: 'Confirm Password', type: 'password', required: true},
        {name: "Terms and Conditions", label: "You must accept our terms and conditions to finish creating your account", type: 'component', component: TermsAndConditions},
        {name: 'terms_accepted', label: 'I accept the terms and conditions', type: 'checkbox', required: true, description: "You must accept our terms and conditions to finish creating your account."}
    ];

    const onSubmit = async (form: Partial<OnboardingForm>) => {
        setIsError(false);
        setMessage(null);

        if (form.password !== form.confirm_password) {
            setIsError(true);
            setMessage("Passwords do not match.");
            return;
        }

        if (form.password && form.password?.length < 8) {
            setIsError(true);
            setMessage("Password must contain at least 8 characters.")
            return;
        }

        if (!form.terms_accepted) {
            setIsError(true);
            setMessage("You must accept the terms and conditions to continue.");
            return;
        }

        const { data, error } = await supabase.functions.invoke('update-user', {
            body: {
                type: "onboard",
                name: form.name,
                phone: form.phone,
                password: form.password || undefined,
            }
        });

        if (error) {
            setIsError(true);
            if (error.status === 409) {
                setMessage("You’ve already completed onboarding.");
            } else if (error.status === 401) {
                setMessage("You need to be signed in to finish onboarding.");
            } else {
                // fall back to server-provided message if present
                const serverMsg = (error as any)?.message || (data as any)?.error;
                setMessage(serverMsg ?? "Failed to finish onboarding. Please try again later.");
            }
            console.error(error);
            return;
        }

        setIsError(false);
        setMessage("Successfully onboarded. You can continue to the app.");
        // Sign them out and bring them to the login page.
        supabase.auth.signOut().then(() => window.location.href = "/");
    };


    return (
        <div className="onboarding-view">
            <h1>Finish creating your account...</h1>
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