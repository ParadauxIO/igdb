import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ObjRow = { bucket_id: string; name: string };
type Ref = { bucket: string; path: string };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Safety rails
if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const BUCKETS = new Set(["dog-avatars", "dog-updates"]);
const PUBLIC_PREFIX = "/storage/v1/object/public/"; // default public URL prefix

// Extract {bucket, path} from a public URL string, if it is one of our buckets
function extractRef(url: string): Ref | null {
    if (!url) return null;
    try {
        // tolerate plain paths accidentally stored
        if (url.startsWith(PUBLIC_PREFIX)) {
            const rest = url.slice(PUBLIC_PREFIX.length);
            const [bucket, ...restParts] = rest.split("/");
            const path = restParts.join("/");
            if (BUCKETS.has(bucket) && path) return { bucket, path: decodeURIComponent(path) };
            return null;
        }

        // full absolute URL
        const u = new URL(url);
        // look for “…/storage/v1/object/public/<bucket>/<path>”
        const idx = u.pathname.indexOf(PUBLIC_PREFIX);
        if (idx >= 0) {
            const after = u.pathname.slice(idx + PUBLIC_PREFIX.length);
            const [bucket, ...restParts] = after.split("/");
            const path = restParts.join("/");
            if (BUCKETS.has(bucket) && path) return { bucket, path: decodeURIComponent(path) };
        }

        // not a recognised public URL for our buckets
        return null;
    } catch {
        // garbage string, ignore
        return null;
    }
}

function chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) return [arr];
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

serve(async (req) => {
    try {

        const url = new URL(req.url);
        const dryRun = (url.searchParams.get("dry_run") ?? "true").toLowerCase() === "true";
        const limit = Number(url.searchParams.get("limit") ?? "0"); // optional cap for testing (0 = no cap)
        const deleteBatchSize = Number(url.searchParams.get("batch_size") ?? "100");

        const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
            auth: { persistSession: false },
        });

        // 1) Collect referenced file paths from DB
        // dogs.dog_picture (TEXT, nullable)
        const { data: dogPics, error: dogPicsErr } = await admin
            .from("dogs")
            .select("dog_picture")
            .returns<{ dog_picture: string | null }[]>();

        if (dogPicsErr) throw dogPicsErr;

        // dog_updates.update_media_urls (TEXT[], nullable)
        const { data: mediaRows, error: mediaErr } = await admin
            .from("dog_updates")
            .select("update_media_urls")
            .returns<{ update_media_urls: string[] | null }[]>();

        if (mediaErr) throw mediaErr;

        const referenced = new Set<string>(); // key: `${bucket}/${path}`

        for (const row of dogPics ?? []) {
            const r = row.dog_picture ? extractRef(row.dog_picture) : null;
            if (r) referenced.add(`${r.bucket}/${r.path}`);
        }

        for (const row of mediaRows ?? []) {
            const urls = row.update_media_urls ?? [];
            for (const u of urls) {
                const r = extractRef(u);
                if (r) referenced.add(`${r.bucket}/${r.path}`);
            }
        }

        // 2) Enumerate ALL storage objects for our buckets via storage.objects (admin)
        //    This avoids brittle recursive storage.list calls.
        //    Note: storage.objects is in the 'storage' schema.
        const { data: objs, error: objsErr } = await admin
            .schema("storage")
            .from<ObjRow>("objects")
            .select("bucket_id,name");

        if (objsErr) throw objsErr;

        // Filter to our target buckets
        let candidates = (objs ?? []).filter((o) => BUCKETS.has(o.bucket_id));
        if (limit > 0) candidates = candidates.slice(0, limit);

        // 3) Partition into keep vs delete
        const toDeleteByBucket = new Map<string, string[]>();
        let keepCount = 0;

        for (const o of candidates) {
            const key = `${o.bucket_id}/${o.name}`;
            if (referenced.has(key)) {
                keepCount++;
            } else {
                const arr = toDeleteByBucket.get(o.bucket_id) ?? [];
                arr.push(o.name); // storage.remove expects paths w/o bucket
                toDeleteByBucket.set(o.bucket_id, arr);
            }
        }

        // 4) Optionally delete in batches
        const results: Array<{
            bucket: string;
            attempted: number;
            deleted: number;
            errors: Array<{ path: string; message: string }>;
        }> = [];

        if (!dryRun) {
            for (const [bucket, paths] of toDeleteByBucket) {
                let deleted = 0;
                const errors: Array<{ path: string; message: string }> = [];

                for (const group of chunk(paths, deleteBatchSize)) {
                    const { error } = await admin.storage.from(bucket).remove(group);
                    if (error) {
                        // storage.remove fails entire batch; mark individually for visibility
                        for (const p of group) errors.push({ path: p, message: error.message });
                    } else {
                        deleted += group.length;
                    }
                }

                results.push({ bucket, attempted: paths.length, deleted, errors });
            }
        }

        // 5) Build response
        const summary = {
            dry_run: dryRun,
            examined_objects: candidates.length,
            referenced_objects: keepCount,
            orphaned_objects: [...toDeleteByBucket.entries()].reduce(
                (acc, [b, arr]) => ({ ...acc, [b]: arr.length }),
                {} as Record<string, number>,
            ),
            ...(dryRun
                ? {
                    sample_orphans: [...toDeleteByBucket.entries()].reduce(
                        (acc, [b, arr]) => ({ ...acc, [b]: arr.slice(0, 10) }),
                        {} as Record<string, string[]>,
                    ),
                }
                : { results }),
        };

        return new Response(JSON.stringify(summary, null, 2), {
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
});