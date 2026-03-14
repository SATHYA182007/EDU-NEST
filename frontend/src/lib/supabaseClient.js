import { createClient } from "@supabase/supabase-js";

// Ensure you replace these placeholders with actual values if you haven't set up environment variables or we hardcode them as requested
const supabaseUrl = "https://hvqonskoxqvlephihgwz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cW9uc2tveHF2bGVwaGloZ3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjgzNTAsImV4cCI6MjA4ODM0NDM1MH0.GiP2bOFtknxCqyd826c7bj0jifQEIvIfbBLANnFOM8I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
