import Card from "../../components/info/Card.tsx";
import {useEffect, useState} from "react";
import {getDogsWithNames} from "../../partials/dog.ts";
import type {Dog} from "../../types/Dog.ts";
import "./AdminDashboardView.scss";
import ApprovalQueue from "../../components/admin/ApprovalQueue.tsx";
import type {DogUpdate} from "../../types/DogUpdate.ts";
import {getApprovalQueue} from "../../partials/update.ts";
import type {User} from "../../types/User.ts";
import {getUsers} from "../../partials/users.ts";
import IGDBForm, {type FormField} from "../../components/form/IGDBForm.tsx";
import {fetchTerms, updateSetting} from "../../partials/settings.ts";
import StatusCard from "../../components/general/StatusCard.tsx";

interface SettingsForm {
    terms: string;
}

export default function AdminDashboardView() {
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [approvalQueue, setApprovalQueue] = useState<DogUpdate[]>([]);
    const [users, setUsers] = useState<User[]>([]);
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
    ];

    async function load() {
        const [returnedDogs, returnedApprovalQueue, returnedUsers, returnedTerms] = await Promise.all([
            getDogsWithNames(),
            getApprovalQueue(false),
            getUsers(),
            fetchTerms()
        ]);

        if (returnedDogs) setDogs(returnedDogs);
        if (returnedApprovalQueue) setApprovalQueue(returnedApprovalQueue);
        if (returnedUsers) setUsers(returnedUsers);
        if (returnedTerms) setForm(prev => ({...prev, terms: returnedTerms}));
    }

    useEffect(() => {
        load();
    }, []);

    const onFormSubmit = async (returnedForm: Partial<SettingsForm>) => {
        try {
            if (returnedForm.terms != null) {
                await updateSetting("terms", returnedForm.terms);
            }
            setMessage("Settings updated successfully");
            setIsError(false);
        } catch (e) {
            setMessage("An error occurred while updating the settings.");
            setIsError(true);
        }
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <div className="dog-cards">
                <Card title="Approvals Pending" value={approvalQueue.length}/>
                <Card title="Total Dogs" value={dogs.length}/>
                <Card title="Total Users" value={users.length}/>
            </div>

            <div className="approval-queue">
                <h1> Approval Queue</h1>
                <ApprovalQueue/>
            </div>

            <div className="admin-settings">
                <h1> System Settings </h1>
                <p> Here you can configure the overall system. </p>
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