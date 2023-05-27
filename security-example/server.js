const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');
const { verify } = require('crypto');

require('dotenv').config();

const PORT = 3000;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
};

function verifyCallback(accessToken, refreshToken, profile, done) {
    console.log('Google profile', profile);
    done(null, profile);
};

// passport setup
passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

const app = express();

// secuity middleware needs to ne added before any other middleware
app.use(helmet());
app.use(passport.initialize());

function checkLoggedIn(req, res, next) {
    const isLoggedIn = true; // TODO

    if (!isLoggedIn) {
        return res.status(401).json({
            error: 'You are not authenticated'
        });
    }
    next();
};

// login endpoint
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['email', 'profile'],
    })
);


/// callback endpoint
app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/failure',
        successRedirect: '/',
        session: false,
    }),
    (req, res) => {
        console.log('Google called us back!');
    }
);

// logout endpoint
app.get('/auth/logout', (req, res) => {
    req.logout(); //Removes req.user and clears any logged in session
    return res.redirect('/');
});

// secret endpoint
app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send('Your personal secret value is 36');
});

// failure endpoint
app.get('/failure', (req, res) => {
    return res.send('Failed to log in!');
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