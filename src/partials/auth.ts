import { supabase } from "../state/supabaseClient"

const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('signInWithEmail', { data, error })
}

export { signInWithEmail }