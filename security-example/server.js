const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const cookieSession = require('cookie-session');
const { Strategy } = require('passport-google-oauth20');
const { verify } = require('crypto');
const { log } = require('console');

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

// Save the session to the cookie
// serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Read the session from the cookie
// deserialize use
passport.deserializeUser((id, done) => {
    // User.findById(id).then((user) => {
    //     done(null, user);
    // });
    done(null, id);
});

const app = express();

// secuity middleware needs to ne added before any other middleware
app.use(helmet());

// cookie session middleware
app.use(cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
}));

app.use(passport.initialize());
app.use(passport.session());

function checkLoggedIn(req, res, next) {
    console.log('req.user', req.user);
    const isLoggedIn = req.isAuthenticated() && req.user;

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
        session: true, // default is true
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