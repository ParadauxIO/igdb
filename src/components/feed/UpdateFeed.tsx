import {useEffect, useState, useCallback} from "react";
import {supabase} from "../../state/supabaseClient.ts";
import "./UpdateFeed.scss";

import type {DogUpdate} from "../../types/DogUpdate.ts";
import Update from "./Update.tsx";
import {useAuth} from "../../state/hooks/useAuth.ts";
import {getUserFeed} from "../../partials/update.ts";
import { getDogsWithNames } from "../../partials/dog.ts";
import {Link} from "react-router";
import NotificationBox from "./NotificationBox.tsx";

export default function UpdateFeed() {
    const [updates, setUpdates] = useState<DogUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const {isAdmin, user} = useAuth();
    const userId = user?.id; // keep dependency stable
    const [showNotification, setShowNotification] = useState(false);

    const removeUpdate = useCallback(
        async (id: string) => {
            const confirmed = window.confirm(
                "Are you sure you want to remove this update? This action cannot be undone."
            );
            if (!confirmed) return;

            // optimistic update
            const prev = updates;
            setUpdates((curr) => curr.filter((u) => u.update_id !== id));

            const {error} = await supabase
                .from("dog_updates")
                .delete()
                .eq("update_id", id);

            if (error) {
                console.error("Error removing update:", error);
                // rollback
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
            const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            try {
                const [updatesData, dogsData] = await Promise.all([
                  getUserFeed(),
                  getDogsWithNames(),
                ]);

                if (!dogsData) {throw new Error("Failed to load dogs");}
                
                const dogArchiveMap = new Map(
                    dogsData.map((dog) => [dog.dog_id, dog.dog_is_archived])
                );

                // only include updates where the dog is NOT archived
                const filtered = updatesData.filter(
                    (update) => dogArchiveMap.get(update.dog_id) === false
                );

                if (active) setUpdates(filtered);

                // NEW: Check for stale or missing updates
                const myDogs = dogsData.filter(
                    (dog) => dog.dog_current_handler === userId && !dog.dog_is_archived
                );

                const dogIdToLatestUpdate = new Map<string, Date>();

                updatesData.forEach((update) => {
                    const prev = dogIdToLatestUpdate.get(update.dog_id);
                    const updatedAt = new Date(update.update_created_at);
                    if (!prev || updatedAt > prev) {
                    dogIdToLatestUpdate.set(update.dog_id, updatedAt);
                    }
                });

                const hasStaleDogs = myDogs.some((dog) => {
                    const lastUpdate = dogIdToLatestUpdate.get(dog.dog_id);
                    return !lastUpdate || lastUpdate < THIRTY_DAYS_AGO;
                });

                if (active) setShowNotification(hasStaleDogs);
            } catch (err) {
              console.error("Failed to fetch updates or dogs:", err);
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
            {showNotification && (
                <NotificationBox
                    message="You haven't posted in a while! Make sure to update your dogs with recent progress."
                    onClose={() => setShowNotification(false)}
                />
            )}
            {updates.map((update) => (
                <Update
                    key={update.update_id}
                    update={update}
                    isAdmin={isAdmin}
                    removeUpdate={removeUpdate}
                />
            ))}
        </div>
    );
}
