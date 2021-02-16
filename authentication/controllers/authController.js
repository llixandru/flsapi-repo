'use strict'
const passport = require('passport'),
    localStrategy = require('passport-local').Strategy,
    UserModel = require('../models/authModel'),
    JWTstrategy = require('passport-jwt').Strategy,
    ExtractJWT = require('passport-jwt').ExtractJwt

//Passport middleware to handle user registration
passport.use(
    'signup',
    new localStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        async(email, password, done) => {
            try {
                const user = await UserModel.create({ email, password });
                return done(null, user);
            } catch (error) {
                done(error);
            }
        }))

//Passport middleware to handle login
passport.use(
    'login',
    new localStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        async(email, password, done) => {
            try {
                const user = await UserModel.findOne({ email });
                if (!user) {
                    return done(null, false, { message: 'User not found' });
                }
                const validate = await user.isValidPassword(password);
                if (!validate) {
                    return done(null, false, { message: 'Wrong Password' });
                }
                return done(null, user, { message: 'Authenticated successfully' });
            } catch (error) {
                return done(error);
            }
        }))

//Passport middleware to handle JWT
passport.use(
    new JWTstrategy({
            secretOrKey: 'TOP_SECRET',
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
        },
        async(token, done) => {
            try {
                return done(null, token.user);
            } catch (error) {
                done(error);
            }
        }))