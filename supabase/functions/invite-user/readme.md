# invite-user function

The edge function supports a API endpoint which allows an existing 'admin' user to invite a new user.

Key Steps of this flow
- inputs: the function expects an email and role for the new user
- call the auth-admin-inviteuserbyemail which return a new uuid value
    - see https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- we then update the 'users' table and set the role.
- the 'email' user gets a login email, sets their password and then then can set their 'name','phone' details.

Roadmap
- In the future the inputs could include name, phone etc.

## Dev Setup

Install the deno vs code extension
- https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno


curl -L -X POST 'https://rfbrvbovykizxlzrjvql.supabase.co/functions/v1/igd-invite-user' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYnJ2Ym92eWtpenhsenJqdnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNDQ2MDYsImV4cCI6MjA2NjYyMDYwNn0.PsPiIcQeds2Qjxa7W7zXZcHiofiXPYHnK_lRaUptYJo' \
  -H 'Content-Type: application/json' \
  --data '{"email":"paul.t.oconnell+sb-invite@gmail.com","functional_role","role"}'

  ## 10:27

  "AuthApiError: Could not parse request body as JSON: json: cannot unmarshal object into Go struct field InviteParams.email of type string\n    at Me (https://esm.sh/@supabase/auth-js@2.70.0/es2022/auth-js.mjs:3:7021)\n    at eventLoopTick (ext:core/01_core.js:168:7)\n    at async at (https://esm.sh/@supabase/auth-js@2.70.0/es2022/auth-js.mjs:3:7864)\n    at async d (https://esm.sh/@supabase/auth-js@2.70.0/es2022/auth-js.mjs:3:7583)\n    at async C.inviteUserByEmail (https://esm.sh/@supabase/auth-js@2.70.0/es2022/auth-js.mjs:3:9952)\n    at async Server.<anonymous> (file:///tmp/user_fn_rfbrvbovykizxlzrjvql_74c87ced-52f9-4c70-84d8-b67ad3d2a579_13/source/index.ts:37:31)\n    at async #respond (https://deno.land/std@0.224.0/http/server.ts:224:18) {\n  __isAuthError: true,\n  name: \"AuthApiError\",\n  status: 400,\n  code: \"bad_json\"\n}\n"