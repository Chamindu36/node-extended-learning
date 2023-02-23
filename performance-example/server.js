const express = require('express');

const app = express();

function delay(duration) {
    const startTime = Date.now();
    while (Date.now() - startTime < duration) {
        // Event loop is blocked...
        // Since this is not a file or rquest operation it will not
        // send to the thread pools of libuv or OS
    }
}

app.get('/', (req, res) => {
    res.send(`Performance example: ${process.pid}`);
});

app.get('/timer', (req, res) => {
    // delay the response
    delay(4000);
    res.send(`Beep beep beep! ${process.pid}`);
});

console.log('Running server.js...');
console.log('Worker process started.');
app.listen(3000);