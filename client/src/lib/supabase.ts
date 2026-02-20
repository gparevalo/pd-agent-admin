import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://alaqjotojrhlplqklweo.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYXFqb3RvanJobHBscWtsd2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg3MTcsImV4cCI6MjA4NDc1NDcxN30.qbmkZ76-fld8CaNHpFSEDobjx0VY5hgnFAIuFs-TOM8";

export const supabase = createClient(supabaseUrl, supabaseKey);
