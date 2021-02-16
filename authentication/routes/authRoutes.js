'use strict'
const express = require('express'),
    passport = require('passport'),
    jwt = require('jsonwebtoken'),
    router = express.Router()

router.post(
    '/auth',
    async(req, res, next) => {
        passport.authenticate('login',
            async(err, user, info) => {
                try {
                    if (err || !user) {
                        const error = new Error('An error occurred.');
                        return next(error);
                    }
                    req.login(
                        user, { session: false },
                        async(error) => {
                            if (error) return next(error);
                            const body = { _id: user._id, email: user.email };
                            const token = jwt.sign({ user: body }, 'TOP_SECRET');
                            return res.json({ token });
                        }
                    );
                } catch (error) {
                    return next(error);
                }
            })(req, res, next);
    })

router.post(
    '/adduser',
    passport.authenticate('signup', { session: false }),
    async(req, res, next) => {
        res.json({
            message: 'User creation successful',
            user: req.user
        })
    })

module.exports = router;