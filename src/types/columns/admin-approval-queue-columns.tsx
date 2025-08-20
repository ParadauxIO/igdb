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
                const urls: string[] = info.getValue();
                if (urls && urls.length) {
                    return (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {urls.map((url, idx) => (
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`Media ${idx + 1}`}
                                        loading="lazy"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                        }}
                                    />
                                </a>
                            ))}
                        </div>
                    );
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