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

## References

