import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfbiwvhxztejuzcasclv.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYml3dmh4enRlanV6Y2FzY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODM4NjUsImV4cCI6MjA4Mjc1OTg2NX0.DcGhBBvGlj_sipsryHgojiSZoLSVggqPFjLG7hj2OY4k').trim();

// Garantir que build não quebre se variáveis vierem vazias
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[SUPABASE] Missing keys. Build may fail if data fetching is attempted.');
}

export const supabase = createClient(
    supabaseUrl || 'https://mfbiwvhxztejuzcasclv.supabase.co',
    supabaseAnonKey || 'placeholder'
);
