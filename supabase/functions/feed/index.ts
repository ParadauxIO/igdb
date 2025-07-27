import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// ---------  ENV + INIT ---------
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// ---------  SETTINGS ---------
const allowedOrigins = [
    "http://localhost:5173",
    "https://portal.guidedogs.ie"
];

// ---------  SERVER ---------
serve(async (req) => {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const {
        data: { user },
        error: userError
    } = await client.auth.getUser();

    if (userError || !user) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { data, error } = await client
        .from("dog_updates")
        .select("*")
        .or(`update_date_approved.not.is.null,update_created_by.eq.${user.id}`)
        .order("update_created_at", { ascending: false });

    if (error) {
        console.error("Error fetching updates:", error);
        return new Response("Failed to fetch updates", { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
        }
    });
});

// ---------  CORS ---------
function getCorsHeaders(origin: string | null) {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };
    if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    return headers;
}
