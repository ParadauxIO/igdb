import {supabase} from "../state/supabaseClient.ts";

export const fetchTerms = async (): Promise<string> => {
    const {data, error} = await supabase.from("system_settings")
        .select("setting_value")
        .eq("setting_key", "terms")
        .single();

    if (error) {
        throw new Error("Failed to fetch terms and conditions: " + error.message);
    }

    return data.setting_value;
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", key)
    .maybeSingle();

  if (error) {
    console.error("Error fetching setting", key, error);
    return null;
  }

  return data?.setting_value ?? null;
}

export const updateSetting = 
    async (key: string, value: string): Promise<void> => {
    const { error } = await supabase
        .from("system_settings")
        .update({
            setting_value: value,
            // ensure updated_at moves on UPDATE (default only fires on INSERT)
            updated_at: new Date().toISOString(),
        })
        .eq("setting_key", key);

    if (error) {
        throw new Error(`Failed to update setting "${key}": ${error.message}`);
    }
};