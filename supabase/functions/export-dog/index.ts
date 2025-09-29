// supabase/functions/export-dog/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TarStream } from "jsr:@std/tar/tar-stream";

/* ==============================
 * Config
 * ============================== */
const ALLOWED_ORIGINS = [
    "https://dogs.guidedogs.ie",
];

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Buckets
const BUCKET_AVATARS = "dog-avatars";
const BUCKET_UPDATES = "dog-updates";

/* ==============================
 * CORS helpers
 * ============================== */
function buildCorsHeaders(origin: string, isAllowed: boolean, req: Request) {
    const reqHeaders =
        req.headers.get("Access-Control-Request-Headers") ??
        "authorization, x-client-info, apikey, content-type";
    return {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": reqHeaders,
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin, Access-Control-Request-Headers, Access-Control-Request-Method",
    };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
    });
}

/* ==============================
 * Supabase helpers
 * ============================== */
function getServiceClient() {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    return createClient(SUPABASE_URL, SERVICE_ROLE);
}

async function getAuthedUserFromBearer(supabase: ReturnType<typeof createClient>, req: Request) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
}

async function assertAdminOr403(
    supabase: ReturnType<typeof createClient>,
    requesterId: string,
    cors: Record<string, string>,
) {
    const { data: row, error } = await supabase
        .from("users")
        .select("permission_role")
        .eq("id", requesterId)
        .single();

    if (error || !row || row.permission_role !== "admin") {
        return json({ error: "Forbidden: Admin access required" }, 403, cors);
    }
    return null;
}

/* ==============================
 * Utilities (unchanged)
 * ============================== */
function assertUuid(id: string) {
    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id,
        )
    ) {
        throw new Error("Invalid dog_id");
    }
}

function parsePublicUrl(url: string) {
    const marker = "/storage/v1/object/public/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const rel = url.slice(idx + marker.length);
    const [bucket, ...rest] = rel.split("/");
    if (!bucket || !rest.length) return null;
    return { bucket, path: rest.join("/") };
}

function csvEscape(val: unknown) {
    if (val === null || val === undefined) return "";
    const s =
        Array.isArray(val) || typeof val === "object"
            ? JSON.stringify(val)
            : String(val);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsvBytes(rows: Record<string, unknown>[]) {
    if (!rows.length) return new Uint8Array(); // empty file is fine
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => csvEscape((r as any)[h])).join(",")),
    ].join("\r\n");
    return new TextEncoder().encode(lines + "\r\n");
}

/* ==============================
 * Entrypoint
 * ============================== */
Deno.serve(async (req) => {
    const origin = req.headers.get("origin") ?? "";
    const isAllowed = ALLOWED_ORIGINS.includes(origin);
    const cors = buildCorsHeaders(origin, isAllowed, req);

    // Preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
    }

    if (!isAllowed) {
        return json({ error: "Origin not allowed" }, 403, cors);
    }

    if (req.method !== "POST") {
        return json({ error: "Method not allowed" }, 405, cors);
    }

    try {
        const supabase = getServiceClient();

        // Auth
        const authed = await getAuthedUserFromBearer(supabase, req);
        if (!authed) return json({ error: "Unauthenticated" }, 401, cors);

        // Admin gate
        const forbid = await assertAdminOr403(supabase, authed.id, cors);
        if (forbid) return forbid;

        // Body
        const { dog_id } = await req.json().catch(() => ({}));
        assertUuid(String(dog_id));

        // Fetch DB rows
        const { data: dog, error: eDog } = await supabase
            .from("dogs")
            .select("*")
            .eq("dog_id", dog_id)
            .maybeSingle();
        if (eDog) throw eDog;
        if (!dog) return json({ error: "Dog not found" }, 404, cors);

        const { data: updates, error: eUpd } = await supabase
            .from("dog_updates")
            .select("*")
            .eq("dog_id", dog_id);
        if (eUpd) throw eUpd;

        const { data: history, error: eHist } = await supabase
            .from("dog_history")
            .select("*")
            .eq("dog_id", dog_id);
        if (eHist) throw eHist;

        // Pre-build CSV blobs
        const dogsCsv = toCsvBytes([dog]);
        const updatesCsv = toCsvBytes(updates ?? []);
        const historyCsv = toCsvBytes(history ?? []);

        // Storage clients
        const avatarsBucket = supabase.storage.from(BUCKET_AVATARS);
        const updatesBucket = supabase.storage.from(BUCKET_UPDATES);

        // Collect referenced media paths (dedup)
        const mediaSet = new Set<string>();

        // 1) Avatar
        if (dog.dog_picture) {
            const parsed = parsePublicUrl(dog.dog_picture);
            if (parsed && parsed.bucket === BUCKET_AVATARS) {
                mediaSet.add(`${parsed.bucket}/${parsed.path}`);
            }
        } else {
            const list = await avatarsBucket.list(String(dog_id), { limit: 1000 });
            for (const f of list ?? []) {
                // supabase-js returns { data, error }; esm.sh edge may return array directly in Deno
                const name = (f as any)?.name ?? (f as unknown as string);
                if (name) mediaSet.add(`${BUCKET_AVATARS}/${dog_id}/${name}`);
            }
        }

        // 2) Update media
        for (const row of updates ?? []) {
            const urls = Array.isArray(row.update_media_urls) ? row.update_media_urls : [];
            for (const url of urls) {
                const parsed = parsePublicUrl(url);
                if (parsed && parsed.bucket === BUCKET_UPDATES && parsed.path.startsWith(`${dog_id}/`)) {
                    mediaSet.add(`${parsed.bucket}/${parsed.path}`);
                }
            }
        }

        // Async generator of TarStream entries
        async function* entries() {
            yield { type: "directory", path: "csv/" } as const;
            yield { type: "directory", path: "media/" } as const;
            yield { type: "directory", path: "media/avatars/" } as const;
            yield { type: "directory", path: "media/updates/" } as const;

            yield {
                type: "file",
                path: "csv/dogs.csv",
                size: dogsCsv.byteLength,
                readable: new Blob([dogsCsv]).stream(),
            } as const;

            yield {
                type: "file",
                path: "csv/dog_updates.csv",
                size: updatesCsv.byteLength,
                readable: new Blob([updatesCsv]).stream(),
            } as const;

            yield {
                type: "file",
                path: "csv/dog_history.csv",
                size: historyCsv.byteLength,
                readable: new Blob([historyCsv]).stream(),
            } as const;

            for (const full of mediaSet) {
                const [bucket, ...rest] = full.split("/");
                const path = rest.join("/");
                const filename = path.split("/").pop() ?? "file";

                if (bucket === BUCKET_AVATARS) {
                    const dl = await avatarsBucket.download(path);
                    if ((dl as any).error) continue;
                    const blob = (dl as any).data as Blob;
                    yield { type: "file", path: `media/avatars/${filename}`, size: blob.size, readable: blob.stream() } as const;
                } else if (bucket === BUCKET_UPDATES) {
                    const dl = await updatesBucket.download(path);
                    if ((dl as any).error) continue;
                    const blob = (dl as any).data as Blob;
                    const parts = path.split("/");
                    const userId = parts.length >= 2 ? parts[1] : "unknown";
                    yield {
                        type: "file",
                        path: `media/updates/${userId}/${filename}`,
                        size: blob.size,
                        readable: blob.stream(),
                    } as const;
                }
            }
        }

        // Stream tar.gz
        const body = ReadableStream.from(entries())
            .pipeThrough(new TarStream())
            .pipeThrough(new CompressionStream("gzip"));

        const base =
            dog.dog_name ? `${String(dog.dog_name).replace(/\s+/g, "_")}-${dog_id}` : String(dog_id);

        return new Response(body, {
            status: 200,
            headers: {
                ...cors,
                "Content-Type": "application/gzip",
                "Content-Disposition": `attachment; filename="${base}.tar.gz"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err: any) {
        console.error(err);
        return json({ error: String(err?.message ?? err) }, 400, cors);
    }
});