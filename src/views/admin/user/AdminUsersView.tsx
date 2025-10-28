import {useEffect, useMemo, useState} from "react";
import type {User} from "../../../types/User.ts";
import {supabase} from "../../../state/supabaseClient.ts";
import {getCoreRowModel, getSortedRowModel, type SortingState, useReactTable} from "@tanstack/react-table";
import {useNavigate} from "react-router";
import Table from "../../../components/info/Table.tsx";
import {getAdminUserViewColumns} from "../../../types/columns/admin-user-view-columns.tsx";
import {archiveUser, deleteUser, resendInvite} from "../../../partials/users.ts";
import StatusCard from "../../../components/general/StatusCard.tsx";
import "./AdminUsersView.scss";

export default function AdminUsersView() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [isError, setIsError] = useState<boolean>(false);
    const [message, setMessage] = useState<string|null>(null);

    const filteredUsers = useMemo(() => {
        return users.filter(u => !u.is_archived || showArchived);
    }, [users, showArchived]);

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
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        const { error } = await deleteUser(id);

        if (error) {
            // Prefer status first
            switch (error.status) {
                case 401:
                    setIsError(true);
                    setMessage("You’re not signed in or your session expired.");
                    return;
                case 403:
                    setIsError(true);
                    setMessage("You need admin permissions to delete users.");
                    return;
                case 404:
                    setIsError(true);
                    setMessage("That user doesn’t exist.");
                    return;
                case 409: {
                    // Our function returns a machine-readable payload too; try to pull counts.
                    // Supabase puts function response body into error.message (string), not JSON.
                    // So we also try to decode the last response via `data` if present.
                    // Easiest: just show a friendly message.
                    setIsError(true);
                    setMessage("Failed to delete user: there are still references (dogs or updates) assigned to them.");
                    return;
                }
                default:
                    setIsError(true);
                    setMessage("Failed to delete user due to a server error.");
                    return;
            }
        }

        // Success path
        setIsError(false);
        setMessage("Successfully deleted user.");
        await fetchUsers();
    };

    const table = useReactTable({
        data: filteredUsers,
        state: { sorting },
        columns: getAdminUserViewColumns({handleEditUser, handleDeleteUser, handleArchiveUser, handleResendInvite}),
        getRowId: originalRow => originalRow.id,
        enableRowSelection: true,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    const handleUserInvitation = () => {
        navigate('/admin/users/invite');
    };

    const fetchUsers = async () => {
        setLoading(true);

        // 1. Fetch all users
        const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("*");

        // 2. Fetch latest update per user
        const { data: updatesData, error: updatesError } = await supabase
            .from("dog_updates")
            .select("update_created_by, update_created_at")
            .order("update_created_at", { ascending: false });

        if (usersError || updatesError) {
            console.error("Failed to fetch data:", usersError || updatesError);
            setLoading(false);
            return;
        }

        // 3. Map latest update per user
        const latestUpdateByUser: Record<string, string> = {};

        for (const update of updatesData ?? []) {
            const userId = update.update_created_by;
            if (!latestUpdateByUser[userId]) {
            latestUpdateByUser[userId] = update.update_created_at;
            }
        }

        // 4. Combine users + computed `days_since_last_posted`
        const today = new Date();

        const enrichedUsers = (usersData ?? []).map(user => {
            if (user.permission_role == "viewer") {
            return { ...user, days_since_last_posted: null };
            }

            const lastUpdate = latestUpdateByUser[user.id];
            if (!lastUpdate) {
            return { ...user, days_since_last_posted: 'Never' };
            }

            const lastUpdateDate = new Date(lastUpdate);
            const diffTime = today.getTime() - lastUpdateDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return {
            ...user,
            days_since_last_posted: diffDays,
            };
        });

        setUsers(enrichedUsers);
        setLoading(false);
    };

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