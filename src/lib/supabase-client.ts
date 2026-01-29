import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://mfbiwvhxztejuzcasclv.supabase.co';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYml3dmh4enRlanV6Y2FzY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5MDc3MTUsImV4cCI6MjAzMjQ4MzcxNX0.D_96FkR3k2c3e5a7d9b8c0e1f2a3b4c5d6e7f8a9b0c';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
