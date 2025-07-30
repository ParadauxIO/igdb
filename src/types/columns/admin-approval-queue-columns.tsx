import {useMemo} from "react";
import ActionsDropdown from "../../components/general/ActionsDropdown.tsx";
import {createColumnHelper} from "@tanstack/react-table";
import type {DogUpdate} from "../DogUpdate.ts";
import {approveUpdate, rejectUpdate} from "../../partials/update.ts";

const columnHelper = createColumnHelper<DogUpdate>();

export const getAdminApprovalQueueColumns = (userId: string) => {
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

        // Title
        columnHelper.accessor('update_title', {
            header: 'Title',
            footer: info => info.column.id,
        }),

        // Description
        columnHelper.accessor('update_description', {
            header: 'Description',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        // Media
        columnHelper.accessor('update_media_urls', {
            header: 'Media',
            cell: info => {
                const value = info.getValue();
                if (value && value.length) {
                    return value.join(', ')
                }
                return 'No Media';
            },
            footer: info => info.column.id,
        }),

        columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: ({row}) => {
                const update = row.original;

                const actions = useMemo(() => [
                    {label: "Approve", action: (id: string) => approveUpdate(id, userId)},
                    {label: "Delete", action: (id: string) => rejectUpdate(id)},
                ], []);

                return (
                    <ActionsDropdown
                        id={update.update_id}
                        actions={actions}
                    />
                );
            }
        }),
    ], []);
}