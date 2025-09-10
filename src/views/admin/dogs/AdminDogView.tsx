import {useEffect, useMemo, useState} from "react";
import "./AdminDogView.scss";
import {FaPlus} from "react-icons/fa";
import {getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useNavigate} from "react-router";
import type {Dog} from "../../../types/Dog.ts";
import Table from "../../../components/info/Table.tsx";
import {archiveDog, deleteDog, getDogsWithNames} from "../../../partials/dog.ts";
import {getAdminDogViewColumns} from "../../../types/columns/admin-dog-view-columns.tsx";

export default function AdminDogView() {
    const [dogs, setDogs] = useState<Dog[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [showArchived, setShowArchived] = useState<boolean>(false);

    const filteredDogs = useMemo(
        () => dogs.filter(dog => !dog.dog_is_archived || showArchived),
        [dogs, showArchived]
    );

    const handleEditDog = (dogId: string) => navigate(`/admin/dogs/edit/${dogId}`);
    const handleDeleteDog = async (dogId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this dog?");
        if (!confirmed) return;
        try {
            await deleteDog(dogId);
            await loadDogs(); 
        } catch (error) {
            alert("Failed to delete dog. Please try again.");
        }
    };
    const handleArchiveDog = (dogId: string) => {
        const confirmed = window.confirm("Are you sure you want to archive this dog?");
        if (!confirmed) return;
        archiveDog(dogId).then(() => loadDogs());
    }

    const adminDogViewColumns = getAdminDogViewColumns({handleEditDog, handleDeleteDog, handleArchiveDog})

    const table = useReactTable({
        data: filteredDogs,
        columns: adminDogViewColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: originalRow => originalRow.dog_id,
        enableRowSelection: true
    })

    async function loadDogs() {
        setLoading(true);
        const returnedDogs = await getDogsWithNames();
        console.log(returnedDogs)
        if (returnedDogs) {
            setDogs(returnedDogs);
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDogs();
    }, []);

    return (
        <div className="dog-view">
            <div className="dog-container">
                <div className="view-header">
                    <h1>Dogs</h1>
                    <button className="create-btn" onClick={() => navigate('/admin/dogs/create')}>
                        <FaPlus/>
                        <span>New Dog</span>
                    </button>
                </div>
                <div className="table-wrapper">
                    <Table loading={loading} table={table}/>
                </div>
                <form>
                    <label htmlFor="dog_is_enabled">Show archived dogs?</label>
                    <input
                        type="checkbox"
                        id="dog_is_enabled"
                        checked={showArchived}
                        onChange={e => setShowArchived(e.target.checked)}
                        placeholder="Filter by status"
                    /></form>
            </div>
        </div>
    )
}