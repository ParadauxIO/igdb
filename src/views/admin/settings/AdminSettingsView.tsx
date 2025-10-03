import {useEffect, useState} from "react";
import "./AdminSettingsView.scss";
import IGDBForm, {type FormField} from "../../../components/form/IGDBForm.tsx";
import {getSetting, updateSetting} from "../../../partials/settings.ts";
import StatusCard from "../../../components/general/StatusCard.tsx";

interface SettingsForm {
    terms: string;
    postCharacterLimit: string | number;
    titleCharacterLimit: string | number;
    notificationPeriodDays: string | number;
}

export default function AdminDashboardView() {
    const [form, setForm] = useState<Partial<SettingsForm>>({});
    const [message, setMessage] = useState<string>("");
    const [isError, setIsError] = useState<boolean>(false);

    const settingsFields: FormField[] = [
        {
            name: "terms",
            label: "Terms & Conditions",
            description: "This is shown to users when they are setting their password for the first time.",
            type: "textarea",
            required: false
        },
        {
            name: "postCharacterLimit",
            label: "Post Character Limit",
            description: "Maximum number of characters allowed in a post.",
            type: "number",
            required: false
        },
        {
            name: "titleCharacterLimit",
            label: "Title Character Limit",
            description: "Maximum number of characters allowed in a post title.",
            type: "number", //TODO: integer
            required: false
        },
        {
            name: "notificationPeriodDays",
            label: "Notification Period in Days",
            description: "Number of days that need to lapse before reminding a user to post about their dog(s)",
            type: "number", //TODO: integer
            required: false
        },
    ];

        async function load() {
            const [returnedTerms, returnedPostCharLimit, returnedTitleCharLimit, returnedNotifDays] = await Promise.all([
                getSetting("terms"),
                getSetting("postCharacterLimit"),
                getSetting("titleCharacterLimit"),
                getSetting("notificationPeriodDays")
            ]);
    
            if (returnedTerms) {
                setForm(prev => ({
                ...prev,
                terms: returnedTerms}))
            };
            if (returnedPostCharLimit) {
                setForm(prev => ({
                ...prev,
                postCharacterLimit: returnedPostCharLimit}))
            };
            if (returnedTitleCharLimit) {
                setForm(prev => ({
                ...prev,
                titleCharacterLimit: returnedTitleCharLimit}))
            };
            if (returnedNotifDays) {
                setForm(prev => ({
                ...prev,
                notificationPeriodDays: returnedNotifDays}))
            };
        }

    useEffect(() => {
        load();
    }, []);

    const onFormSubmit = async (returnedForm: Partial<SettingsForm>) => {
        try {
            if (returnedForm.terms != null) {
                await updateSetting("terms", returnedForm.terms);
            }

            if (returnedForm.postCharacterLimit != null) {
                await updateSetting("postCharacterLimit", String(returnedForm.postCharacterLimit));
            }

            if (returnedForm.titleCharacterLimit != null) {
                await updateSetting("titleCharacterLimit", String(returnedForm.titleCharacterLimit));
            }

            setMessage("Settings updated successfully");
            setIsError(false);
        } catch (e) {
            setMessage("An error occurred while updating the settings.");
            setIsError(true);
            console.log(e);
        }
    }

        return (
        <div className="admin-dashboard">
            <div className="admin-settings">
                <h1>System Settings</h1>
                <p>Here you can configure the overall system.</p>
                <StatusCard message={message} isError={isError}/>
                <IGDBForm
                    form={form}
                    setForm={setForm}
                    fields={settingsFields}
                    onSubmit={onFormSubmit}
                />
            </div>
        </div>
    );
}