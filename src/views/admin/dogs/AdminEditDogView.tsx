import { useState } from "react";

import "./AdminCreateDogView.scss";
import type {Dog} from "../../../types/Dog.ts";
import IGDBForm, {type FormField} from "../../../components/form/IGDBForm.tsx";
import {useAuth} from "../../../state/hooks/useAuth.ts";
import {createDog, getDogById, updateDog} from "../../../partials/dog.ts";

export default function AdminEditDogView() {
    const [form, setForm] = useState<Partial<Dog>>({});
    const [message, setMessage] = useState<string|null >(null);
    const [isError, setIsError] = useState<boolean>(false);
    const {user} = useAuth();

    const handleSubmit = async (dog: Partial<Dog>) => {
        try {
            dog.dog_created_by = user?.id;
            await updateDog(form);
            setMessage(`This dog has successfully been updated.`);
            setIsError(false);
        } catch (error) {
            setMessage("Failed to update this dog. Please try again later.");
            setIsError(true);
        }
    }

    const dogFormFields: FormField[] = [
        {
            name: "dog_name",
            label: "Dog Name",
            type: "text",
            required: true,
        },
        {
            name: "dog_role",
            label: "Role",
            type: "select",
            options: ["Guide Dog", "Assistance Dog", "Community Ambassador Dog"],
            required: true,
        },
        {
            name: "dog_yob",
            label: "Year of Birth",
            type: "text",
            required: true,
        },
        {
            name: "dog_sex",
            label: "Sex",
            type: "select",
            options: ["male", "female", "unknown"],
            required: true,
        },
        {
            name: "dog_picture",
            label: "Picture URL",
            type: "text",
        },
        {
            name: "dog_status",
            label: "Status",
            type: "text",
        },
        {
            name: "dog_current_handler",
            label: "Current Handler",
            type: "user-select",
        },
        {
            name: "dog_general_notes",
            label: "General Notes",
            type: "textarea",
        },
        {
            name: "dog_is_archived",
            label: "Archived",
            type: "checkbox",
        }
    ];

    return (
        <div className="dog-create-view">
            <div className="dog-create-container">
                <h1>Add New Dog</h1>
                {message && (
                    <div className={"status-message-card " + (isError ? "error" : "success")}>
                        <h3>{isError ? "Failure" : "Success!"}</h3>
                        <p>{message}</p>
                    </div>
                )}
                <IGDBForm
                    form={form}
                    setForm={setForm}
                    fields={dogFormFields}
                    onSubmit={(dog) => handleSubmit(dog)}
                />
            </div>
        </div>
    );
}