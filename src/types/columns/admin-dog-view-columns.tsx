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

const cmpDaysSince = (rowA: any, rowB: any, columnId: string) => {
    const va = rowA.getValue(columnId);
    const vb = rowB.getValue(columnId);

    // classify
    const cls = (v: any): 0 | 1 | 2 => {
        if (typeof v === "number" && Number.isFinite(v)) return 0; // numbers first
        if (v === "Never") return 1;                               // then 'Never'
        return 2;                                                  // then null/undefined/other
    };

    const ca = cls(va);
    const cb = cls(vb);
    if (ca !== cb) return ca - cb;

    // same class, compare within class
    if (ca === 0) {
        // both numbers
        return (va as number) - (vb as number);
    }
    if (ca === 1) {
        // both 'Never' -> equal
        return 0;
    }
    // both blanks -> equal
    return 0;
};

export const getAdminDogViewColumns = ({
                                           handleEditDog, handleDeleteDog, handleArchiveDog, handleExportDog
                                       }: AdminDogViewColumnsProps) => {
    return useMemo(() => [
        columnHelper.accessor('dog_picture', {
            header: 'Picture',
            cell: info => info.getValue() ? <img src={info.getValue()!} alt="Dog" width={250}/> : 'No Image',
            enableSorting: false, // images shouldn't sort
        }),

        columnHelper.accessor('dog_name', {
            header: 'Name',
            cell: info => info.getValue(),
            enableSorting: true,
            sortingFn: "alphanumeric",
        }),

        columnHelper.accessor('dog_yob', {
            header: 'Year of Birth',
            cell: info => info.getValue() ? info.getValue().toString() : 'N/A',
            enableSorting: true,
            sortingFn: (a, b, id) =>
                (a.getValue<number | null>(id) ?? Infinity) - (b.getValue<number | null>(id) ?? Infinity),
        }),

        columnHelper.accessor('dog_sex', {
            header: 'Sex',
            cell: info => info.getValue() ?? 'Unknown',
            enableSorting: true,
            sortingFn: "alphanumeric",
        }),

        columnHelper.accessor('dog_current_handler_names', {
            header: 'Current Handler(s)',
            cell: info => {
                const names: string[] | null | undefined = info.getValue();
                return names && names.length > 0 ? names.join(', ') : 'N/A';
            },
            enableSorting: true,
            // sort by joined string for determinism
            sortingFn: (a, b, id) => {
                const sa = (a.getValue<string[] | null>(id) ?? []).join(", ");
                const sb = (b.getValue<string[] | null>(id) ?? []).join(", ");
                return sa.localeCompare(sb, undefined, { sensitivity: "base" });
            },
        }),

        columnHelper.accessor('dog_is_archived', {
            header: 'Active',
            cell: info => info.getValue() ? 'No' : 'Yes',
            enableSorting: true,
            // 'Yes' before 'No' in ascending
            sortingFn: (a, b, id) => {
                const va = a.getValue<boolean>(id);
                const vb = b.getValue<boolean>(id);
                return Number(va) - Number(vb); // false(0)=Active first, true(1)=Archived later
            },
        }),

        columnHelper.accessor('dog_created_by_name', {
            header: 'Created By',
            enableSorting: true,
            sortingFn: "alphanumeric",
        }),

        columnHelper.accessor('dog_last_edited_by_name', {
            header: 'Last Edited By',
            enableSorting: true,
            sortingFn: "alphanumeric",
        }),

        columnHelper.accessor('days_since_last_posted', {
            header: 'Last Posted',
            cell: info => {
                const value = info.getValue() as string | number | null;
                if (value === null || value === undefined) return '—';
                if (value === 'Never') return 'Never';
                return `${value} day${value === 1 ? '' : 's'} ago`;
            },
            enableSorting: true,
            sortingFn: cmpDaysSince, // <- the custom sorter
        }),

        columnHelper.display({
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const dog = row.original;
                const actions = [
                    { label: "Edit", action: handleEditDog },
                    { label: "Delete", action: handleDeleteDog },
                    { label: "Archive", action: handleArchiveDog },
                    { label: "Export", action: handleExportDog },
                ];
                return <ActionsDropdown id={dog.dog_id} actions={actions} />;
            },
        }),
    ], [handleEditDog, handleDeleteDog, handleArchiveDog, handleExportDog]);
};