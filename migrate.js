import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// For admin we need service_role key to bypass RLS, but if RLS isn't blocking us we might be able to use ANON key + user login, 
// OR we just use the service role key if available.
// The user hasn't provided the service role key. 
// We can just create a route /api/migrate in Next.js, visit it, and it will run with server client which bypasses RLS? 
// No, createClient() from `@/utils/supabase/server` uses the cookies, so it acts as the logged in user.
