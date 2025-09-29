import {useEffect, useState, useCallback} from "react";
import {supabase} from "../../state/supabaseClient.ts";
import "./UpdateFeed.scss";

import type {DogUpdate} from "../../types/DogUpdate.ts";
import Update from "./Update.tsx";
import {useAuth} from "../../state/hooks/useAuth.ts";
import {getUserFeed} from "../../partials/update.ts";
import {Link} from "react-router";

export default function UpdateFeed() {
    const [updates, setUpdates] = useState<DogUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin, user } = useAuth();
    const userId = user?.id;
    console.log(updates);
    const removeUpdate = useCallback(
        async (id: string) => {
            const confirmed = window.confirm(
                "Are you sure you want to remove this update? This action cannot be undone."
            );
            if (!confirmed) return;

            const prev = updates;
            setUpdates((curr) => curr.filter((u) => u.update_id !== id));

            const { error } = await supabase.from("dog_updates").delete().eq("update_id", id);
            if (error) {
                console.error("Error removing update:", error);
                setUpdates(prev);
                alert("Failed to remove update.");
            }
        },
        [updates]
    );

    useEffect(() => {
        let active = true;

        const fetchUpdates = async () => {
            if (!userId) {
                setUpdates([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Single call — server already excludes archived dogs
                const updatesData = await getUserFeed();
                if (active) setUpdates(updatesData ?? []);
            } catch (err) {
                console.error("Failed to fetch updates:", err);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchUpdates();
        return () => {
            active = false;
        };
    }, [userId]);

    if (!userId) {
        return (
            <div className="no-feed">
                <h1>
                    Please sign in to view your feed.
                </h1>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="no-feed">
                <h1>
                    Loading feed...
                </h1>
            </div>
        );
    }

    if (updates.length === 0) {
        return (
            <div className="no-feed">
                <h1>
                    Follow dogs in order to see their updates.
                </h1>
                <Link to="/dogs">Go to the dogs page.</Link>
            </div>
        );
    }

    return (
        <div className="feed">
            {updates.map((update) => (
                <Update
                    key={update.update_id}
                    update={update}
                    isAdmin={isAdmin}
                    isCreator={update.update_created_by === user.id}
                    removeUpdate={removeUpdate}
                />
            ))}
        </div>
    );
}
