//import { serve } from "https://deno.land/std@0.218.2/http/server.ts";
//import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("idg.invite-user function")

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type","Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { email, functional_role } = await req.json();

    if (email && functional_role) {
      console.log('email: ', email);
      console.log('functional_role', functional_role);

      const authHeader = req.headers.get('Authorization')!
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      console.log('supabaseclient: ', supabaseClient)
      
      let new_user_id = '';

      //add partner connection if partner
      const { data, error } = await supabaseClient.auth.inviteUserByEmail({
          email: email
          // optional field: redirectTo : do we want to set the redirect url?
          // optional field: data: - we could save this form input details to the options.data object which is stored to 'auth.users.user_metadata'.
          //   options: {
          //     data: {
          //         functional_role: functional_role
          //     },
          //   }
      });

      if(error) {
        console.error(error);
      } else {
        new_user_id = data.user.id;
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
    return new Response('failure', { headers: corsHeaders })
  }
});