import {useState} from "react";
import type {User} from "../../types/User.ts";

export const TestPage = () => {
    const [form, setForm] = useState<Partial<User>>({});

    const columns = [
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
                columns={columns}
            />
        </div>
    )
}

type Column = {
    name: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'checkbox' | 'datetime';
    required?: boolean;
    options?: string[];
};

interface IGDBFormProps<T> {
    form: Partial<T>;
    setForm: (f: Partial<T>) => void;
    columns: Column[];
}

export default function IGDBForm<T>({form, setForm, columns}: IGDBFormProps<T>) {
    const handleChange = (name: string, value: any) => {
        setForm({
            ...form,
            [name]: value
        });
    };

    return (
        <form className="grid gap-4">
            {columns.map(col => {
                const value = form[col.name as keyof T];

                switch (col.type) {
                    case 'text':
                    case 'password':
                        return (
                            <div key={col.name} className="flex flex-col">
                                <label className="font-semibold">{col.label}</label>
                                <input
                                    type={col.type}
                                    name={col.name}
                                    required={col.required}
                                    value={value || ''}
                                    onChange={e => handleChange(col.name, e.target.value)}
                                    className="border p-2 rounded"
                                />
                            </div>
                        );

                    case 'select':
                        return (
                            <div key={col.name} className="flex flex-col">
                                <label className="font-semibold">{col.label}</label>
                                <select
                                    name={col.name}
                                    required={col.required}
                                    value={value || ''}
                                    onChange={e => handleChange(col.name, e.target.value)}
                                    className="border p-2 rounded"
                                >
                                    <option value="" disabled>Select...</option>
                                    {col.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        );

                    case 'checkbox':
                        return (
                            <div key={col.name} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name={col.name}
                                    checked={Boolean(value)}
                                    onChange={e => handleChange(col.name, e.target.checked)}
                                />
                                <label className="font-semibold">{col.label}</label>
                            </div>
                        );

                    case 'datetime':
                        return (
                            <div key={col.name} className="flex flex-col">
                                <label className="font-semibold">{col.label}</label>
                                <input
                                    type="datetime-local"
                                    name={col.name}
                                    required={col.required}
                                    value={value ? new Date(value as Date).toISOString().slice(0, 16) : ''}
                                    onChange={e => handleChange(col.name, new Date(e.target.value))}
                                    className="border p-2 rounded"
                                />
                            </div>
                        );

                    default:
                        return null;
                }
            })}
        </form>
    );
}