import Card from "../../components/info/Card.tsx";
import {useEffect, useState} from "react";
import {getDogsWithNames} from "../../partials/dog.ts";
import type {Dog} from "../../types/Dog.ts";
import "./AdminDashboardView.scss";
import ApprovalQueue from "../../components/admin/ApprovalQueue.tsx";
import type {DogUpdate} from "../../types/DogUpdate.ts";
import {getApprovalQueue} from "../../partials/update.ts";
import type {User} from "../../types/User.ts";
import {getUsers} from "../../partials/users.ts";

export default function AdminDashboardView() {
    console.log("AdminDashboardView rendered");
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [approvalQueue, setApprovalQueue] = useState<DogUpdate[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    async function load() {
        const returnedDogs = await getDogsWithNames();
        const returnedApprovalQueue = await getApprovalQueue(false);
        const returnedUsers = await getUsers();

        if (returnedDogs) {
            setDogs(returnedDogs);
        }

        if (returnedApprovalQueue) {
            setApprovalQueue(returnedApprovalQueue);
        }

        if (returnedUsers) {
            setUsers(returnedUsers);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <div className="dog-cards">
                <Card title="Approvals Pending" value={approvalQueue.length}/>
                <Card title="Total Dogs" value={dogs.length}/>
                <Card title="Total Users" value={users.length}/>
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
                <ApprovalQueue/>
            </div>
        </div>
    );
}