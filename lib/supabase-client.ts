import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfbiwvhxztejuzcasclv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_lXhPQ7Wm-pio1CZbPXChmw_ebrxgveT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
