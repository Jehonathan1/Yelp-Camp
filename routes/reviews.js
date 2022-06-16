const express = require('express');
const router = express.Router({mergeParams: true}); // Don't forget this line, since it allows the access to params!
const catchAsync = require('../utils/catchAsync'); // require the catchAsync function
const Campground = require('../models/campground'); // require the campground model
const Review = require('../models/review')

const { validateReview, isLoggedIn } = require('../middleware.js') // make sure a user is logged in using this middleware

// -----------------------------------------------------------------------------------------------------------------------------------------------------

//  --== REVIEWS ROUTES ==--

// 08. Campground Reviews
router.post( '/', isLoggedIn, validateReview, catchAsync(async ( req, res ) => {
    const { id } = req.params;
    const camp = await Campground.findById( id ) // find campground in DB using its unique id
    const review = new Review(req.body);
    review.author = req.user._id // Update the author name based uppon who is logged in
    camp.reviews.push(review); // Add the new review to the campground
    await review.save();
    await camp.save();
    req.flash('success', 'New review created!') // Success message for the user
    res.redirect(`/campgrounds/${camp._id}`)
}))

// ----------------------------------------------

// 07. Delete reviews from DB
router.delete( '/:reviewId', isLoggedIn, catchAsync(async ( req, res ) => {
    const { id, reviewId } = req.params;
    const updatedCampground = await Campground.findByIdAndUpdate( id, {$pull: { reviews: reviewId } } ) // delete reviewId from reviews array
    const deletedReview = await Review.findByIdAndDelete( reviewId ) // delete review from db
    req.flash('success', 'Successfuly deleted review!') // Success message for the user
    res.redirect(`/campgrounds/${updatedCampground._id}`) // redirect to updated reviews page
}))


module.exports = router;