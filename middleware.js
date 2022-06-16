//  --== Costum Middleware ==--
const { campgroundSchema, reviewSchema } = require('./schemas.js')
const ExpressError = require('./utils/ExpressError'); // require the catchAsync function
const Campground = require('./models/campground'); // require the campground model
const Review = require('./models/review'); // require the review model
// ---------------------------------------------------------------------

// Make sure a user is logged in
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // Remember which url user wanted to access (protected by login):
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in to view this content');
        return res.redirect('/login');
    }
    next();
}

// ---------------------------------------------------------------------

// Show time & date of request
module.exports.currentDate = (req, res, next) => {
    console.log(req.method, req.path); // Print the method + requested route
    req.requestTime = new Date(); // Every route that will use 'currentDate' will have access to time + date
   
    // adjust 0 before single digit date
    let date = ("0" + req.requestTime.getDate()).slice(-2);
    // current month
    let month = ("0" + (req.requestTime.getMonth() + 1)).slice(-2);
    // current year
    let year = req.requestTime.getFullYear();
    // current hours
    let hours = req.requestTime.getHours();
    // current minutes
    let minutes = req.requestTime.getMinutes();
    // current seconds
    let seconds = req.requestTime.getSeconds();
    // prints date & time in YYYY-MM-DD HH:MM:SS format
    console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
    next();
}

// ---------------------------------------------------------------------

// Make sure all campground fields are filled correctly (JOI)
module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

// ---------------------------------------------------------------------

// Make sure all review fields are filled correctly (JOI)
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

// ---------------------------------------------------------------------

// Make sure logged in user is the author of content
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params; // take id from url
    const camp = await Campground.findById(id); // lookup campground mathing to this id
    if ( !camp.author.equals(req.user._id)){ // look if user.id = author.id
        //if not:
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/campgrounds/${id}`)
    }
    //otherwise:
    next();
}

// ---------------------------------------------------------------------

// Make sure logged in user is the author of review
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params; // take id from url
    const review = await Review.findById( reviewId ); // lookup campground mathing to this id
    if ( !review.author.equals(req.user._id)){ // look if user.id = author.id
        //if not:
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/campgrounds/${id}`)
    }
    //otherwise:
    next();
}
