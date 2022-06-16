const express = require('express');
const router = express.Router(); 
const passport = require('passport');
const User = require('../models/user')
const catchAsync = require('../utils/catchAsync'); // require the catchAsync function
const ExpressError = require('../utils/ExpressError'); // require the catchAsync function

//  --== LOGIN ROUTES ==--

// ----------------------------------------------

// Register page
router.get('/register', (req, res) => {
    res.render('users/register')
});

// Send register information to
router.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password); // Hash & Salt our password
        // After registration, login user:
        req.login(registeredUser, err => {
            if (err) return next(err); 
            // otherwise:
            console.log(registeredUser)
            req.flash('success', `Welcome to YelpCamp, ${registeredUser.username}!`)
            res.redirect('/campgrounds')
        }) 
    } catch(e){
        req.flash('error', e.message);
        res.redirect('/register')
    }
}));

// ----------------------------------------------

// Login page
router.get('/login', (req, res) => {
    res.render('users/login')
});

// Send login information to
router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    req.flash('success', `Welcome back!!`);
    const redirectUrl = req.session.returnTo || '/campgrounds' // Remember which url user wanted to access (protected by login):
    delete req.session.returnTo; // delete it from the session
    res.redirect(redirectUrl)
});

// ----------------------------------------------

// Logout page
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', `Goodbye!`)
    res.redirect('/login')
});


module.exports = router;