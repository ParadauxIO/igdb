import {createColumnHelper} from "@tanstack/react-table";
import type {Dog} from "../Dog.ts";
import {useMemo} from "react";
import ActionsDropdown from "../../components/general/ActionsDropdown.tsx";

const columnHelper = createColumnHelper<Dog>();

type AdminDogViewColumnsProps = {
    handleEditDog: (id: string) => void;
    handleDeleteDog: (id: string) => void;
    handleArchiveDog: (id: string) => void;
    handleExportDog: (id: string) => void;
}

export const getAdminDogViewColumns = ({handleEditDog, handleDeleteDog, handleArchiveDog, handleExportDog}: AdminDogViewColumnsProps) => {
    return useMemo(() => [
        columnHelper.display({
            id: "select",
            header: ({table}) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                />
            ),
            cell: ({row}) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
        }),

        // Picture
        columnHelper.accessor('dog_picture', {
            header: 'Picture',
            cell: info => info.getValue() ? <img src={info.getValue()!} alt="Dog" width={250}/> : 'No Image',
            footer: info => info.column.id,
        }),

        // Name
        columnHelper.accessor('dog_name', {
            header: 'Name',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        // Role
        columnHelper.accessor('dog_role', {
            header: 'Role',
            footer: info => info.column.id,
        }),

        // Year of Birth (dog_yob)
        columnHelper.accessor('dog_yob', {
            header: 'Year of Birth',
            cell: info => info.getValue() ? info.getValue().toString() : 'N/A',
            footer: info => info.column.id,
        }),

        // Sex
        columnHelper.accessor('dog_sex', {
            header: 'Sex',
            cell: info => info.getValue() ?? 'Unknown',
            footer: info => info.column.id,
        }),

        // Status
        columnHelper.accessor('dog_status', {
            header: 'Status',
            footer: info => info.column.id,
        }),

        // Current Handler(s)
        columnHelper.accessor('dog_current_handler_names', {
            header: 'Current Handler(s)',
            cell: info => {
                const names: string[] | null | undefined = info.getValue();
                return names && names.length > 0 ? names.join(', ') : 'N/A';
            },
            footer: info => info.column.id,
        }),

        // General Notes
        columnHelper.accessor('dog_general_notes', {
            header: 'General Notes',
            cell: info => info.getValue() ?? '',
            footer: info => info.column.id,
        }),

        // Active
        columnHelper.accessor('dog_is_archived', {
            header: 'Active',
            cell: info => info.getValue() ? 'No' : 'Yes',
            footer: info => info.column.id,
        }),

        // Created At
        columnHelper.accessor('dog_created_at', {
            header: 'Created At',
            cell: info => new Date(info.getValue()).toLocaleString(),
            footer: info => info.column.id,
        }),

        // Updated At
        columnHelper.accessor('dog_updated_at', {
            header: 'Updated At',
            cell: info => new Date(info.getValue()).toLocaleString(),
            footer: info => info.column.id,
        }),

        // Created By
        columnHelper.accessor('dog_created_by_name', {
            header: 'Created By',
            footer: info => info.column.id,
        }),

        // Last Edited By
        columnHelper.accessor('dog_last_edited_by_name', {
            header: 'Last Edited By',
            footer: info => info.column.id,
        }),

        columnHelper.accessor('days_since_last_posted', {
            header: 'Last Posted',
            cell: info => {
                const value = info.getValue() as string | number | null;
                if (value === null || value === undefined) return '—';
                if (value === 'Never') return 'Never'; 
                return `${value} day${value === 1 ? '' : 's'} ago`;
            },
            footer: info => info.column.id,
        }),

        // Actions menu remains unchanged
        columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: ({row}) => {
                const dog = row.original;

                const actions = useMemo(() => [
                    {label: "Edit", action: handleEditDog},
                    {label: "Delete", action: handleDeleteDog},
                    {label: "Archive", action: handleArchiveDog},
                    {label: "Export", action: handleExportDog}
                ], [handleEditDog, handleDeleteDog, handleArchiveDog, handleExportDog]);

                return (
                    <ActionsDropdown
                        id={dog.dog_id}
                        actions={actions}
                    />
                );
            }
        }),
    ], [handleEditDog, handleDeleteDog, handleArchiveDog, handleExportDog]);
}