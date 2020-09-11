const GoogleStrategy = require('passport-google-oauth20');
const { User, AUTH_TYPES } = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Strategy config
module.exports = (passport) => {
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.API_URL}auth/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
            let user = await User.getUserByEmail(profile._json.email);
            // debugger
            const { sub, email, picture, given_name, family_name } = profile._json;
            // Create a new user if not exists
            if (!user) {
                console.log('Creating a new user');
                user = new User({
                    id: sub,
                    email,
                    method: AUTH_TYPES.GOOGLE,
                    first_name: given_name,
                    last_name: family_name,
                    // avatar: picture
                });
                await user.create();
            } 
            done(null, user);
        }
    ));
};
