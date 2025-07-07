import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
console.log("idg.invite-user function 10.11");

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
//     "Content-Type": "application/json"
//    "XAccess-Control-Allow-HeadersX": "authorization, x-client-info, apikey, content-type","Content-Type": "application/json",

// https://stackoverflow.com/questions/74696640/supabase-edge-function-says-no-body-was-passed
serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    console.log("OPTIONS {}",corsHeaders);
    return new Response('ok', { headers: corsHeaders })
  }
  try {


    //console.log(JSON.stringify(data));

    const { email, functional_role } = await req.json();

    if (email) {
      console.log('email: ', email);
      console.log('functional_role', functional_role);

      const authHeader = req.headers.get('Authorization')!
      console.log('authHeader', authHeader);
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      console.log('supabaseclient: ', supabaseClient)
      
      let new_user_id = '';
      const userMetadata = {
        invitedBy: 'adminUser'
      };

      // add partner connection if partner
      // https://github.com/bwship/support-dev/blob/2d7014970ffa5c6655834bd7089a1c85bb46a6d2/backend/supabase/functions/_shared/profile/createProfile.ts#L51
      const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(
          email,
          {
            data: userMetadata
          }
        );
          // optional field: redirectTo : do we want to set the redirect url?
          // optional field: data: - we could save this form input details to the options.data object which is stored to 'auth.users.user_metadata'.
          //   options: {
          //     data: {
          //         functional_role: functional_role
          //     },
          //   }


      if(error) {
        console.error(error);
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
            console.log("update user {}",error);
        }      
      }
      return new Response('success', { headers: corsHeaders })
    } 
    else {
      return new Response('no function call', { headers: corsHeaders })
    }
  } catch (error) {
    console.error(error)
    console.error(corsHeaders)
    return new Response('failure', { headers: corsHeaders })
  }
});