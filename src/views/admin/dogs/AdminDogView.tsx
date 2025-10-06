import {useEffect, useMemo, useState} from "react";
import "./AdminDogView.scss";
import {supabase} from "../../../state/supabaseClient.ts";

import {FaPlus} from "react-icons/fa";
import {getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useNavigate} from "react-router";
import type {Dog} from "../../../types/Dog.ts";
import Table from "../../../components/info/Table.tsx";
import {archiveDog, deleteDog, exportDogArchive, getDogsWithNames} from "../../../partials/dog.ts";
import {getAdminDogViewColumns} from "../../../types/columns/admin-dog-view-columns.tsx";
import { FaFilter } from 'react-icons/fa';

export default function AdminDogView() {
    const [dogs, setDogs] = useState<Dog[]>([])
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [sortByLongestNoPost, setSortByLongestNoPost] = useState<boolean>(false);

const filteredDogs = useMemo(() => {
    let list = dogs.filter(dog => !dog.dog_is_archived || showArchived);

    if (sortByLongestNoPost) {
        list = [...list].sort((a, b) => {
            const normalize = (val: number | string | null | undefined): number => {
                if (val === null || val === undefined) return -2; // blanks last
                if (val === 'Never') return -1;                   // 'Never' after numbers
                if (typeof val === 'number') return val;
                return -2; // fallback
            };

            const aDays = normalize(a.days_since_last_posted);
            const bDays = normalize(b.days_since_last_posted);

            return bDays - aDays; // descending
        });
    }

    return list;
}, [dogs, showArchived, sortByLongestNoPost]);

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

    const handleExportDog = async (dogId: string) => {
        setIsExporting(true);
        await exportDogArchive(dogId);
        setIsExporting(false);
    }

    const adminDogViewColumns = getAdminDogViewColumns({handleEditDog, handleDeleteDog, handleArchiveDog, handleExportDog})

    const table = useReactTable({
        data: filteredDogs,
        columns: adminDogViewColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: originalRow => originalRow.dog_id,
        enableRowSelection: true
    })

    async function loadDogs() {
        setLoading(true);

        // 1. Fetch all dogs
        const returnedDogs = await getDogsWithNames();

        if (!returnedDogs) {
            setLoading(false);
            return;
        }

        // 2. Fetch latest update per dog
        const { data: updatesData, error: updatesError } = await supabase
            .from("dog_updates")
            .select("dog_id, update_created_at")
            .order("update_created_at", { ascending: false });

        if (updatesError) {
            console.error("Failed to fetch updates:", updatesError);
            setLoading(false);
            return;
        }

        console.log("updatesData:", updatesData);

        // 3. Map latest update per dog
        const latestUpdateByDog: Record<string, string> = {};
        for (const update of updatesData ?? []) {
            const dogId = update.dog_id;
            if (!latestUpdateByDog[dogId]) {
            latestUpdateByDog[dogId] = update.update_created_at;
            }
        }

        // 4. Compute days since last update for each dog
        const today = new Date();
        const enrichedDogs = returnedDogs.map(dog => {
            const lastUpdate = latestUpdateByDog[dog.dog_id];
            if (!lastUpdate) {
            return { ...dog, days_since_last_posted: "Never" };
            }
            const lastUpdateDate = new Date(lastUpdate);
            const diffTime = today.getTime() - lastUpdateDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return { ...dog, days_since_last_posted: diffDays };
        });

        // 5. Set enriched dogs state
        setDogs(enrichedDogs);
        setLoading(false);
        }

        useEffect(() => {
            loadDogs();
    }, []);

    if (isExporting) {
        return (
            <div className="dog-view">
                <div className="exporting">
                    <h1>Currently Exporting</h1>
                    <p> Please wait this may take some time.</p>
                    <p>A 'tar.gz' file will be downloaded with the dog's media and text content.</p>
                    <p>This file can be opened with tools such as 7zip or WinRar.</p>
                </div>
            </div>
        )
    }

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
                <div className="dog-count">
                    <div className="left">
                        Total Dogs: <span id="total-count">{dogs.length}</span>
                    </div>
                    <div className="right">
                        <form>
                            <label htmlFor="dog_is_enabled">Show archived dogs?</label>
                            <input
                                type="checkbox"
                                id="dog_is_enabled"
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
                <div className="table-wrapper">
                    <Table loading={loading} table={table}/>
                </div>
            </div>
        </div>
    )
}