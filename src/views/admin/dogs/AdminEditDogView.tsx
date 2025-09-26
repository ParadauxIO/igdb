import { useState, useEffect } from "react";
import { useParams } from "react-router";
import type {Dog} from "../../../types/Dog.ts";
import IGDBForm, {type FormField} from "../../../components/form/IGDBForm.tsx";
import {useAuth} from "../../../state/hooks/useAuth.ts";
import {createDog, getDogById, updateDog} from "../../../partials/dog.ts";
import "./AdminEditDogView.scss";
import { uploadDogAvatar } from "../../../partials/fileUpload.ts";
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

    function isFile(value: unknown): value is File {
        return typeof File !== "undefined" && value instanceof File;
    }

    function extractAvatarFile(picture: unknown): File | null {
        if (!picture) return null;
        if (Array.isArray(picture)) return picture.find(isFile) ?? null;
        return isFile(picture) ? picture : null;
    }

    const handleSubmit = async (dog: Partial<Dog>) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            // always stamp creator if available
            dog.dog_created_by = user?.id;

            // pull out any file (don’t pass File objects to Supabase .update/.insert)
            const avatarFile = extractAvatarFile(dog.dog_picture);

            // if they passed a string URL, keep it; otherwise strip before writes
            const preexistingUrl = typeof dog.dog_picture === "string" ? dog.dog_picture : undefined;

            if (isEditMode && dogId) {
                // EDIT: if there’s a new file, upload first so the single update includes URL
                let pictureUrl = preexistingUrl;

                if (avatarFile) {
                    pictureUrl = await uploadDogAvatar(avatarFile, dogId);
                }

                await updateDog({
                    ...dog,
                    dog_id: dogId,
                    dog_picture: pictureUrl, // undefined clears, string sets
                });

                setMessage("Dog has been successfully updated.");
            } else {
                // CREATE: first create without picture
                const created = await createDog({
                    ...dog,
                    dog_picture: undefined, // ensure no file sneaks in
                });

                // Expect createDog to return the row incl. dog_id.
                const newId = (created as Dog)?.dog_id;
                if (!newId) throw new Error("createDog did not return a dog_id");

                // If user uploaded an image, upload then patch just the picture
                if (avatarFile) {
                    const url = await uploadDogAvatar(avatarFile, newId);
                    await updateDog({ dog_id: newId, dog_picture: url });
                } else if (preexistingUrl) {
                    // Edge case: they somehow provided a URL at create time
                    await updateDog({ dog_id: newId, dog_picture: preexistingUrl });
                }

                setMessage("Dog has been successfully created.");
            }

            setForm({});
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
            options: ["Male", "Female"],
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
            name: "dog_current_handlers",
            label: "Current Handler(s)",
            type: "user-multi-select",
        },
        {
            name: "dog_general_notes",
            label: "General Notes",
            type: "textarea",
        },
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