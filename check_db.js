
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.resolve(__dirname, '.env');
const envConfig = {};

if (fs.existsSync(envPath)) {
    const file = fs.readFileSync(envPath, 'utf8');
    file.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/"/g, '');
            envConfig[key] = value;
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Found:', Object.keys(envConfig));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const address = 'Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js';

    console.log('Checking profile for:', address);
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('address', address)
        .single();

    if (profileError) {
        console.error('Profile error:', profileError);
    } else {
        console.log('Profile:', profile);
    }

    console.log('\nChecking stores...');
    const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('*');

    if (storeError) {
        console.error('Store error:', storeError);
    } else {
        console.log('Stores count:', stores.length);
        console.log('Stores:', JSON.stringify(stores, null, 2));
    }
}

checkData();
