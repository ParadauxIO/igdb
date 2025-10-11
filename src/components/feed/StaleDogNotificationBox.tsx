import { useEffect, useState } from "react";
import NotificationBox from "./NotificationBox.tsx";
import { getSetting } from "../../partials/settings.ts";
import { getUserFeed, getApprovalQueue } from "../../partials/update.ts";
import { getUserDogs, getDogsWithNames } from "../../partials/dog.ts";

type Props = {
    userId?: string; // optional => system-wide when absent
    className?: string;
};

type Dog = { dog_id: string; dog_name?: string };
type Update = {
    dog_id: string;
    update_created_at: string | Date;
    update_created_by: string;
};

function formatDogList(dogNames: string[]): string {
    if (dogNames.length === 0) return "";
    if (dogNames.length === 1) return dogNames[0];
    if (dogNames.length === 2) return `${dogNames[0]} or ${dogNames[1]}`;
    return `${dogNames.slice(0, -1).join(", ")}, or ${dogNames[dogNames.length - 1]}`;
}

export default function StaleDogNotification({ userId, className }: Props) {
    const [show, setShow] = useState(false);
    const [formattedDogList, setFormattedDogList] = useState("");
    const [periodDays, setPeriodDays] = useState<number>(30);
    const [isUserScoped, setIsUserScoped] = useState<boolean>(!!userId);

    useEffect(() => {
        let active = true;

        async function run() {
            // 1) Load configurable window, default 30
            const settingVal = await getSetting("notificationPeriodDays");
            const parsed = parseInt(settingVal ?? "", 10);
            const NOTIFICATION_PERIOD_DAYS = !Number.isNaN(parsed) ? parsed : 30;
            const THRESHOLD = new Date(
                Date.now() - NOTIFICATION_PERIOD_DAYS * 24 * 60 * 60 * 1000
            );

            // 2) Decide mode
            const userScoped = !!userId;
            setIsUserScoped(userScoped);

            // 3) Fetch dogs + updates for chosen scope
            let dogs: Dog[] = [];
            let updates: Update[] = [];

            if (userScoped) {
                if (!userId) return; // defensive
                const [myDogs, userFeed] = await Promise.all([
                    getUserDogs(userId),
                    getUserFeed(),
                ]);
                dogs = myDogs ?? [];
                updates = (userFeed ?? []) as Update[];
            } else {
                const [allDogs, allUpdates] = await Promise.all([
                    getDogsWithNames(),
                    getApprovalQueue(true),
                ]);
                dogs = allDogs?.filter(dog => !dog.dog_is_archived) ?? [];
                updates = (allUpdates ?? []) as Update[];
            }

            // 4) Latest update per dog
            const latestByDog = new Map<string, Date>();
            for (const u of updates) {
                // For user mode, only count posts BY this user. For system mode, count any post.
                if (userScoped && u.update_created_by !== userId) continue;

                const ts = new Date(u.update_created_at);
                const prev = latestByDog.get(u.dog_id);
                if (!prev || ts > prev) latestByDog.set(u.dog_id, ts);
            }

            // 5) Dogs with no update or stale updates
            const staleDogs = (dogs ?? [])
                .filter((dog) => {
                    const last = latestByDog.get(dog.dog_id);
                    return !last || last < THRESHOLD;
                })
                .map((dog) => dog.dog_name ?? "(Unnamed dog)");

            if (!active) return;

            setPeriodDays(NOTIFICATION_PERIOD_DAYS);
            setFormattedDogList(formatDogList(staleDogs));
            setShow(staleDogs.length > 0);
        }

        run().catch((e) => console.error("StaleDogNotification failed:", e));
        return () => {
            active = false;
        };
    }, [userId]);

    if (!show || !formattedDogList) return null;

    const intervalStr = `${periodDays} day${periodDays === 1 ? "" : "s"}`;
    const message = isUserScoped
        ? `You haven’t posted about ${formattedDogList} in the last ${intervalStr}.`
        : `The following dogs haven't had an update in the past ${intervalStr}: ${formattedDogList}`;

    return (
        <div className={className}>
            <NotificationBox
                message={message}
                linkText={isUserScoped ? "Create a new post here!" : undefined}
                linkHref={isUserScoped ? "/update/post" : undefined}
                onClose={() => setShow(false)}
            />
        </div>
    );
}