import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://mfbiwvhxztejuzcasclv.supabase.co';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYml3dmh4enRlanV6Y2FzY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODM4NjUsImV4cCI6MjA4Mjc1OTg2NX0.DcGhBBvGIj_sipsryHgojiSZoLSVgqPFjLG7hJ2OY4k';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
