import { useEffect, useState } from "react";
import type { DogUpdate } from "../../types/DogUpdate";
import "./ApprovalQueue.scss";
import { getApprovalQueue } from "../../partials/update";
import {getCoreRowModel, getSortedRowModel, type SortingState, useReactTable} from "@tanstack/react-table";
import { getAdminApprovalQueueColumns } from "../../types/columns/admin-approval-queue-columns";
import Table from "../info/Table";
import { useAuth } from "../../state/hooks/useAuth";

export default function ApprovalQueue() {
    const [updates, setUpdates] = useState<DogUpdate[]>([]);
    const [showApproved, setShowApproved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const { user } = useAuth();

    const columns = getAdminApprovalQueueColumns(user?.id ?? "");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getApprovalQueue(showApproved);
                if (!cancelled) setUpdates(data);
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load queue");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [showApproved]);

    const table = useReactTable({
        data: updates,
        columns,
        state: { sorting },
        getRowId: (row) => String(row.update_id ?? `${row.dog_id}:${row.update_created_at}`), // unique & stable
        enableRowSelection: true,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="approval-queue">
            <div className="table-wrapper">
                <div className="controls">
                    <label htmlFor="show-approved">Show Approved Updates</label>
                    <input
                        id="show-approved"
                        type="checkbox"
                        checked={showApproved}
                        onChange={() => setShowApproved((prev) => !prev)}
                    />
                </div>

                {error && <div className="error">{error}</div>}
                <Table loading={loading} table={table} />
            </div>
        </div>
    );
}