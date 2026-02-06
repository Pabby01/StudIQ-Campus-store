
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '.env');

if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
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
