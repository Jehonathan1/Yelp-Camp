const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync'); // require the catchAsync function
const Campground = require('../models/campground'); // require the campground model
const { isLoggedIn, isAuthor, validateCampground, currentDate, isReviewAuthor } = require('../middleware.js') // make sure a user is logged in using this middleware
const {cloudinary} = require("../cloudinary");
const multer  = require('multer') // image uploader
const { storage } = require('../cloudinary')
const upload = multer({ storage })
// -----------------------------------------------------------------------------------------------------------------------------------------------------

//  --== CAMPGROUND ROUTES ==--

// ----------------------------------------------

// View all Campgrounds
router.get('/', currentDate, catchAsync(async (req, res) => {

    const campgrounds = await Campground.find({}) // await for mongoose to find all campgrounds from DB
    // console.log( campgrounds ) // Respond

    res.render('campgrounds/index', { campgrounds })
}))

// ----------------------------------------------

// Create New Campground
router.get( '/new', isLoggedIn, ( req, res ) => {
    res.render( 'campgrounds/new') // create a new campground using 'new.ejs' gui
})

// Save New Campground to DB (and catch errors with cathAsync()) 
router.post('/', isLoggedIn, upload.array('image'), validateCampground, catchAsync(async ( req, res, next )  => {
    // const { id } = req.params;
    
    const newCampground = new Campground(req.body) // create a new campground

    newCampground.author = req.user._id // Update the author name based uppon who is logged in

    newCampground.images = req.files.map(f => ({ url: f.path, filename: f.filename }))// Add an image from upload system
    // Add a default image to the beginning of the array
    newCampground.images.unshift({url: `${process.env.CLOUDINARY_DEF_URL}`, filename:`${process.env.CLOUDINARY_DEF_NAME}`})

    await newCampground.save() // save it to db

    console.log(newCampground['images'])
    req.flash('success', 'Successfuly created a new campground!') // Success message for the user
    res.redirect(`/campgrounds/${newCampground._id}`) // redirect to details page of this newsfeed
}))

// ----------------------------------------------

// Campgrounds' Details Page
router.get( '/:id', isLoggedIn, catchAsync(async ( req, res ) => {
    const { id } = req.params;

    // Access the author name of each campground and each review
    const camp = await Campground.findById( id ).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author'); // find campground in DB using its unique id

    if (!camp){ // If campground doesn't exist anymore - notify user and redirect
        req.flash('error', 'Cannot find this campground!')
        return res.redirect('/campgrounds');
    }
    // console.log( camp )
    res.render( 'campgrounds/details', { camp }) // view campgrounds' details using 'details.ejs' gui
}))

// ----------------------------------------------

// Edit Campgrounds
router.get( '/:id/edit', isLoggedIn, isAuthor, catchAsync(async ( req, res ) => {
    const { id } = req.params;
    const camp = await Campground.findById( id ) // find campground in DB using its unique id
    if (!camp){ // If campground doesn't exist anymore - notify user and redirect
        req.flash('error', 'Cannot find this campground!')
        return res.redirect('/campgrounds');
    }
    res.render( 'campgrounds/edit', { camp }) // edit campground using 'edit.ejs' gui
}))

// ----------------------------------------------

// Save edited Campgrounds to DB
router.put( '/:id', isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(async ( req, res ) => {
    const { id } = req.params;
    const updatedCamp = await Campground.findByIdAndUpdate(id, req.body, {runValidators: true, new: true}) // save updated campground to db
    
    const img = req.files.map(f => ({ url: f.path, filename: f.filename }))
    updatedCamp.images.pop() // remove previous image from images array
    updatedCamp.images.push(...img) // push into the array the updated image

    updatedCamp.images.unshift({url: `${process.env.CLOUDINARY_DEF_URL}`, filename:`${process.env.CLOUDINARY_DEF_NAME}`})

    await updatedCamp.save()

    if (req.body.deleteImage) {
        console.log(req.body.deleteImage)
        console.log('----------------------')
        for(let filename of req.body.deleteImage){
            // await updatedCamp.updateOne({ $pull: { images: { images[0]: { $in: images[0] } }}}, {runValidators: true, new: true})
            await cloudinary.uploader.destroy(filename);
        }
        // await updatedCamp.updateOne({ $pull:  {images: { filename: {$in: req.body.deleteImage}}}}, {runValidators: true, new: true})
        updatedCamp.images.pop() // remove previous image from images array
        console.log(updatedCamp)
    }
    
    req.flash('success', 'Successfuly updated campground!') // Success message for the user
    res.redirect(`/campgrounds/${updatedCamp._id}`) // redirect to details page of this campground
}))

// ----------------------------------------------

// Delete Campgrounds from DB
router.delete( '/:id', isLoggedIn, isAuthor, catchAsync(async ( req, res ) => {
    const { id } = req.params;

    const deletedCamp = await Campground.findByIdAndDelete( id ) // delete newsfeed from db
    
    req.flash('success', `Successfuly deleted campground!`) // Success message for the user
    res.redirect(`/campgrounds`) // redirect to all newsfeeds page
}))

// ----------------------------------------------

module.exports = router;