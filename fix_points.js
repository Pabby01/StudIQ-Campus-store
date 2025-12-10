
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
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPoints() {
    const address = 'Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js';

    console.log('Fixing points for:', address);

    // 1. Get current store count
    const { count: storeCount, error: countError } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('owner_address', address);

    if (countError) {
        console.error('Error counting stores:', countError);
        return;
    }

    console.log(`User has ${storeCount} stores`);

    // Calculate points:
    // 50 for signup
    // 100 per store
    const totalPoints = 50 + (storeCount * 100);

    console.log(`Setting points to: ${totalPoints}`);

    // Update profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: totalPoints })
        .eq('address', address);

    if (updateError) {
        console.error('Update error:', updateError);
    } else {
        console.log('SUCCESS: Points updated!');
    }

    // Check result
    const { data } = await supabase
        .from('profiles')
        .select('points')
        .eq('address', address)
        .single();

    console.log('New points balance:', data?.points);
}

fixPoints();
