import {useEffect, useMemo, useState} from "react";
import type {User} from "../../../types/User.ts";
import {supabase} from "../../../state/supabaseClient.ts";
import {getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useNavigate} from "react-router";
import Table from "../../../components/info/Table.tsx";
import Card from "../../../components/info/Card.tsx";
import {getAdminUserViewColumns} from "../../../types/columns/admin-user-view-columns.tsx";
import {archiveUser, deleteUser, resendInvite} from "../../../partials/users.ts";
import StatusCard from "../../../components/general/StatusCard.tsx";
import "./AdminUsersView.scss";

export default function AdminUsersView() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [message, setMessage] = useState<string|null>(null);

    const filteredUsers = useMemo(
        () => users.filter(u => !u.is_archived || showArchived),
        [users, showArchived]
    );

    const handleEditUser = (id: string) => {
        navigate(`/admin/users/edit/${id}`);
    };

    const handleArchiveUser = async (id: string) => {
        const confirmed = window.confirm("Are you sure you want to archive this user?");
        if (!confirmed) return;

        const error = await archiveUser(id);

        if (error) {
            setIsError(true);
            setMessage("Failed to archive user.")
            return;
        }

        setIsError(false);
        setMessage("Successfully archived user.")
        await fetchUsers();
    };

    const handleResendInvite = async (id: string) => {
        const error = await resendInvite(id);

        if (error) {
            setIsError(true);
            setMessage(error.details);
            return;
        }

        setIsError(false);
        setMessage("Resent invite")
    }

    const handleDeleteUser = async (id: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this user?");
        if (!confirmed) return;

        const error = await deleteUser(id);

        if (error && error.details.includes("still referenced")) {
            setIsError(true);
            setMessage("Failed to delete user as there are still dogs assigned to them.");
            return;
        }

        if (error) {
            setIsError(true);
            setMessage("Failed to delete user.");
            return;
        }

        setIsError(false);
        setMessage("Successfully deleted user.")

        await fetchUsers();
    };

    const table = useReactTable({
        data: filteredUsers,
        columns: getAdminUserViewColumns({handleEditUser, handleDeleteUser, handleArchiveUser, handleResendInvite}),
        getCoreRowModel: getCoreRowModel(),
        getRowId: originalRow => originalRow.id,
        enableRowSelection: true
    })

    const handleUserInvitation = () => {
        navigate('/admin/users/invite');
    };

    const fetchUsers = async () => {
        setLoading(true);
        const {data, error} = await supabase
            .from('users')
            .select("*")
            .order("created_at", {ascending: false});
        if (error) {
            console.log("Error occurred while fetching users:", error);
            return;
        }
        if (data) {
            setUsers(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="user-view">
            <div className="user-container">
                <div className="view-header">
                    <h1>Users</h1>
                    <button className="create-btn" onClick={handleUserInvitation}>
                        <span>Invite New User</span>
                    </button>
                </div>
                <div className="user-count">
                    <div className="left">
                        Total Users: <span id="total-count">{users.length}</span>
                    </div>
                    <div className="right">
                        <form>
                            <label htmlFor="user_is_enabled">Show archived users?</label>
                            <input
                                type="checkbox"
                                id="user_is_enabled"
                                checked={showArchived}
                                onChange={e => setShowArchived(e.target.checked)}
                                placeholder="Filter by status"
                            />
                            </form>
                    </div>
                </div>
                <StatusCard message={message} isError={isError}/>
                <div className="table-wrapper">
                    <Table loading={loading} table={table} />
                </div>
                
            </div>
        </div>
    )
}