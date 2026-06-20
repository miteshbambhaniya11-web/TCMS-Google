import { createClient } from '@supabase/supabase-js';

const getClient = () => {
  let url = 'https://hqmaplepoxtuxygrxbry.supabase.co';
  let key = 'sb_publishable_j7O0-ayqOV-pb1D_8_YA-Q_C9TTjrfI';

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined') {
      url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined') {
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  }

  try {
    return createClient(url, key);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const supabase = getClient();
