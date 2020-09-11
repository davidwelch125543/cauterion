
const passport = require('passport');
const GooglePlusTokenStrategy = require('passport-google-plus-token');
const FacebookTokenStrategy = require('passport-facebook-token');
const { User, AUTH_TYPES } = require('../models/user.model');

// Google OAuth Strategy
passport.use('googleToken', new GooglePlusTokenStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
        debugger;
        const id = profile.id;
        const email = profile.emails[0].value;
        const first_name = profile.name.givenName;
        const last_name = profile.name.familyName;

        let user = await User.getUserByEmail(email);
        // Create a new user if not exists
        if (!user) {
            console.log('Creating a new user');
            user = new User({
                id,
                email,
                method: AUTH_TYPES.GOOGLE,
                first_name,
                last_name,
                // avatar: picture
            });
            await user.create();
        }
        
      done(null, user);
    } catch(error) {
      done(error, false, error.message);
    }
  }));

  // Facebook OAuth Strategy
  passport.use('facebookToken', new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('profile', profile);
      console.log('accessToken', accessToken);
      console.log('refreshToken', refreshToken);
      
      if (req.user) {
        // We're already logged in, time for linking account!
        // Add Facebook's data to an existing account
        req.user.methods.push('facebook')
        req.user.facebook = {
          id: profile.id,
          email: profile.emails[0].value
        }
        await req.user.save();
        return done(null, req.user);
      } else {
        // We're in the account creation process
        let existingUser = await User.findOne({ "facebook.id": profile.id });
        if (existingUser) {
          return done(null, existingUser);
        }
  
        // Check if we have someone with the same email
        existingUser = await User.findOne({ "local.email": profile.emails[0].value })
        if (existingUser) {
          // We want to merge facebook's data with local auth
          existingUser.methods.push('facebook')
          existingUser.facebook = {
            id: profile.id,
            email: profile.emails[0].value
          }
          await existingUser.save()
          return done(null, existingUser);
        }
  
        const newUser = new User({
          methods: ['facebook'],
          facebook: {
            id: profile.id,
            email: profile.emails[0].value
          }
        });
  
        await newUser.save();
        done(null, newUser);
      }
    } catch(error) {
      done(error, false, error.message);
    }
  }));