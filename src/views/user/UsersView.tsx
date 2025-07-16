import Header from "../../components/Header.tsx";
import {useEffect, useMemo, useState} from "react";
import type {User} from "../../types/User.ts";
import {supabase} from "../../state/supabaseClient.ts";
import {createColumnHelper, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {FaEllipsisH } from "react-icons/fa";
import {useNavigate} from "react-router";
import Table from "../../components/Table.tsx";
import Card from "../../components/Card.tsx";

const columnHelper = createColumnHelper<User>()

export default function UsersView() {

    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showInactive, setShowInactive] = useState<boolean>(false);

    const columns = [
        // Multiselect checkbox for selecting rows
        columnHelper.display({
            id: "select",
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
        }),

        // Fields from the user type
        columnHelper.accessor('name', {
            header: 'Name',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('permission_role', {
            header: 'Role',
            cell: info => info.getValue() ?? 'N/A',
            footer: info => info.column.id,
        }),

        columnHelper.accessor('functional_role', {
            header: 'Function',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('phone', {
            header: 'Phone',
            footer: info => info.column.id,
        }),

        columnHelper.accessor('is_active', {
            header: 'Active',
            cell: info => info.getValue() ? 'Yes' : 'No',
            footer: info => info.column.id,
        }),

        // Kebab menu for actions
        columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="actions-cell">
                        <div onClick={() => handleMenuClick(user.id)}>
                            <FaEllipsisH size={24} color="#6c757d" />
                        </div>

                        {activeMenuId === user.id && (
                            <div className="dropdown-menu">
                                <button onClick={() => handleEdit(user.id)}>Edit</button>
                                <button onClick={() => handleDelete(user.id)}>Delete</button>
                                <button onClick={() => handleDisable(user.id)}>Disable</button>
                            </div>
                        )}
                    </div>
                );
            },
        }),
    ];

    const filteredUsers = useMemo(
        () => users.filter(u => u.is_active || showInactive),
        [users, showInactive]
    );

    const table = useReactTable({
        data: filteredUsers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: originalRow => originalRow.id,
        enableRowSelection: true
    })

    const handleEdit = (id: string) => {
        navigate(`/users/profile/${id}`);
    };

    const handleDisable = async (id: string) => {
        const { error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error("Failed to disable user:", error);
            return;
        }

        fetchUsers();
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this user?");
        if (!confirmed) return;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Failed to delete user:", error);
            return;
        }

        setUsers(users.filter(u => u.id !== id));
    };

    const handleMenuClick = (id: string) => {
        setActiveMenuId(prev => (prev === id ? null : id));
    };

    const handleUserInvitation = () => {
        navigate('/users/invite');
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
        console.log('fetch users : {}', data.length);
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
            <Header/>
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
                {/* <form>
                    <label htmlFor="dog_is_enabled">Show inactive users?</label>
                    <input
                        type="checkbox"
                        id="dog_is_enabled"
                        checked={showInactive}
                        onChange={e => setShowInactive(e.target.checked)}
                        placeholder="Filter by status"
                    />
                </form> */}
            </div>
        </div>
    )
}