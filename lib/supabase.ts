import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client cho browser (anon key cho public read)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client cho server/admin (dùng service key nếu cần write full access)
export const supabaseAdmin = () => createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);