import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hvqonskoxqvlephihgwz.supabase.co";
const supabaseKey = "sb_publishable_CKZ79Xblvc6xB_5PzIS_6g_DUq08kJB";

export const supabase = createClient(supabaseUrl, supabaseKey);