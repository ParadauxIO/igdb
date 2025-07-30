import { useState } from "react";
import { useNavigate } from "react-router";

import "./AdminCreateDogView.scss";
import type {Dog} from "../../../types/Dog.ts";
import IGDBForm, {type FormField} from "../../../components/form/IGDBForm.tsx";

export default function AdminCreateDogView() {
    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<Dog>>({
        dog_is_archived: true,
    });

    // const [loading, setLoading] = useState(false);
    // const [error, setError] = useState<string | null>(null);
    // const [success, setSuccess] = useState(false);
    // const { user } = useAuth();

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
            type: "user-select", // custom type for user picker
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
                <IGDBForm
                    form={form}
                    setForm={setForm}
                    fields={dogFormFields}/>
            </div>
        </div>
    );
}