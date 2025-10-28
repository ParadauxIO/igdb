import {serve} from "https://deno.land/std@0.224.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.45.4";
// ======== CONFIG ========
const allowedOrigins = new Set([
    "https://dogs.guidedogs.ie",
]);

// ======== CORS ========
function cors(origin) {
    const h = {
        Vary: "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
    };
    if (origin && allowedOrigins.has(origin)) h["Access-Control-Allow-Origin"] = origin;
    return h;
}

function json(status, body, origin) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...cors(origin)
        }
    });
}

// ======== ENV & CLIENTS ========
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!supabaseUrl || !serviceRole) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(supabaseUrl, serviceRole); // bypasses RLS
// ======== HANDLER ========
serve(async (req) => {
    const origin = req.headers.get("origin");
    // Preflight
    if (req.method === "OPTIONS") return new Response(null, {
        status: 204,
        headers: cors(origin)
    });
    if (req.method !== "POST") return json(405, {
        code: "METHOD_NOT_ALLOWED"
    }, origin);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, {
        code: "NO_AUTH"
    }, origin);
    const caller = createClient(supabaseUrl, anonKey, {
        global: {
            headers: {
                Authorization: authHeader
            }
        }
    });
    const {data: authInfo, error: authErr} = await caller.auth.getUser();
    if (authErr || !authInfo?.user) return json(401, {
        code: "INVALID_SESSION"
    }, origin);
    const {
        data: callerRow,
        error: roleErr
    } = await caller.from("users").select("permission_role").eq("id", authInfo.user.id).single();
    if (roleErr || callerRow?.permission_role !== "admin") return json(403, {
        code: "FORBIDDEN"
    }, origin);
    let body;
    try {
        body = await req.json();
    } catch {
        return json(400, {
            code: "BAD_JSON"
        }, origin);
    }
    const id = body?.id;
    if (!id) return json(400, {
        code: "BAD_REQUEST",
        message: "'id' is required"
    }, origin);
    const {data: targetAuth, error: getUserErr} = await admin.auth.admin.getUserById(id);
    if (getUserErr || !targetAuth?.user) return json(404, {
        code: "NOT_FOUND"
    }, origin);
    // ======== REASSIGN CREATOR / LAST EDITOR ========
    const {
        data: dogsNeedingReassign,
        error: dogsErr
    } = await admin.from("dogs").select("dog_id, dog_current_handlers, dog_created_by, dog_last_edited_by").or(`dog_created_by.eq.${id},dog_last_edited_by.eq.${id}`);
    if (dogsErr) {
        return json(500, {
            code: "FETCH_DOGS_FOR_REASSIGN_FAILED",
            detail: dogsErr.message
        }, origin);
    }
    for (const d of dogsNeedingReassign ?? []) {
        const handlers = d.dog_current_handlers ?? [];
        const replacement = handlers.length > 0 ? handlers[0] : null;
        if (!replacement) continue;
        const payload = {};
        if (d.dog_created_by === id) payload.dog_created_by = replacement;
        if (d.dog_last_edited_by === id) payload.dog_last_edited_by = replacement;
        if (Object.keys(payload).length > 0) {
            const {error: updErr} = await admin.from("dogs").update(payload).eq("dog_id", d.dog_id);
            if (updErr) {
                return json(500, {
                    code: "REASSIGN_FAILED",
                    message: "Failed to reassign creator/editor",
                    detail: updErr.message
                }, origin);
            }
        }
    }
    // ======== DELETE DOG UPDATES / HISTORY ========
    const {error: delHistoryErr} = await admin.from("dog_updates").delete().or(`update_created_by.eq.${id},update_approved_by.eq.${id}`);
    if (delHistoryErr) {
        return json(500, {
            code: "DELETE_HISTORY_FAILED",
            message: "Failed to delete dog updates",
            detail: delHistoryErr.message
        }, origin);
    }
    // ======== DELETE AUTH USER ========
    const {error: delAuthErr} = await admin.auth.admin.deleteUser(id);
    if (delAuthErr) {
        return json(500, {
            code: "AUTH_DELETE_FAILED",
            message: "Failed to delete user",
            detail: delAuthErr.message
        }, origin);
    }
    return json(200, {
        code: "OK",
        ok: true,
        message: "User deleted. Creator/last editor reassigned where a first current handler existed. All dog updates made by that user were deleted."
    }, origin);
});