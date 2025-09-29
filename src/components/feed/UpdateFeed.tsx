import {useEffect, useState, useCallback} from "react";
import {supabase} from "../../state/supabaseClient.ts";
import "./UpdateFeed.scss";
import "./NotificationBox.scss"

import type {DogUpdate} from "../../types/DogUpdate.ts";
import Update from "./Update.tsx";
import {useAuth} from "../../state/hooks/useAuth.ts";
import {getUserFeed} from "../../partials/update.ts";
import { getUserDogs } from "../../partials/dog.ts";
import {Link} from "react-router";
import NotificationBox from "./NotificationBox.tsx";

export default function UpdateFeed() {
    const [updates, setUpdates] = useState<DogUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin, user } = useAuth();
    const userId = user?.id;
    const [showNotification, setShowNotification] = useState(false);
    const [formattedDogList, setFormattedDogList] = useState('');

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

    function formatDogList(dogNames: string[]): string {
        if (dogNames.length === 0) return '';
        if (dogNames.length === 1) return dogNames[0];
        if (dogNames.length === 2) return `${dogNames[0]} or ${dogNames[1]}`;
        return `${dogNames.slice(0, -1).join(', ')}, or ${dogNames[dogNames.length - 1]}`;
    }

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
                // Single call — server already excludes archived dogs
                const updatesData = await getUserFeed();

                if (active) setUpdates(updatesData ?? []);

                const myDogs = await getUserDogs(userId);

                // 1. Only consider updates made by this user
                const userUpdates = updatesData.filter(
                (update) => update.update_created_by === userId
                );

                // 2. Build a map of the latest update per dog by this user
                const dogIdToUserLatestUpdate = new Map<string, Date>();

                userUpdates.forEach((update) => {
                const prev = dogIdToUserLatestUpdate.get(update.dog_id);
                const updatedAt = new Date(update.update_created_at);
                if (!prev || updatedAt > prev) {
                    dogIdToUserLatestUpdate.set(update.dog_id, updatedAt);
                }
                });

                // 3. Identify stale dogs (no update or >30 days old)
                const staleDogs = myDogs
                    .filter(dog => {
                        const lastUserUpdate = dogIdToUserLatestUpdate.get(dog.dog_id);
                        return !lastUserUpdate || lastUserUpdate < THIRTY_DAYS_AGO;
                    }).map(dog => dog.dog_name ?? "(Unnamed dog)");

                setFormattedDogList(formatDogList(staleDogs));
                setShowNotification(staleDogs.length > 0);

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
            {showNotification && (
                <NotificationBox
                message={`You haven’t posted about ${formattedDogList} in the last 30 days.`}
                linkText="Create a new post here!"
                linkHref="/update/post"
                onClose={() => setShowNotification(false)}
                />
            )}
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
