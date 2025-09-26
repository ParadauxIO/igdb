// supabase/functions/storage-maintenance/main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ======= CORS allow-list =======
const ALLOWED_ORIGINS = [
    "https://dogs.guidedogs.ie"
];

// ======= Config =======
const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const BUCKETS = new Set<string>([
    "sample",
    "dog-avatars",
    "dog-updates",
]);

const PUBLIC_PREFIX = "/storage/v1/object/public/"; // default public URL prefix

// ======= Helpers =======
function getCorsHeaders(origin: string | null) {
    const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "";
    const h = new Headers();
    if (allow) h.set("Access-Control-Allow-Origin", allow);
    h.set("Vary", "Origin");
    h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    h.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    h.set("Access-Control-Max-Age", "600");
    return h;
}

function chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) return [arr];
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

// Extract {bucket, path} from a public URL string (ours only)
function extractRef(url?: string | null): { bucket: string; path: string } | null {
    if (!url) return null;
    try {
        if (url.startsWith(PUBLIC_PREFIX)) {
            const rest = url.slice(PUBLIC_PREFIX.length);
            const [bucket, ...restParts] = rest.split("/");
            const path = restParts.join("/");
            if (BUCKETS.has(bucket) && path) return { bucket, path: decodeURIComponent(path) };
            return null;
        }
        const u = new URL(url);
        const idx = u.pathname.indexOf(PUBLIC_PREFIX);
        if (idx >= 0) {
            const after = u.pathname.slice(idx + PUBLIC_PREFIX.length);
            const [bucket, ...restParts] = after.split("/");
            const path = restParts.join("/");
            if (BUCKETS.has(bucket) && path) return { bucket, path: decodeURIComponent(path) };
        }
        return null;
    } catch {
        return null;
    }
}

serve(async (req) => {
    const origin = req.headers.get("Origin");
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
        return new Response(JSON.stringify({ error: "Server misconfigured" }), {
            status: 500,
            headers: { ...Object.fromEntries(corsHeaders), "content-type": "application/json" },
        });
    }

    try {
        // Parse body
        const body = await req.json().catch(() => ({}));
        const type = String(body?.type ?? "").toLowerCase();

        // ======= Auth as the CALLER (for role check) =======
        const authHeader = req.headers.get("Authorization") || "";
        const userClient = createClient(SUPABASE_URL, ANON_KEY, {
            auth: { persistSession: false },
            global: { headers: { Authorization: authHeader } },
        });

        const { data: authUser, error: authErr } = await userClient.auth.getUser();
        if (authErr || !authUser?.user) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }
        const userId = authUser.user.id;

        // Check app-level role
        const { data: userRow, error: roleErr } = await userClient
            .from("users")
            .select("permission_role")
            .eq("id", userId)
            .single();

        if (roleErr || !userRow || userRow.permission_role !== "admin") {
            return new Response("Forbidden: Admin access required", { status: 403, headers: corsHeaders });
        }

        // ======= Admin client (service role) for internal ops =======
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

        if (type === "usage") {
            // Call your existing RPC for usage
            const { data, error } = await admin.rpc("bucket_usage");
            if (error) {
                console.error("[bucket_usage] RPC error:", error);
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...Object.fromEntries(corsHeaders), "content-type": "application/json" },
                });
            }
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    ...Object.fromEntries(corsHeaders),
                    "content-type": "application/json",
                    "Cache-Control": "public, max-age=60",
                },
            });
        }

        if (type === "prune") {
            // Optional query params for test runs
            const url = new URL(req.url);
            const dryRun = (url.searchParams.get("dry_run") ?? "true").toLowerCase() === "true";
            const limit = Number(url.searchParams.get("limit") ?? "0");
            const deleteBatchSize = Number(url.searchParams.get("batch_size") ?? "100");

            // 1) Collect referenced file paths from DB
            const { data: dogPics, error: dogPicsErr } = await admin
                .from("dogs")
                .select("dog_picture")
                .returns<{ dog_picture: string | null }[]>();
            if (dogPicsErr) throw dogPicsErr;

            const { data: mediaRows, error: mediaErr } = await admin
                .from("dog_updates")
                .select("update_media_urls")
                .returns<{ update_media_urls: string[] | null }[]>();
            if (mediaErr) throw mediaErr;

            const referenced = new Set<string>();
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

            // 2) Enumerate ALL storage objects via RPC (SECURITY DEFINER on storage.objects)
            const { data: objs, error: objsErr } = await admin.rpc("list_storage_objects", {
                buckets: Array.from(BUCKETS),
            });
            if (objsErr) throw objsErr;

            // Filter/limit to our buckets and apply limit if requested
            let candidates = (objs ?? []).filter(
                (o: { bucket_id: string; name: string }) => BUCKETS.has(o.bucket_id),
            ) as { bucket_id: string; name: string }[];

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
                    arr.push(o.name);
                    toDeleteByBucket.set(o.bucket_id, arr);
                }
            }

            // 4) Optionally delete in batches
            const results: Array<{ bucket: string; attempted: number; deleted: number; errors: any[] }> = [];
            if (!dryRun) {
                for (const [bucket, paths] of toDeleteByBucket) {
                    let deleted = 0;
                    const errors: any[] = [];
                    for (const group of chunk(paths, deleteBatchSize)) {
                        const { error } = await admin.storage.from(bucket).remove(group);
                        if (error) {
                            for (const p of group) errors.push({ path: p, message: error.message });
                        } else {
                            deleted += group.length;
                        }
                    }
                    results.push({ bucket, attempted: paths.length, deleted, errors });
                }
            }

            // 5) Response
            const summary = {
                dry_run: dryRun,
                examined_objects: candidates.length,
                referenced_objects: keepCount,
                orphaned_objects: Object.fromEntries(
                    [...toDeleteByBucket.entries()].map(([b, arr]) => [b, arr.length]),
                ),
                ...(dryRun
                    ? {
                        sample_orphans: Object.fromEntries(
                            [...toDeleteByBucket.entries()].map(([b, arr]) => [b, arr.slice(0, 10)]),
                        ),
                    }
                    : { results }),
            };

            return new Response(JSON.stringify(summary, null, 2), {
                status: 200,
                headers: { ...Object.fromEntries(corsHeaders), "content-type": "application/json" },
            });
        }

        // Bad request
        return new Response(
            JSON.stringify({ error: 'Invalid type. Use {"type":"usage"} or {"type":"prune"}.' }),
            {
                status: 400,
                headers: { ...Object.fromEntries(corsHeaders), "content-type": "application/json" },
            },
        );
    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
            status: 500,
            headers: { ...Object.fromEntries(getCorsHeaders(req.headers.get("Origin"))), "content-type": "application/json" },
        });
    }
});