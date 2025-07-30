import Card from "../../components/info/Card.tsx";
import {useEffect, useState} from "react";
import {getDogsWithNames} from "../../partials/dog.ts";
import type {Dog} from "../../types/Dog.ts";
import "./AdminDashboardView.scss";

export default function AdminDashboardView() {
    console.log("AdminDashboardView rendered");
    const [dogs, setDogs] = useState<Dog[]>([]);

    async function load() {
        const returnedDogs = await getDogsWithNames();
        if (returnedDogs) {
            setDogs(returnedDogs);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <div className="dog-cards">
                <Card title="Approvals Pending" value={0}/>
                <Card title="Total Dogs" value={dogs.length}/>
                <Card title="Total Users" value={dogs.length}/> {/* TODO Placeholder for total users, replace with actual data */}
            </div>

            <div className="admin-settings">
                <h1> System Settings </h1>
                <p> Here you can configure the overall system. </p>
                <div>
                    Coming soon.
                </div>
            </div>

            <div className="approval-queue">
                <h1> Approval Queue</h1>
                <p></p>
            </div>
        </div>
    );
}