const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY missing. Database operations will fail.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: { persistSession: false }
});

console.log('[Supabase] Client initialized');

module.exports = supabase;
