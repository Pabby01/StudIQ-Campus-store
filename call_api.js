
const http = require('http');

const url = "http://localhost:3000/api/profile/get?address=Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js";

console.log('Calling:', url);

http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data.substring(0, 200)); // Log first 200 chars
    });
}).on('error', err => {
    console.error('Error:', err.message);
});
