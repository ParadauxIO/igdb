export interface PruneResult {
    dry_run: boolean;
    examined_objects: number;
    referenced_objects: number;

    // Map of bucket → orphan count
    orphaned_objects: Record<string, number>;

    // If dry_run = true: sample_orphans exists
    sample_orphans?: Record<string, string[]>;

    // If dry_run = false: detailed deletion results exist
    results?: Array<{
        bucket: string;
        attempted: number;
        deleted: number;
        errors: Array<{
            path: string;
            message: string;
        }>;
    }>;
}

export interface UsageDetail {
    bucket_id: string;
    file_count: number;
    total_bytes: number;
    total_pretty: string;
}
