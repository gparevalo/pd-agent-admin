import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://alaqjotojrhlplqklweo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYXFqb3RvanJobHBscWtsd2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg3MTcsImV4cCI6MjA4NDc1NDcxN30.qbmkZ76-fld8CaNHpFSEDobjx0VY5hgnFAIuFs-TOM8";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
