import {useEffect, useMemo, useState} from "react";
import "./AdminDogView.scss";
import {FaPlus} from "react-icons/fa";
import {createColumnHelper, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useNavigate} from "react-router";
import type {Dog} from "../../../types/Dog.ts";
import {supabase} from "../../../state/supabaseClient.ts";
import Card from "../../../components/info/Card.tsx";
import Table from "../../../components/info/Table.tsx";
import ActionsDropdown from "../../../components/general/ActionsDropdown.tsx";

const columnHelper = createColumnHelper<Dog>()

export default function AdminDogView() {
    const [dogs, setDogs] = useState<Dog[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [showInactive, setShowInactive] = useState<boolean>(false);

    const columns = [
        // Multiselect checkbox
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

        // Picture
        columnHelper.accessor('dog_picture', {
            header: 'Picture',
            cell: info => info.getValue() ? <img src={info.getValue()!} alt="Dog" width={250} /> : 'No Image',
            footer: info => info.column.id,
        }),

        // Name
        columnHelper.accessor('dog_name', {
            header: 'Name',
            cell: info => info.getValue(),
            footer: info => info.column.id,
        }),

        // Role
        columnHelper.accessor('dog_role', {
            header: 'Role',
            footer: info => info.column.id,
        }),

        // Year of Birth (dog_yob)
        columnHelper.accessor('dog_yob', {
            header: 'Year of Birth',
            cell: info => info.getValue() ? info.getValue().toString() : 'N/A',
            footer: info => info.column.id,
        }),

        // Sex
        columnHelper.accessor('dog_sex', {
            header: 'Sex',
            cell: info => info.getValue() ?? 'Unknown',
            footer: info => info.column.id,
        }),

        // Status
        columnHelper.accessor('dog_status', {
            header: 'Status',
            footer: info => info.column.id,
        }),

        // Current Handler
        columnHelper.accessor('dog_current_handler', {
            header: 'Current Handler',
            cell: info => info.getValue() ?? 'N/A',
            footer: info => info.column.id,
        }),

        // General Notes
        columnHelper.accessor('dog_general_notes', {
            header: 'General Notes',
            cell: info => info.getValue() ?? '',
            footer: info => info.column.id,
        }),

        // Active
        columnHelper.accessor('dog_is_archived', {
            header: 'Active',
            cell: info => info.getValue() ? 'Yes' : 'No',
            footer: info => info.column.id,
        }),

        // Created At
        columnHelper.accessor('dog_created_at', {
            header: 'Created At',
            cell: info => new Date(info.getValue()).toLocaleString(),
            footer: info => info.column.id,
        }),

        // Updated At
        columnHelper.accessor('dog_updated_at', {
            header: 'Updated At',
            cell: info => new Date(info.getValue()).toLocaleString(),
            footer: info => info.column.id,
        }),

        // Created By
        columnHelper.accessor('dog_created_by_name', {
            header: 'Created By',
            footer: info => info.column.id,
        }),

        // Last Edited By
        columnHelper.accessor('dog_last_edited_by_name', {
            header: 'Last Edited By',
            footer: info => info.column.id,
        }),

        // Actions menu remains unchanged
        columnHelper.display({
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const dog = row.original;

                const actions = useMemo(() => [
                    { label: "Edit", action: handleEdit },
                    { label: "Delete", action: handleDelete },
                    { label: "Archive", action: handleDisable }
                ], []);

                return (
                    <ActionsDropdown
                        id={dog.dog_id}
                        actions={actions}
                    />
                );
            }
        }),
    ];

    const filteredDogs = useMemo(
        () => dogs.filter(dog => dog.dog_is_archived|| showInactive),
        [dogs, showInactive]
    );

    const table = useReactTable({
        data: filteredDogs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: originalRow => originalRow.dog_id,
        enableRowSelection: true
    })

    const handleEdit = (dogId: string) => {
        navigate(`/admin/dogs/edit/${dogId}`);
    };

    const handleDisable = async (dogId: string) => {
        const { error } = await supabase
            .from('dogs')
            .update({ dog_is_active: false })
            .eq('dog_id', dogId);

        if (error) {
            console.error("Failed to disable dog:", error);
            return;
        }

        fetchDogs();
    };

    const handleDelete = async (dogId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this dog?");
        if (!confirmed) return;

        const { error } = await supabase
            .from('dogs')
            .delete()
            .eq('dog_id', dogId);

        if (error) {
            console.error("Failed to delete dog:", error);
            return;
        }

        setDogs(dogs.filter(d => d.dog_id !== dogId));
    };



    const handleCreateNew = () => {
        navigate('/admin/dogs/create');
    };

    const fetchDogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('dogs')
            .select(`
        *,
        dog_created_by_user:users!dogs_dog_created_by_fkey (
            name
        ),
        dog_last_edited_by_user:users!dogs_dog_last_edited_by_fkey (
            name
        )
    `)
            .order('dog_created_at', { ascending: false });

        if (error) {
            console.log("Error occurred while fetching dogs:", error);
            return;
        }

        if (data) {
            const flattenedData: Dog[] = data.map(dog => ({
                ...dog,
                dog_created_by_name: dog.dog_created_by_user?.name,
                dog_last_edited_by_name: dog.dog_last_edited_by_user?.name,
            }));
            console.log(flattenedData);
            setDogs(flattenedData);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchDogs();
    }, []);


    return (
        <div className="dog-view">
            <div className="dog-container">
                <div className="view-header">
                    <h1>Dogs</h1>
                    <button className="create-btn" onClick={handleCreateNew}>
                        <FaPlus />
                        <span>New Dog</span>
                    </button>
                </div>
                <div className="dog-cards">
                    <Card title="Total Dogs" value={dogs.length} />
                    <Card title="In Training" value={dogs.filter(dog => dog.dog_status === 'In Training').length} />
                    <Card title="In Service" value={dogs.filter(dog => dog.dog_status === 'Active').length} />
                    <Card title="Actions Awaiting Approval" value={0} />
                </div>
                <Table loading={loading} table={table} />
                <form>
                    <label htmlFor="dog_is_enabled">Show archived dogs?</label>
                    <input
                        type="checkbox"
                        id="dog_is_enabled"
                        checked={showInactive}
                        onChange={e => setShowInactive(e.target.checked)}
                        placeholder="Filter by status"
                    />                </form>
            </div>
        </div>
    )
}