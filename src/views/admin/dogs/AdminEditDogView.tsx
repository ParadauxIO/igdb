import { useState, useEffect } from "react";
import { useParams } from "react-router";
import type {Dog} from "../../../types/Dog.ts";
import IGDBForm, {type FormField} from "../../../components/form/IGDBForm.tsx";
import {useAuth} from "../../../state/hooks/useAuth.ts";
import {createDog, getDogById, updateDog} from "../../../partials/dog.ts";
import "./AdminEditDogView.scss";
import { uploadAndGetUrl } from "../../../partials/fileUpload.ts";
import StatusCard from "../../../components/general/StatusCard.tsx";

export default function AdminEditDogView() {
    const { dogId } = useParams<{ dogId?: string }>();
    const isEditMode = Boolean(dogId);

    const [form, setForm] = useState<Partial<Dog>>({});
    const [message, setMessage] = useState<string|null>(null);
    const [isError, setIsError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
    const {user} = useAuth();

    // Load existing dog data for edit mode
    useEffect(() => {
        if (isEditMode && dogId) {
            const loadDog = async () => {
                try {
                    setIsLoading(true);
                    const dog = await getDogById(dogId);
                    setForm(dog);
                } catch (error) {
                    setMessage("Failed to load dog data. Please try again later.");
                    setIsError(true);
                } finally {
                    setIsLoading(false);
                }
            };
            loadDog();
        }
    }, [dogId, isEditMode]);

    const handleSubmit = async (dog: Partial<Dog>) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
            dog.dog_created_by = user?.id;

            const photoFiles = (dog.dog_picture as File[] | undefined)?.filter(f => f instanceof File);

            if (photoFiles && photoFiles.length > 0) {
                const [uploadedUrl] = await uploadAndGetUrl(
                    photoFiles,
                    "sample",
                    "dogs"
                );
                dog.dog_picture = uploadedUrl;
            } else {
                // Optionally clear it or leave as is
                dog.dog_picture = undefined;
            }

            if (isEditMode) {
                await updateDog(dog);
                setMessage(`Dog has been successfully updated.`);
                setForm({}); // Clear form on successful submit
            } else {
                await createDog(dog);
                setMessage(`Dog has been successfully created.`);
                setForm({}); // Clear form on successful submit
            }

            setIsError(false);
        } catch (error) {
            console.error("Submit error:", error);
            const action = isEditMode ? "update" : "create";
            setMessage(`Failed to ${action} dog. Please try again later.`);
            setIsError(true);
        }
    };

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
            required: false,
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
            label: "Dog Photo",
            type: "file-upload",
            required: false,
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
            name: "dog_is_active",
            label: "Archived",
            type: "checkbox",
        }
    ];

    if (isLoading) {
        return (
            <div className="dog-create-view">
                <div className="dog-create-container">
                    <p>Loading dog data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dog-create-view">
            <div className="dog-create-container">
                <h1>{isEditMode ? "Edit Dog" : "Add New Dog"}</h1>
                <StatusCard message={message} isError={isError}/>
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