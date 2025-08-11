import {useEffect, useMemo, useState} from "react";
import type {User} from "../../../types/User.ts";
import {supabase} from "../../../state/supabaseClient.ts";
import {getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useNavigate} from "react-router";
import Table from "../../../components/info/Table.tsx";
import Card from "../../../components/info/Card.tsx";
import {getAdminUserViewColumns} from "../../../types/columns/admin-user-view-columns.tsx";
import {archiveUser, deleteUser} from "../../../partials/users.ts";

export default function AdminUsersView() {

    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const [showArchived] = useState<boolean>(false);

    const filteredUsers = useMemo(
        () => users.filter(u => !u.is_archived || showArchived),
        [users, showArchived]
    );

    const handleEditUser = (id: string) => {
        navigate(`/admin/users/edit/${id}`);
    };

    const handleArchiveUser = (id: string) => {
        const confirmed = window.confirm("Are you sure you want to archive this user?");
        if (!confirmed) return;
        archiveUser(id).then(() => fetchUsers());
    };

    const handleDeleteUser = (id: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this user?");
        if (!confirmed) return;
        deleteUser(id).then(() => fetchUsers());
    };

    const table = useReactTable({
        data: filteredUsers,
        columns: getAdminUserViewColumns({handleEditUser, handleDeleteUser, handleArchiveUser}),
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
            console.log("Error occurred while fetching dogs:", error);
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
                <div className="user-cards">
                    <Card title="Total Users" value={users.length} />
                </div>
                <Table loading={loading} table={table} />
            </div>
        </div>
    )
}