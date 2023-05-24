const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const helmet = require('helmet');

const PORT = 3001;

const app = express();
// secuity middleware needs to ne added before any other middleware
app.use(helmet());

app.get('/secret', (req, res) => {
    return res.send('Your personal secret value is 36');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
}, app).listen(PORT, () => {
    console.log('listening on port ' + PORT);
});