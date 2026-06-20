import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqmaplepoxtuxygrxbry.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_j7O0-ayqOV-pb1D_8_YA-Q_C9TTjrfI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
