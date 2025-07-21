import {serve} from "https://deno.land/std@0.224.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js";

const priviligedSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

// ---------  BEGIN SETTINGS ---------
const allowedOrigins = [
    "http://localhost:5173",
    "https://portal.guidedogs.ie"
];
// ---------  END SETTINGS ---------

serve(async (req) => {
    const authHeader = req.headers.get('Authorization');
    const origin = req.headers.get("origin");

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: getCorsHeaders(origin)
        });
    }

    // Handle missing auth token
    if (!authHeader) {
        return new Response('Unauthorized', {
            status: 401,
            headers: getCorsHeaders(origin)
        });
    }

    // Ensure the user is entitled to delete users
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
            global: { headers: { Authorization: authHeader } }
        }
    );

    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        return new Response('Unauthorized: Unable to get user session', {
            status: 401,
            headers: getCorsHeaders(origin)
        });
    }

    const { data: userRow, error: userCheckError } = await supabaseClient
        .from('users')
        .select('permission_role')
        .eq('id', user.id)
        .single();

    if (userCheckError || !userRow || userRow.permission_role !== 'admin') {
        return new Response('Forbidden: Admin access required', {
            status: 403,
            headers: getCorsHeaders(origin)
        });
    }

    // Parse body and validate
    const {id} = await req.json();
    if (!id) {
        return new Response('Bad Request: you need to specify which user to delete', {
            status: 400,
            headers: getCorsHeaders(origin)
        });
    }

    const {error} = await priviligedSupabaseClient.auth.admin.deleteUser(id);
    if (error) {
        console.error("Error deleting user:", error);
        return new Response('Internal Server Error: Failed to delete user', {
            status: 500,
            headers: getCorsHeaders(origin)
        });
    }

    return new Response("User deleted successfully");
});

function getCorsHeaders(origin) {
    const headers = {
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };
    if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    return headers;
}