import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
// ---------  ENV + INIT ---------
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
// ---------  SETTINGS ---------
const allowedOrigins = [
    "https://dogs.guidedogs.ie",
    "http://localhost:5173",
    "https://igdb-demo.paradaux.io",
    "https://igdb.pages.dev" // IGDB sandbox
];
// ---------  SERVER ---------
serve(async (req) => {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, serviceRole);

        const { view } = await req.json();
        let data;

        switch(view) {
            case "dogs":
                data = await getDogsView(supabase); // Fixed: added await
                break;
            default:
                data = { message: "invalid view specified" };
                break;
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

// VIEWS
async function getDogsView(supabase) {
    const { data } = await supabase.from("dogs").select("dog_id,dog_name,dog_role,dog_yob,dog_sex,dog_picture").eq("dog_is_archived", false);
    return data;
}
// ---------  CORS ---------
function getCorsHeaders(origin: string | null) {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };
    if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    } else {
        headers["Access-Control-Allow-Origin"] = "https://dogs.guidedogs.ie"; // fallback or omit entirely
    }
    return headers;
}