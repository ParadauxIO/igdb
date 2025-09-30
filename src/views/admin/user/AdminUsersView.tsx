import {useEffect, useMemo, useState} from "react";
import type {User} from "../../../types/User.ts";
import {supabase} from "../../../state/supabaseClient.ts";
import {getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useNavigate} from "react-router";
import Table from "../../../components/info/Table.tsx";
import {getAdminUserViewColumns} from "../../../types/columns/admin-user-view-columns.tsx";
import {archiveUser, deleteUser, resendInvite} from "../../../partials/users.ts";
import StatusCard from "../../../components/general/StatusCard.tsx";
import "./AdminUsersView.scss";
import { FaFilter } from 'react-icons/fa';

export default function AdminUsersView() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [message, setMessage] = useState<string|null>(null);
    const [sortByLongestNoPost, setSortByLongestNoPost] = useState<boolean>(false);

    const filteredUsers = useMemo(() => {
        let list = users.filter(u => !u.is_archived || showArchived);

        if (sortByLongestNoPost) {
            list = [...list].sort((a, b) => {
            // Nulls go last
            const aDays = a.days_since_last_posted ?? -1;
            const bDays = b.days_since_last_posted ?? -1;
            
            return bDays - aDays;
            });
        }

        return list;
    }, [users, showArchived, sortByLongestNoPost]);

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
                            <button
                                onClick={() => setSortByLongestNoPost(prev => !prev)}
                                className="sort-btn"
                                title="Sort users by inactivity (days since last post)"
                                >
                                <FaFilter style={{ marginRight: '6px' }} />
                                {sortByLongestNoPost ? "Default Sort" : "Sort by Inactivity"}
                            </button>
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