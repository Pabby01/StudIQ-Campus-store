
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('--- Keys found in .env ---');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            if (key && !key.startsWith('#')) {
                console.log(key);
            }
        }
    });
    console.log('--------------------------');
} else {
    console.log('.env file not found at:', envPath);
}
