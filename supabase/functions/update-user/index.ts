// supabase/functions/update-user/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS config
const allowedOrigins = [
    "https://dogs.guidedogs.ie", // Production
    "http://localhost:5173",     // Local
    "https://igdb-demo.paradaux.io", // IGDB sandbox alt domain
    "https://igdb.pages.dev"         // IGDB sandbox
];

function corsHeaders(origin: string, isAllowed: boolean) {
    return {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Vary": "Origin",
    };
}

Deno.serve(async (req) => {
    const origin = req.headers.get("origin") ?? "";
    const isAllowed = allowedOrigins.includes(origin);

    // Preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: getCorsHeaders(origin, isAllowed, req) });
    }

    if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Origin not allowed" }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...getCorsHeaders(origin, isAllowed, req) },
        });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) },
        });
    }

    try {
        const { type, name, phone, password } = await req.json();

        if (type !== "onboard" && type !== "update") {
            return new Response(JSON.stringify({ error: "Invalid type" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) },
            });
        }

        // Service-role client for DB + Auth Admin
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Get the authenticated user from the bearer token
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);

        if (userErr || !userData?.user) {
            return new Response(JSON.stringify({ error: "Unauthenticated" }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) },
            });
        }

        const authedUser = userData.user;

        // Fetch current app user row (service role bypasses RLS)
        const { data: existingRow, error: fetchErr } = await supabase
            .from("users")
            .select("id, has_accepted_terms")
            .eq("id", authedUser.id)
            .maybeSingle();

        if (fetchErr) {
            throw fetchErr;
        }

        // Guard: prevent re-onboarding when already accepted
        if (type === "onboard" && existingRow?.has_accepted_terms === true) {
            return new Response(JSON.stringify({ error: "User already onboarded" }), {
                status: 409, // Conflict
                headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) },
            });
        }

        // Build allowed updates
        const updates: Record<string, unknown> = {
            name: name ?? null,
            phone: phone ?? null,
            updated_at: new Date().toISOString(),
        };

        if (type === "onboard") {
            updates.has_accepted_terms = true;
        }

        // If the row doesn't exist yet, create it on first touch (safe because PK = auth.users.id)
        let dbErr = null;
        if (!existingRow) {
            const { error: insertErr } = await supabase
                .from("users")
                .insert([{ id: authedUser.id, ...updates }]);
            dbErr = insertErr ?? null;
        } else {
            const { error: updateErr } = await supabase
                .from("users")
                .update(updates)
                .eq("id", authedUser.id);
            dbErr = updateErr ?? null;
        }

        if (dbErr) throw dbErr;

        // Password change via Auth Admin (optional)
        if (password && password.trim().length > 0) {
            const { error: passErr } = await supabase.auth.admin.updateUserById(authedUser.id, {
                password,
            });
            if (passErr) throw passErr;
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) },
        });

    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err?.message ?? "Unknown error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) },
        });
    }
});

function getCorsHeaders(origin: string, isAllowed: boolean, req: Request) {
    // Echo whatever the browser asked for, fallback to the usual Supabase headers
    const reqHeaders =
        req.headers.get("Access-Control-Request-Headers") ??
        "authorization, x-client-info, apikey, content-type";

    return {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": reqHeaders,
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin, Access-Control-Request-Headers, Access-Control-Request-Method",
    };
}
