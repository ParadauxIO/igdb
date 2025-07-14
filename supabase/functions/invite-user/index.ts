import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
console.log("idg.invite-user function 2025.07.14-11:08");

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// https://stackoverflow.com/questions/74696640/supabase-edge-function-says-no-body-was-passed
serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {


    //console.log(JSON.stringify(data));

    const { email, functional_role } = await req.json();

    if (email) {
      console.log('email: ', email);
      console.log('functional_role', functional_role);

      const authHeader = req.headers.get('Authorization')!
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      
      let new_user_id = '';

      // add partner connection if partner
      // https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
      // https://github.com/NathanRignall/oscar-ox/blob/2aae3ac94beb2cea14bfe0bf9ce497c533b4d236/supabase/functions/invite-add-user/index.ts
      const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(
          email,
          {
            //redirectTo: globalThis.location.origin,
            data: { 
              functional_role: functional_role
            }
          }
        );

      if(error) {
        console.error(error);
        throw new Error(error.message);
      } else {
        new_user_id = data?.user?.id;
        console.log("new user id {}",new_user_id);
              //add user role to table
        const { error } = await supabaseClient
          .from('users')
          .update([{ functional_role: functional_role }])
          .eq("id",new_user_id);
        if (error) {
            console.error("update user error .{}",error);
        } else {
            console.log("invited user created {}",new_user_id);
        }      
      }
      return new Response('success', { headers: corsHeaders })
    } 
    else {
      return new Response('no function call', { headers: corsHeaders })
    }
  } catch (error) {
    console.error(error.message)
    return new Response('failure', { headers: corsHeaders })
  }
});