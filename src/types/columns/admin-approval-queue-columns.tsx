import {useMemo} from "react";
import ActionsDropdown from "../../components/general/ActionsDropdown.tsx";
import {createColumnHelper} from "@tanstack/react-table";
import type {DogUpdate} from "../DogUpdate.ts";
import {approveUpdate, rejectUpdate} from "../../partials/update.ts";

const columnHelper = createColumnHelper<DogUpdate>();

export const getAdminApprovalQueueColumns = (userId: string) => {
    return useMemo(
        () => [
            // Row select
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

            // Dog name (from join)
            columnHelper.accessor("dog_name", {
                header: "Dog",
                cell: (info) => info.getValue() || "—",
                enableSorting: true,
                footer: (info) => info.column.id,
            }),

            // Creator name (from join)
            columnHelper.accessor("creator_name", {
                header: "By",
                cell: (info) => info.getValue() || "—",
                enableSorting: true,
                footer: (info) => info.column.id,
            }),

            // Title
            columnHelper.accessor("update_title", {
                header: "Title",
                enableSorting: true,
                footer: (info) => info.column.id,
            }),

            // Description
            columnHelper.accessor("update_description", {
                header: "Description",
                cell: (info) => info.getValue(),
                footer: (info) => info.column.id,
            }),

            // Media
            columnHelper.accessor("update_media_urls", {
                header: "Media",
                cell: (info) => {
                    const urls = (info.getValue() ?? []) as string[];
                    if (urls.length) {
                        return (
                            <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                                {urls.map((url, idx) => (
                                    <a
                                        key={url ?? idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img
                                            src={url}
                                            alt={`Media ${idx + 1}`}
                                            loading="lazy"
                                            style={{
                                                width: "80px",
                                                height: "80px",
                                                objectFit: "cover",
                                                borderRadius: "4px",
                                                border: "1px solid #ccc",
                                            }}
                                        />
                                    </a>
                                ))}
                            </div>
                        );
                    }
                    return "No Media";
                },
                footer: (info) => info.column.id,
            }),

            // Actions
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: ({row}) => {
                    const update = row.original;
                    const actions = [
                        {
                            label: "Approve",
                            action: async (id: string) => {
                                try {
                                    await approveUpdate(id, userId);
                                    window.location.reload(); // reload after success
                                } catch (error) {
                                    console.error("Failed to approve update", error);
                                    alert("Failed to approve update");
                                }
                            }
                        },
                        {
                            label: "Delete",
                            action: async (id: string) => {
                                try {
                                    await rejectUpdate(id);
                                    window.location.reload(); // reload after success
                                } catch (error) {
                                    console.error("Failed to delete update", error);
                                    alert("Failed to delete update");
                                }
                            }
                        }
                    ];
                    return <ActionsDropdown id={update.update_id} actions={actions}/>;
                },
            }),
        ],
        [userId]
    );
};