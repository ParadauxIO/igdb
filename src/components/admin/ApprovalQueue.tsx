import {useEffect, useState} from "react";
import type {DogUpdate} from "../../types/DogUpdate.ts";
import "./ApprovalQueue.scss";
import {getApprovalQueue} from "../../partials/update.ts";
import {getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {getAdminApprovalQueueColumns} from "../../types/columns/admin-approval-queue-columns.tsx";
import Table from "../info/Table.tsx";
import {useAuth} from "../../state/hooks/useAuth.ts";

export default function ApprovalQueue() {
    const [updates, setUpdates] = useState<DogUpdate[]>([]);
    const [showApproved, setShowApproved] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const {user} = useAuth();

    useEffect(() => {
        async function fetchUpdates() {
            setLoading(true);
            setUpdates(await getApprovalQueue(showApproved));
            setLoading(false);
        }
        fetchUpdates();
    }, [showApproved]);

    const table = useReactTable({
        data: updates,
        columns: getAdminApprovalQueueColumns(user?.id),
        getCoreRowModel: getCoreRowModel(),
        getRowId: originalRow => originalRow.dog_id,
        enableRowSelection: true
    })


    return (
        <div className="approval-queue">
            <div className="table-wrapper">
                <div>
                    <label htmlFor="show-approved">Show Approved Updates</label>
                    <input id="show-approved" type="checkbox" checked={showApproved} onChange={() => setShowApproved(prev => !prev)} />                </div>
                <Table loading={loading} table={table}/>
            </div>
        </div>
    )
}