// supabase/functions/update-user/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/* ==============================
 * Config
 * ============================== */
const ALLOWED_ORIGINS = [
    'https://dogs.guidedogs.ie',
];

// Default redirect for invite verification
const DEFAULT_EMAIL_REDIRECT_TO = 'https://dogs.guidedogs.ie/onboarding';

/* ==============================
 * Types
 * ============================== */
type BaseBody = {
    type: 'onboard' | 'update' | 'resend-invite';
};

type OnboardOrUpdateBody = BaseBody & {
    name?: string | null;
    phone?: string | null;
    password?: string | null; // optional password change
};

type ResendInviteBody = BaseBody & {
    id: string; // target auth.user id to resend invite for
    emailRedirectTo?: string; // optional override
};

type RequestBody = OnboardOrUpdateBody | ResendInviteBody;

/* ==============================
 * CORS helpers
 * ============================== */
function buildCorsHeaders(origin: string, isAllowed: boolean, req: Request) {
    const reqHeaders =
        req.headers.get('Access-Control-Request-Headers') ??
        'authorization, x-client-info, apikey, content-type';

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': reqHeaders,
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method',
    };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
}

/* ==============================
 * Supabase helpers
 * ============================== */
function getServiceClient() {
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, key);
}

async function getAuthedUserFromBearer(supabase: ReturnType<typeof createClient>, req: Request) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
}

async function assertAdminOr403(
    supabase: ReturnType<typeof createClient>,
    requesterId: string,
    cors: Record<string, string>
) {
    const { data: row, error } = await supabase
        .from('users')
        .select('permission_role')
        .eq('id', requesterId)
        .single();

    if (error || !row || row.permission_role !== 'admin') {
        return json({ error: 'Forbidden: Admin access required' }, 403, cors);
    }
    return null; // OK
}

/* ==============================
 * Handlers
 * ============================== */
async function handleOnboardOrUpdate(
    supabase: ReturnType<typeof createClient>,
    reqUserId: string,
    kind: 'onboard' | 'update',
    body: OnboardOrUpdateBody,
    cors: Record<string, string>
) {
    // Fetch current app user row (service role bypasses RLS)
    const { data: existingRow, error: fetchErr } = await supabase
        .from('users')
        .select('id, has_accepted_terms')
        .eq('id', reqUserId)
        .maybeSingle();

    if (fetchErr) {
        return json({ error: fetchErr.message }, 500, cors);
    }

    if (kind === 'onboard' && existingRow?.has_accepted_terms === true) {
        return json({ error: 'User already onboarded' }, 409, cors);
    }

    const updates: Record<string, unknown> = {
        name: body.name ?? null,
        phone: body.phone ?? null,
        updated_at: new Date().toISOString(),
    };
    if (kind === 'onboard') {
        updates.has_accepted_terms = true;
    }

    let dbErr: any = null;
    if (!existingRow) {
        const { error } = await supabase.from('users').insert([{ id: reqUserId, ...updates }]);
        dbErr = error ?? null;
    } else {
        const { error } = await supabase.from('users').update(updates).eq('id', reqUserId);
        dbErr = error ?? null;
    }
    if (dbErr) return json({ error: dbErr.message }, 500, cors);

    // Optional password change
    if (body.password && body.password.trim().length > 0) {
        const { error: passErr } = await supabase.auth.admin.updateUserById(reqUserId, {
            password: body.password,
        });
        if (passErr) return json({ error: passErr.message }, 500, cors);
    }

    return json({ success: true }, 200, cors);
}

async function handleResendInvite(
    supabase: ReturnType<typeof createClient>,
    requesterId: string,
    body: ResendInviteBody,
    cors: Record<string, string>
) {
    // Must be admin
    const forbid = await assertAdminOr403(supabase, requesterId, cors);
    if (forbid) return forbid;

    // Get target user's email from Auth Admin by ID
    const targetId = body.id?.trim();
    if (!targetId) return json({ error: 'Missing target id' }, 400, cors);

    const { data: target, error: getErr } = await supabase.auth.admin.getUserById(targetId);
    if (getErr) return json({ error: getErr.message }, 500, cors);
    const email = target?.user?.email;
    if (!email) return json({ error: 'Target user has no email' }, 400, cors);

    const emailRedirectTo = body.emailRedirectTo || DEFAULT_EMAIL_REDIRECT_TO;

    // Resend signup verification
    const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo },
    });

    if (resendErr) return json({ error: resendErr.message }, 500, cors);
    return json({ success: true, email }, 200, cors);
}

/* ==============================
 * Entrypoint
 * ============================== */
Deno.serve(async (req) => {
    const origin = req.headers.get('origin') ?? '';
    const isAllowed = ALLOWED_ORIGINS.includes(origin);
    const cors = buildCorsHeaders(origin, isAllowed, req);

    // Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
    }

    if (!isAllowed) {
        return json({ error: 'Origin not allowed' }, 403, cors);
    }

    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405, cors);
    }

    try {
        const body = (await req.json()) as RequestBody;
        if (!body?.type) return json({ error: 'Missing type' }, 400, cors);

        const supabase = getServiceClient();

        // Authenticated requester (from Bearer token)
        const authed = await getAuthedUserFromBearer(supabase, req);
        if (!authed) return json({ error: 'Unauthenticated' }, 401, cors);

        // Route by type
        switch (body.type) {
            case 'onboard':
            case 'update':
                return await handleOnboardOrUpdate(
                    supabase,
                    authed.id,
                    body.type,
                    body as OnboardOrUpdateBody,
                    cors
                );

            case 'resend-invite':
                return await handleResendInvite(
                    supabase,
                    authed.id,
                    body as ResendInviteBody,
                    cors
                );

            default:
                return json({ error: 'Invalid type' }, 400, cors);
        }
    } catch (err: any) {
        console.error(err);
        return json({ error: err?.message ?? 'Unknown error' }, 500, cors);
    }
});
