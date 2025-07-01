import NavBar from "../components/NavBar.tsx";
import {useEffect, useMemo, useState} from "react";
import type {User} from "../types/User.ts";
import {supabase} from "../state/supabaseClient.ts";
//import "./DogView.scss";
import {createColumnHelper, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {FaEllipsisH, FaPlus} from "react-icons/fa";
import {useNavigate} from "react-router";
import Table from "../components/Table.tsx";
import Card from "../components/Card.tsx";

const columnHelper = createColumnHelper<User>()

export default function UserView() {

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
        columnHelper.accessor('firstname', {
            header: 'First Name',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('surname', {
            header: 'Surname',
            cell: info => info.getValue() ?? 'N/A',
            footer: info => info.column.id,
        }),

        columnHelper.accessor('role', {
            header: 'Role',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('phone', {
            header: 'Phone',
            footer: info => info.column.id,
        }),


        columnHelper.accessor('isActive', {
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
                        <div onClick={() => handleMenuClick(user.user_id)}>
                            <FaEllipsisH size={24} color="#6c757d" />
                        </div>

                        {activeMenuId === user.user_id && (
                            <div className="dropdown-menu">
                                <button onClick={() => handleEdit(user.user_id)}>Edit</button>
                                <button onClick={() => handleDelete(user.user_id)}>Delete</button>
                                <button onClick={() => handleDisable(user.user_id)}>Disable</button>
                            </div>
                        )}
                    </div>
                );
            },
        }),
    ];

    const filteredUsers = useMemo(
        () => users.filter(u => u.isActive || showInactive),
        [users, showInactive]
    );

    const table = useReactTable({
        data: filteredUsers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: originalRow => originalRow.user_id,
        enableRowSelection: true
    })

    const handleEdit = (userId: string) => {
        navigate(`/user/profile/${userId}`);
    };

    const handleDisable = async (userId: string) => {
        const { error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('user_id', userId);

        if (error) {
            console.error("Failed to disable dog:", error);
            return;
        }

        fetchUsers();
    };

    const handleDelete = async (userId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this user?");
        if (!confirmed) return;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error("Failed to delete user:", error);
            return;
        }

        setUsers(users.filter(u => u.user_id !== userId));
    };

    const handleMenuClick = (userId: string) => {
        setActiveMenuId(prev => (prev === userId ? null : userId));
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
            <NavBar/>
            <div className="user-container">
                <div className="view-header">
                    <h1>Dogs</h1>
                    <button className="create-btn" onClick={handleUserInvitation}>
                        <span>Invite New User</span>
                    </button>
                </div>
                <div className="user-cards">
                    <Card title="Total Users" value={users.length} />
                </div>
                <Table loading={loading} table={table} />
                <form>
                    <label htmlFor="dog_is_enabled">Show inactive users?</label>
                    <input
                        type="checkbox"
                        id="dog_is_enabled"
                        checked={showInactive}
                        onChange={e => setShowInactive(e.target.checked)}
                        placeholder="Filter by status"
                    />
                </form>
            </div>
        </div>
    )
}