import "./AdminDataManagementView.scss";
import Card from "../../components/info/Card.tsx";
import StatusCard from "../../components/general/StatusCard.tsx";
import {useEffect, useMemo, useState} from "react";
import {supabase} from "../../state/supabaseClient.ts";
import {prettySize} from "../../partials/data.ts";
import type {PruneResult, UsageDetail} from "../../types/Data.ts";

export default function AdminDataManagementView() {
    const [dataUsage, setDataUsage] = useState<UsageDetail[]>([]);
    const [pruneDryRun, setPruneDryRun] = useState<PruneResult | null>(null);
    const [isError, setIsError] = useState(false);
    const [message, setMessage] = useState("");
    const [isPruning, setIsPruning] = useState(false);

    const totalFiles = useMemo(
        () => dataUsage.reduce((sum, usage) => sum + usage.file_count, 0),
        [dataUsage]
    );

    const totalBytes = useMemo(
        () => dataUsage.reduce((sum, usage) => sum + usage.total_bytes, 0),
        [dataUsage]
    );

    const totalPretty = prettySize(totalBytes);
    const totalStorage = 100_000_000_000; // 100 GB quota (adjust as needed)
    const percentageUsed = ((totalBytes / totalStorage) * 100).toFixed(3) + "%";

    const prunableTotal = useMemo(() => {
        if (!pruneDryRun?.orphaned_objects) return 0;
        return Object.values(pruneDryRun.orphaned_objects).reduce((a, b) => a + b, 0);
    }, [pruneDryRun]);

    useEffect(() => {
        // Load usage totals
        async function loadUsage() {
            const { data, error } = await supabase.functions.invoke("data-management", {
                body: { type: "usage" }
            });
            if (error) {
                setMessage("Failed to get storage usage information from the server.");
                setIsError(true);
                return;
            }
            setDataUsage(data as UsageDetail[]);
        }

        // Load dry-run prune stats (limit=0 just means “don’t actually delete” on your side)
        async function loadDryRun() {
            const { data, error } = await supabase.functions.invoke("data-management?limit=0", {
                body: { type: "prune", dry_run: true }
            });
            if (error) {
                // Non-fatal: we can still show usage
                console.error("Failed to get prune dry-run:", error);
                return;
            }
            setPruneDryRun(data as PruneResult);
        }

        loadUsage();
        loadDryRun();
    }, []);

    async function handlePruneNow() {
        if (isPruning) return;

        const ok = window.confirm(
            `This will permanently delete approximately ${prunableTotal.toLocaleString()} orphaned objects.\n` +
            `Are you sure you want to proceed?`
        );
        if (!ok) return;

        setIsPruning(true);
        setIsError(false);
        setMessage("");

        try {
            // Real prune
            const { data, error } = await supabase.functions.invoke("data-management?dry_run=false", {
                body: { type: "prune"}
            });

            if (error) {
                setIsError(true);
                setMessage("Prune failed: " + error.message);
                return;
            }

            const result = data as PruneResult;
            const attempted = result.results?.reduce((s, r) => s + (r.attempted ?? 0), 0) ?? 0;
            const deleted = result.results?.reduce((s, r) => s + (r.deleted ?? 0), 0) ?? 0;
            const errorCount =
                result.results?.reduce((s, r) => s + (r.errors?.length ?? 0), 0) ?? 0;

            setMessage(
                `Prune complete. Deleted ${deleted.toLocaleString()} of ${attempted.toLocaleString()} ` +
                `attempted. Errors: ${errorCount.toLocaleString()}.`
            );

            // Refresh usage + dry-run after prune
            const [usageResp, dryResp] = await Promise.all([
                supabase.functions.invoke("data-management", { body: { type: "usage" } }),
                supabase.functions.invoke("data-management?limit=0", { body: { type: "prune", dry_run: true } })
            ]);

            if (!usageResp.error) setDataUsage(usageResp.data as UsageDetail[]);
            if (!dryResp.error) setPruneDryRun(dryResp.data as PruneResult);
        } catch (e: any) {
            setIsError(true);
            setMessage("Unexpected error running prune.");
            console.error(e);
        } finally {
            setIsPruning(false);
        }
    }

    return (
        <div className="admin-dashboard">
            <StatusCard message={message} isError={isError} />
            <h1>Storage Stats</h1>

            <div className="dog-cards">
                <Card title="Total Files" value={totalFiles.toLocaleString()} />
                <Card title="Total Storage Usage" value={totalPretty} />
                <Card title="Storage Usage" value={percentageUsed} />
                <Card title="Prunable (Dry Run)" value={prunableTotal.toLocaleString()}>
                <button
                    className="btn btn-danger"
                    onClick={handlePruneNow}
                    disabled={isPruning || prunableTotal === 0}
                    title={prunableTotal === 0 ? "Nothing to prune" : "Delete orphaned objects"}
                >
                    {isPruning ? "Pruning…" : "Run prune now"}
                </button>
                </Card>
            </div>
        </div>
    );
}