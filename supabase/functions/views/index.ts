// /supabase/functions/igdb-view/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// ---------  ENV + INIT ---------
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Single admin client used for *all* DB calls (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRole);

// ---------  CORS ---------
const allowedOrigins = [
    "https://dogs.guidedogs.ie",
];

function getCorsHeaders(origin: string | null) {
    const h: Record<string, string> = {
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    };
    h["Access-Control-Allow-Origin"] =
        origin && allowedOrigins.includes(origin) ? origin : "https://dogs.guidedogs.ie";
    return h;
}

function json(body: unknown, status = 200, cors?: Record<string, string>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...(cors ?? {}) },
    });
}

// ---- VIEWS ----
async function getDogsView(client: any) {
    const { data, error } = await client
        .from("dogs")
        .select("dog_id,dog_name,dog_role,dog_yob,dog_sex,dog_picture")
        .eq("dog_is_archived", false);

    if (error) throw error;
    return data ?? [];
}

async function getUserFeedView(client: any, userId: string) {
    // 1) Dog IDs the user follows
    const { data: follows, error: fErr } = await client
        .from("dog_following")
        .select("dog_id")
        .eq("user_id", userId);

    if (fErr) throw fErr;
    const followedDogIds = (follows ?? []).map((r: any) => r.dog_id);

    // 2) Build OR filter
    // - If user follows dogs: approved updates for those dogs
    // - Always: the user's own updates (approved or not)
    const orParts: string[] = [`update_created_by.eq.${userId}`];
    if (followedDogIds.length > 0) {
        orParts.unshift(
            `and(update_date_approved.not.is.null,dog_id.in.(${followedDogIds.join(",")}))`
        );
    }

    // 3) One-shot query with inner join + archived filter
    const { data, error } = await client
        .from("dog_updates")
        .select(`
            update_id, dog_id, update_title, update_description, update_media_urls,
            update_date_approved, update_created_at, update_created_by, update_approved_by,
            dog:dogs!inner ( dog_id, dog_name, dog_role, dog_yob, dog_sex, dog_picture, dog_is_archived )
            `)
        .or(orParts.join(","))
        .eq("dog.dog_is_archived", false);

    if (error) throw error;

    // 4) Sort by approval time first, then creation
    return (data ?? []).sort(
        (a: any, b: any) =>
            new Date(b.update_date_approved ?? b.update_created_at).getTime() -
            new Date(a.update_date_approved ?? a.update_created_at).getTime()
    );
}

// ---------  HANDLER ---------
serve(async (req) => {
    const origin = req.headers.get("origin");
    const cors = getCorsHeaders(origin);

    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...cors } });
    }

    // Require Bearer token for *validation only*
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return json({ error: "Unauthorized" }, 401, cors);
    }
    const jwt = authHeader.slice("Bearer ".length);

    try {
        // Validate token — do NOT attach Authorization globally to the client
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
        if (userErr || !userData?.user?.id) {
            return json({ error: "Invalid token" }, 401, cors);
        }
        const userId = userData.user.id;

        // Parse body (POST recommended). GET can pass ?view=... if you want.
        let view: string | undefined;
        if (req.method === "POST") {
            const body = await req.json().catch(() => ({}));
            view = body?.view;
        } else {
            const url = new URL(req.url);
            view = url.searchParams.get("view") ?? undefined;
        }

        let payload: unknown;
        switch (view) {
            case "dogs":
                payload = await getDogsView(supabaseAdmin); // runs as service-role (RLS bypass)
                break;
            case "feed":
                payload = await getUserFeedView(supabaseAdmin, userId); // runs as service-role
                break;
            default:
                return json({ error: "invalid view specified" }, 400, cors);
        }

        return json(payload, 200, cors);
    } catch (err: any) {
        const message = typeof err?.message === "string" ? err.message : String(err);
        return json({ error: message }, 500, cors);
    }
});