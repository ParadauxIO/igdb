import {useEffect, useState} from "react";
import type {User} from "../../types/User.ts";
import "./IGDBForm.scss"
import {getUsers} from "../../partials/users.ts";
import {type DogSearchResult, getUserDogs} from "../../partials/dog.ts";
import SearchDropdown from "./SearchDropdown.tsx";
import {useAuth} from "../../state/hooks/useAuth.ts";
import MediaUploader from "./MediaUploader";
import SearchMultiSelect from "./SearchMultiSelect.tsx";

export const formFieldTypes = [
    "text",
    "textarea",
    "password",
    "select",
    "checkbox",
    "datetime",
    "user-select",
    "dog-select",
    "file-upload",
    "component",
    "multi-select",
    "user-multi-select",
    "dog-multi-select",
] as const;

export type FormFieldType = typeof formFieldTypes[number];
export type FormField = {
    name: string;
    label: string;
    type: FormFieldType;
    description?: string;
    required?: boolean;
    component?: React.ComponentType<any>;
    options?: string[];
};

interface IGDBFormProps<T> {
    form: Partial<T>;
    setForm: (f: Partial<T>) => void;
    fields: FormField[];
    onSubmit: (form: Partial<T>) => void;
}

export default function IGDBForm<T>({form, setForm, fields, onSubmit}: IGDBFormProps<T>) {
    const [users, setUsers] = useState<User[]>([]);
    const [userDogs, setUserDogs] = useState<DogSearchResult[]>([]);
    const {user} = useAuth();
    const hasUserSelect = fields.some(field => field.type === 'user-select' || field.type === 'user-multi-select');
    const hasDogSelect = fields.some(field => field.type === 'dog-select' || field.type === 'dog-multi-select');

    useEffect(() => {
        if (!user) return;
        if (hasUserSelect) {
            getUsers()
                .then(users => {
                    setUsers(users);
                })
                .catch(err => {
                    console.error("Error fetching users:", err);
                });
        }

        if (hasDogSelect) {
            getUserDogs(user.id)
                .then(dogs => {
                    setUserDogs(dogs);
                })
                .catch(err => {
                    console.error("Error fetching dogs:", err);
                });
        }
    }, [user]);

    const handleChange = (name: string, value: any) => {
        setForm({
            ...form,
            [name]: value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <form className="igdb-form" onSubmit={handleSubmit}>
            {fields.map(field => {
                const value = form[field.name as keyof T] as string | number | readonly string[] | undefined;

                switch (field.type) {
                    case 'text':
                    case 'password':
                        return (
                            <div key={field.name} className="text-input form-input">
                                <label className={`font-semibold ${field.required ? 'required' : ''}`}>
                                    {field.label}
                                </label>
                                {field.description && <p className="description"> {field.description} </p>}
                                <input
                                    type={field.type}
                                    name={field.name}
                                    required={field.required}
                                    value={value || ''}
                                    onChange={e => handleChange(field.name, e.target.value)}
                                    className="border p-2 rounded"
                                />
                            </div>
                        );

                    case 'select':
                        return (
                            <div key={field.name} className="select-input form-input">
                                <label className={`font-semibold ${field.required ? 'required' : ''}`}>
                                    {field.label}
                                </label>
                                {field.description && <p className="description"> {field.description} </p>}
                                <select
                                    name={field.name}
                                    required={field.required}
                                    value={value || ''}
                                    onChange={e => handleChange(field.name, e.target.value)}
                                    className="border p-2 rounded"
                                >
                                    <option value="" disabled>Select...</option>
                                    {field.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        );

                    case 'checkbox':
                        return (
                            <div key={field.name} className="form-input">
                                <div className="checkbox-input form-input">
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        checked={Boolean(value)}
                                        onChange={e => handleChange(field.name, e.target.checked)}
                                    />
                                    <label className={`font-semibold ${field.required ? 'required' : ''}`}>
                                        {field.label}
                                    </label>
                                </div>
                                {field.description && <p className="description"> {field.description} </p>}
                            </div>
                        );

                    case 'datetime':
                        return (
                            <div key={field.name} className="datetime-input form-input">
                                <label className={`font-semibold ${field.required ? 'required' : ''}`}>
                                    {field.label}
                                </label>
                                <input
                                    type="datetime-local"
                                    name={field.name}
                                    required={field.required}
                                    value={value ? new Date(value as string).toISOString().slice(0, 16) : ''}
                                    onChange={e => handleChange(field.name, new Date(e.target.value))}
                                    className="border p-2 rounded"
                                />
                            </div>
                        );

                    case 'user-select':
                        return (
                            <SearchDropdown
                                label={field.label}
                                name={field.name}
                                value={form[field.name as keyof T] as string | undefined}
                                required={field.required}
                                fetchOptions={async () =>
                                    users.map((user) => ({
                                        label: user.name ?? "(No name)",
                                        value: user.id,
                                    }))
                                }
                                onChange={(e) => handleChange(field.name, e.target.value)}
                            />
                        );
                    case 'textarea':
                        return (
                            <div key={field.name} className="text-input form-input">
                                <label className="font-semibold">{field.label}</label>
                                {field.description && <p className="description"> {field.description} </p>}
                                <textarea
                                    name={field.name}
                                    required={field.required}
                                    value={value || ''}
                                    onChange={e => handleChange(field.name, e.target.value)}
                                    className="border p-2 rounded"
                                    rows={10}
                                />
                            </div>
                        )

                    case 'dog-select':
                        return (
                            <SearchDropdown
                                label={field.label}
                                name={field.name}
                                value={form[field.name as keyof T] as string | undefined}
                                required={field.required}
                                fetchOptions={async () =>
                                    userDogs.map(dog => ({
                                        label: dog.dog_name ?? "(Unnamed dog)",
                                        value: dog.dog_id,
                                    }))
                                }
                                onChange={(e) => handleChange(field.name, e.target.value)}
                            />
                        );

                    case 'file-upload': {
                        const filesValue = form[field.name as keyof T] as unknown as File[] | null | undefined;

                        return (
                            <div key={field.name} className="file-input form-input">
                                <label className="font-semibold">{field.label}</label>
                                <MediaUploader
                                    label={field.label}
                                    name={field.name}
                                    value={filesValue ?? null}
                                    required={field.required}
                                    onChange={(files: File[]) => handleChange(field.name, files)}
                                />
                            </div>
                        );
                    }

                    case 'component':
                        return field.component ? (
                            <div key={field.name} className="">
                                <field.component/>
                            </div>
                        ) : null;

                    case 'multi-select': {
                        const arrayValue = (form[field.name as keyof T] as unknown as string[] | undefined) ?? [];
                        return (
                            <div key={field.name} className="form-input">
                                <SearchMultiSelect
                                    label={field.label}
                                    name={field.name}
                                    values={arrayValue}
                                    required={field.required}
                                    fetchOptions={async () => {
                                        // If you want static options via field.options:
                                        if (field.options && field.options.length) {
                                            return field.options.map(o => ({label: o, value: o}));
                                        }
                                        // Otherwise throw to force caller to pass a custom component,
                                        // or swap this to fetch from elsewhere.
                                        return [];
                                    }}
                                    onChangeValues={(vals) => handleChange(field.name, vals)}
                                />
                                {field.description && <p className="description">{field.description}</p>}
                            </div>
                        );
                    }

                    case 'user-multi-select': {
                        const arrayValue = (form[field.name as keyof T] as unknown as string[] | undefined) ?? [];
                        return (
                            <SearchMultiSelect
                                label={field.label}
                                name={field.name}
                                values={arrayValue}
                                required={field.required}
                                fetchOptions={async () =>
                                    users.map(u => ({ label: u.name ?? "(No name)", value: u.id }))
                                }
                                onChangeValues={(vals) => handleChange(field.name, vals)}
                            />
                        );
                    }

                    case 'dog-multi-select': {
                        const arrayValue = (form[field.name as keyof T] as unknown as string[] | undefined) ?? [];
                        return (
                            <SearchMultiSelect
                                label={field.label}
                                name={field.name}
                                values={arrayValue}
                                required={field.required}
                                fetchOptions={async () =>
                                    userDogs.map(d => ({ label: d.dog_name ?? "(Unnamed dog)", value: d.dog_id }))
                                }
                                onChangeValues={(vals) => handleChange(field.name, vals)}
                            />
                        );
                    }

                    default:
                        console.error("IGDBForm: Unsupported field type:", field.type);
                        return null;
                }
            })}
            <input type="submit" value="Submit"/>
        </form>
    );
}