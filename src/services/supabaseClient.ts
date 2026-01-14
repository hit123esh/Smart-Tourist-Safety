import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ropxtdpabpjirdvrzydn.supabase.co';
const supabaseAnonKey = 'sb_publishable_lac4DZhhyfqjUHZsi3i8qg_W8TaBJcn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
