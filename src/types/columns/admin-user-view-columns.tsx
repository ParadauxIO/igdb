import { createColumnHelper } from "@tanstack/react-table";
import type { User } from "../User.ts";
import { useMemo } from "react";
import ActionsDropdown from "../../components/general/ActionsDropdown.tsx";

type AdminUserViewColumnsProps = {
    handleEditUser: (id: string) => void;
    handleDeleteUser: (id: string) => void;
    handleArchiveUser: (id: string) => void;
    handleResendInvite: (id: string) => void;
};

const columnHelper = createColumnHelper<User>();

// Custom sorting for days_since_last_posted (mixed types)
const cmpDaysSince = (rowA: any, rowB: any, columnId: string) => {
    const va = rowA.getValue(columnId);
    const vb = rowB.getValue(columnId);

    const cls = (v: any): 0 | 1 | 2 => {
        if (typeof v === "number" && Number.isFinite(v)) return 0; // numbers first
        if (v === "Never") return 1;                               // then 'Never'
        return 2;                                                  // then blanks
    };

    const ca = cls(va);
    const cb = cls(vb);
    if (ca !== cb) return ca - cb;

    if (ca === 0) return (va as number) - (vb as number);
    return 0;
};

export const getAdminUserViewColumns = ({
                                            handleEditUser,
                                            handleDeleteUser,
                                            handleArchiveUser,
                                            handleResendInvite,
                                        }: AdminUserViewColumnsProps) => {
    return [
        // Name
        columnHelper.accessor("name", {
            header: "Name",
            cell: (info) => info.getValue() || "—",
            enableSorting: true,
            sortingFn: "alphanumeric",
            footer: (info) => info.column.id,
        }),

        // Email
        columnHelper.accessor("email", {
            header: "Email",
            cell: (info) => info.getValue() || "—",
            enableSorting: true,
            sortingFn: "alphanumeric",
            footer: (info) => info.column.id,
        }),

        // Permission role
        columnHelper.accessor("permission_role", {
            header: "Role",
            cell: (info) => info.getValue() ?? "N/A",
            enableSorting: true,
            sortingFn: "alphanumeric",
            footer: (info) => info.column.id,
        }),

        // Functional role
        columnHelper.accessor("functional_role", {
            header: "Function",
            cell: (info) => info.getValue() || "—",
            enableSorting: true,
            sortingFn: "alphanumeric",
            footer: (info) => info.column.id,
        }),

        // Phone
        columnHelper.accessor("phone", {
            header: "Phone",
            cell: (info) => info.getValue() || "—",
            enableSorting: true,
            sortingFn: "alphanumeric",
            footer: (info) => info.column.id,
        }),

        // Archived flag
        columnHelper.accessor("is_archived", {
            header: "Archived",
            cell: (info) => (info.getValue() ? "Yes" : "No"),
            enableSorting: true,
            // false (active) should appear before true (archived)
            sortingFn: (a, b, id) =>
                Number(a.getValue<boolean>(id)) - Number(b.getValue<boolean>(id)),
            footer: (info) => info.column.id,
        }),

        // Last Posted
        columnHelper.accessor("days_since_last_posted", {
            header: "Last Posted",
            cell: (info) => {
                const value = info.getValue() as string | number | null;
                if (value === null || value === undefined) return "—";
                if (value === "Never") return "Never";
                return `${value} day${value === 1 ? "" : "s"} ago`;
            },
            enableSorting: true,
            sortingFn: cmpDaysSince,
            footer: (info) => info.column.id,
        }),

        // Actions
        columnHelper.display({
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const user = row.original;
                const actions = useMemo(
                    () => [
                        { label: "Edit", action: handleEditUser },
                        { label: "Delete", action: handleDeleteUser },
                        { label: "Archive", action: handleArchiveUser },
                        { label: "Resend Invite", action: handleResendInvite },
                    ],
                    [handleEditUser, handleDeleteUser, handleArchiveUser, handleResendInvite]
                );

                return <ActionsDropdown id={user.id} actions={actions} />;
            },
        }),
    ];
};