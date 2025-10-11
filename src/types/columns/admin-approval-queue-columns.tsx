import {useMemo} from "react";
import ActionsDropdown from "../../components/general/ActionsDropdown.tsx";
import {createColumnHelper} from "@tanstack/react-table";
import type {DogUpdate} from "../DogUpdate.ts";
import {approveUpdate, rejectUpdate} from "../../partials/update.ts";

const columnHelper = createColumnHelper<DogUpdate>();

export const getAdminApprovalQueueColumns = (userId: string) => {
    return useMemo(
        () => [
            // Dog name (from join)
            columnHelper.accessor("dog_name", {
                header: "Dog",
                cell: (info) => info.getValue() || "—",
                enableSorting: true,
                sortingFn: "alphanumeric",
                footer: (info) => info.column.id,
            }),

            // Creator name (from join)
            columnHelper.accessor("creator_name", {
                header: "Name",
                cell: (info) => info.getValue() || "—",
                enableSorting: true,
                sortingFn: "alphanumeric",
                footer: (info) => info.column.id,
            }),

            // Creator email (case-insensitive)
            columnHelper.accessor("creator_email", {
                header: "Email",
                cell: (info) => info.getValue() || "—",
                enableSorting: true,
                sortingFn: "alphanumeric",
                footer: (info) => info.column.id,
            }),

            // Title
            columnHelper.accessor("update_title", {
                header: "Title",
                cell: (info) => info.getValue() || "—",
                enableSorting: true,
                sortingFn: "alphanumeric",
                footer: (info) => info.column.id,
            }),

            // Description (long text; simple alpha sort)
            columnHelper.accessor("update_description", {
                header: "Description",
                cell: (info) => info.getValue() || "—",
                enableSorting: true,
                sortingFn: "alphanumeric",
                footer: (info) => info.column.id,
            }),

            // Media (sort by number of items)
            columnHelper.accessor("update_media_urls", {
                header: "Media",
                enableSorting: true,
                sortingFn: (a, b, id) => {
                    const la = ((a.getValue<string[] | null>(id) ?? []) as string[]).length;
                    const lb = ((b.getValue<string[] | null>(id) ?? []) as string[]).length;
                    return la - lb; // asc: fewer first; desc flips automatically
                },
                cell: (info) => {
                    const urls = (info.getValue() ?? []) as string[];
                    if (urls.length) {
                        return (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {urls.map((url, idx) => (
                                    <a key={url ?? idx} href={url} target="_blank" rel="noopener noreferrer">
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

            columnHelper.accessor("update_created_at", {
                header: "Created At",
                enableSorting: true,
                sortingFn: "datetime",
                cell: (info) => {
                    const value = info.getValue() as string | null;
                    if (!value) return "—";
                    // Display in local readable format; adjust to taste
                    const date = new Date(value);
                    return date.toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                },
                footer: (info) => info.column.id,
            }),

            // Actions (never sortable)
            columnHelper.display({
                id: "actions",
                header: "Actions",
                enableSorting: false,
                cell: ({ row }) => {
                    const update = row.original;
                    const actions = [
                        {
                            label: "Approve",
                            action: async (id: string) => {
                                try {
                                    await approveUpdate(id, userId);
                                    window.location.reload();
                                } catch (error) {
                                    console.error("Failed to approve update", error);
                                    alert("Failed to approve update");
                                }
                            },
                        },
                        {
                            label: "Delete",
                            action: async (id: string) => {
                                try {
                                    await rejectUpdate(id);
                                    window.location.reload();
                                } catch (error) {
                                    console.error("Failed to delete update", error);
                                    alert("Failed to delete update");
                                }
                            },
                        },
                    ];
                    return <ActionsDropdown id={update.update_id} actions={actions} />;
                },
            }),
        ],
        [userId]
    );
};