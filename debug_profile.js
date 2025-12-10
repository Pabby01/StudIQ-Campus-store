
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.resolve(__dirname, '.env');
const envConfig = {};

if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            envConfig[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
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

async function checkApiLogic() {
    const address = 'Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js';

    // Include owner info
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('address', address)
        .maybeSingle();

    if (error) {
        console.error('DB Error:', error);
    } else {
        console.log('DB Data:', data);

        // Simulate API response
        const jsonResponse = JSON.stringify(data ?? null);
        console.log('API Response Body:', jsonResponse);

        // Parse like client
        const profile = JSON.parse(jsonResponse);

        console.log('Client check:');
        console.log('profile?.name:', profile?.name);
        console.log('profile?.school:', profile?.school);
        console.log('profile?.campus:', profile?.campus);

        const needsOnboarding = !profile?.name || !profile?.school || !profile?.campus;
        console.log('needsOnboarding:', needsOnboarding);
    }
}

checkApiLogic();
