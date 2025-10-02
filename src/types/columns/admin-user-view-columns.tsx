import {createColumnHelper} from "@tanstack/react-table";
import type {User} from "../User.ts";
import {useMemo} from "react";
import ActionsDropdown from "../../components/general/ActionsDropdown.tsx";

type AdminUserViewColumnsProps = {
    handleEditUser: (id: string) => void;
    handleDeleteUser: (id: string) => void;
    handleArchiveUser: (id: string) => void;
    handleResendInvite: (id: string) => void;
}

const columnHelper = createColumnHelper<User>();
export const getAdminUserViewColumns = ({handleEditUser, handleDeleteUser, handleArchiveUser, handleResendInvite}: AdminUserViewColumnsProps) => {
    return [

        // Fields from the user type
        columnHelper.accessor('name', {
            header: 'Name',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('email', {
            header: 'Email',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('permission_role', {
            header: 'Role',
            cell: info => info.getValue() ?? 'N/A',
            footer: info => info.column.id,
        }),

        columnHelper.accessor('functional_role', {
            header: 'Function',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('phone', {
            header: 'Phone',
            footer: info => info.column.id,
        }),

        columnHelper.accessor('is_archived', {
            header: 'Archived',
            cell: info => info.getValue() ? 'Yes' : 'No',
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

        // Kebab menu for actions
        columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const user = row.original;

                const actions = useMemo(() => [
                    {label: "Edit", action: handleEditUser},
                    {label: "Delete", action: handleDeleteUser},
                    {label: "Archive", action: handleArchiveUser},
                    {label: "Resend Invite", action: handleResendInvite}
                ], []);

                return (
                    <ActionsDropdown
                        id={user.id}
                        actions={actions}
                    />
                );
            },
        }),
    ];
}