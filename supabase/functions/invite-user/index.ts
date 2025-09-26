import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
// ---------  BEGIN SETTINGS ---------
const redirectTo = 'https://dogs.guidedogs.ie/onboarding';
const allowedOrigins = [
    "https://dogs.guidedogs.ie",
];
const functionalRoles = [
    'staff',
    'volunteer',
    'puppy raiser',
    'trainer',
    'temporary boarder',
    'client',
    'adoptive family',
    'sponsor'
];
// ---------  END SETTINGS ---------
const priviligedSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
serve(async (req)=>{
    const authHeader = req.headers.get('Authorization');
    const origin = req.headers.get("origin");
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: getCorsHeaders(origin)
        });
    }
    if (!authHeader) {
        return new Response('Unauthorized', {
            status: 401,
            headers: getCorsHeaders(origin)
        });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: {
            headers: {
                Authorization: authHeader
            }
        }
    });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
        return new Response('Unauthorized: Unable to get user session', {
            status: 401,
            headers: getCorsHeaders(origin)
        });
    }
    const { data: userRow, error: userCheckError } = await supabaseClient.from('users').select('permission_role').eq('id', user.id).single();
    if (userCheckError || !userRow || userRow.permission_role !== 'admin') {
        return new Response('Forbidden: Admin access required', {
            status: 403,
            headers: getCorsHeaders(origin)
        });
    }
    const { email, functional_role } = await req.json();

    if (!email || !functional_role) {
        return new Response('Bad Request: Missing email or functional_role', {
            status: 400,
            headers: getCorsHeaders(origin)
        });
    }

    const rawEmail = String(email ?? '');
    const normalisedEmail = rawEmail.trim().toLowerCase();

    if (!validateEmail(normalisedEmail)) {
        return new Response('Bad Request: Invalid email format', {
            status: 400,
            headers: getCorsHeaders(origin)
        });
    }
    if (!functionalRoles.includes(functional_role)) {
        return new Response('Bad Request: Invalid functional_role', {
            status: 400,
            headers: getCorsHeaders(origin)
        });
    }
    if (await userExists(email)) {
        return new Response('Bad Request: User already exists', {
            status: 400,
            headers: getCorsHeaders(origin)
        });
    }
    const { data, error: e1 } = await priviligedSupabaseClient.auth.admin.inviteUserByEmail(normalisedEmail, {
        redirectTo
    });
    if (e1) {
        console.error("Error inviting user:", e1);
        return new Response(`Error inviting user: ${e1.message}`, {
            status: 400,
            headers: getCorsHeaders(origin)
        });
    }
    // Get user ID from invite response or list users
    let userId = data?.user?.id;
    if (!userId) {
        const { users, error: fetchError } = await priviligedSupabaseClient.auth.admin.listUsers();
        if (fetchError) {
            console.error("Failed to fetch users:", fetchError);
            return new Response(`Error inviting user: ${fetchError.message}`, {
                status: 400,
                headers: getCorsHeaders(origin)
            });
        }
        const invitedUser = users.find((u)=>u.email?.toLowerCase() === email.toLowerCase());
        if (!invitedUser) {
            return new Response("Error: Invited user not found", {
                status: 400,
                headers: getCorsHeaders(origin)
            });
        }
        userId = invitedUser.id;
    }
    const { error: updErr2 } = await priviligedSupabaseClient
        .from('users')
        .update({
            functional_role,
            email: normalisedEmail,
        })
        .eq('id', userId);

    if (updErr2) {
        console.error(updErr2);
        return new Response(`Error inviting user: ${updErr2.message}`, {
            status: 400,
            headers: getCorsHeaders(origin),
        });
    }

    // ensure functional_role & email are set/normalised;
    const { error: updErr } = await priviligedSupabaseClient
        .from('users')
        .update({
            functional_role,
            email: normalisedEmail, // fine now that the column exists
        })
        .eq('id', userId);

    if (updErr) {
        console.error(updErr);
        return new Response(`Error inviting user: ${updErr.message}`, {
            status: 400,
            headers: getCorsHeaders(origin),
        });
    }
    return new Response(JSON.stringify({
        message: "User invited successfully"
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(origin)
        }
    });
});
const validateEmail = (email: string)=>{
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};
async function userExists(emailToCheck: string) {
    const perPage = 100;
    let page = 1;
    while(true){
        const { users, error } = await priviligedSupabaseClient.auth.admin.listUsers({
            page,
            perPage
        });
        if (error) {
            console.error("Error fetching users:", error);
            throw new Error("Failed to check if user exists");
        }
        if (!users || users.length === 0) {
            return false;
        }
        const match = users.find((user)=>user.email?.toLowerCase() === emailToCheck.toLowerCase());
        if (match) {
            return true;
        }
        page++;
    }
}
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
