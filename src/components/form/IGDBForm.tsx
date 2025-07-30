import {useState} from "react";
import type {User} from "../../types/User.ts";
import "./IGDBForm.scss"
import LookupInput from "./LookupInput.tsx";
import {searchUsers} from "../../partials/users.ts";

export type FormField = {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'password' | 'select' | 'checkbox' | 'datetime' | 'user-select';
    description?: string;
    required?: boolean;
    options?: string[];
};

interface IGDBFormProps<T> {
    form: Partial<T>;
    setForm: (f: Partial<T>) => void;
    fields: FormField[];
}

export default function IGDBForm<T>({form, setForm, fields}: IGDBFormProps<T>) {
    const handleChange = (name: string, value: any) => {
        setForm({
            ...form,
            [name]: value
        });
    };

    return (
        <form className="igdb-form">
            {fields.map(field => {
                const value = form[field.name as keyof T];

                switch (field.type) {
                    case 'text':
                    case 'password':
                        return (
                            <div key={field.name} className="text-input form-input">
                                <label className="font-semibold">{field.label}</label>
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
                                <label className="font-semibold">{field.label}</label>
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
                                    <label className="font-semibold">{field.label}</label>
                                </div>
                                {field.description && <p className="description"> {field.description} </p>}
                            </div>
                        );

                    case 'datetime':
                        return (
                            <div key={field.name} className="datetime-input form-input">
                                <label className="font-semibold">{field.label}</label>
                                <input
                                    type="datetime-local"
                                    name={field.name}
                                    required={field.required}
                                    value={value ? new Date(value as Date).toISOString().slice(0, 16) : ''}
                                    onChange={e => handleChange(field.name, new Date(e.target.value))}
                                    className="border p-2 rounded"
                                />
                            </div>
                        );

                    case 'user-select':
                        return (
                            <LookupInput
                                key={field.name}
                                name={field.name}
                                label={field.label}
                                value={value as string}
                                placeholder={`Search for ${field.label.toLowerCase()}...`}
                                onSelect={(user) =>
                                    handleChange(field.name, user ? user.id : null)
                                }
                                searchFunc={searchUsers}
                                displayField="name"
                            />
                        );
                    case 'textarea':
                        return (
                            <div key={field.name} className="text-input form-input">
                                <label className="font-semibold">{field.label}</label>
                                {field.description && <p className="description"> {field.description} </p>}
                                <textarea
                                    type={field.type}
                                    name={field.name}
                                    required={field.required}
                                    value={value || ''}
                                    onChange={e => handleChange(field.name, e.target.value)}
                                    className="border p-2 rounded"
                                    rows={10}
                                />
                            </div>
                        )
                    default:
                        console.error("IGDBForm: Unsupported field type:", field.type);
                        return null;
                }
            })}
        </form>
    );
}

export const TestPage = () => {
    const [form, setForm] = useState<Partial<User>>({});

    const fields: FormField[] = [
        {name: 'id', label: 'ID', type: 'text', required: true},
        {name: 'name', label: 'Name', type: 'text', required: true},
        {
            name: 'permission_role',
            label: 'Permission Role',
            type: 'select',
            options: ['viewer', 'admin', 'updater'],
            required: true
        },
        {name: 'functional_role', label: 'Functional Role', type: 'text'},
        {name: 'phone', label: 'Phone', type: 'text'},
        {name: 'is_active', label: 'Is Active', type: 'checkbox'},
        {name: 'can_approve_updates', label: 'Can Approve Updates', type: 'checkbox'},
        {name: 'created_at', label: 'Created At', type: 'datetime'},
        {name: 'updated_at', label: 'Updated At', type: 'datetime'}
    ]

    return (
        <div>
            <IGDBForm
                form={form}
                setForm={setForm}
                fields={fields}
            />
            <div className="output">
                {Object.keys(form).map(key => (
                    <div key={key} className="flex items-center gap-2">
                        <strong>{key}:</strong>
                        <span>{form[key as keyof typeof form]?.toString() || 'N/A'}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}