if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
// require('dotenv').config();


// -----------------------------------------------------------------------------------------------------------------------------------------------------

const express = require('express'); // to run a server
const path = require('path'); // to access files 
const methodOverride = require('method-override'); // for 'put' requests
const mongoose = require('mongoose'); // to run db
const ejsMate = require('ejs-mate'); // to render ejs files
const ExpressError = require('./utils/ExpressError'); // to require the catchAsync function
const session = require('express-session'); // to set cookies
const flash = require('connect-flash'); // to show messages
const passport = require('passport'); // to secure information
const LocalStrategy = require('passport-local'); // to secure information
const User = require('./models/user');

const mongoSanitize = require('express-mongo-sanitize'); // to fight mongo injection
const helmet = require('helmet') // to protect our app

// Routes 
const campgroundsRoutes = require('./routes/campgrounds')
const reviewsRoutes = require('./routes/reviews')
const userRoutes = require('./routes/users')

const dbUrl = process.env.DB_URL || process.env.DEV_DB_URL
const MongoStore = require('connect-mongo');

// -----------------------------------------------------------------------------------------------------------------------------------------------------

//  --== DB SETTINGS ==--

mongoose.connect(dbUrl); // Create the name of the db

// If there is an error while trying to connect to the db
main().catch(err => {
    console.log('HO! MONGO CONNECTION ERROR!')
    console.log(err)
});

// Otherwise, connect to db
async function main() {
    await mongoose.connect(dbUrl);
    console.log('MONGO CONNECTION OPEN!!') // Remember to run MONGO server in the background!
}


// -----------------------------------------------------------------------------------------------------------------------------------------------------

//  --== APP SETTINGS ==--

const app = express(); // use 'Express' as our server

app.engine('ejs', ejsMate); // use the 'ejsMate' express engine for better layout

app.set('view engine', 'ejs'); // use 'ejs' to render pages
app.set('views', path.join(__dirname, 'views')); // access the 'views' directory

app.use(express.urlencoded({extended: true})) // This is for us to see the post routes
app.use(methodOverride('_method')) // This is for allowing 'PUT' request to apply on a form
app.use(express.static(path.join( __dirname, 'public' ))) // get access to static assets such as css files and more
app.use(mongoSanitize({
    replaceWith: '_'
})) // fight mongo injection

// -----------------------------------------------------------------------------------------------------------------------------------------------------

//  --== HELMET SETTINGS ==--

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dv5vm4sqh/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dv5vm4sqh/"
];
const connectSrcUrls = [
    "https://*.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://res.cloudinary.com/dv5vm4sqh/"
];
const fontSrcUrls = [ "https://res.cloudinary.com/dv5vm4sqh/" ];

app.use(
    helmet.contentSecurityPolicy({
        directives : {
            defaultSrc : [],
            connectSrc : [ "'self'", ...connectSrcUrls ],
            scriptSrc  : [ "'unsafe-inline'", "'self'", ...scriptSrcUrls ],
            styleSrc   : [ "'self'", "'unsafe-inline'", ...styleSrcUrls ],
            workerSrc  : [ "'self'", "blob:" ],
            objectSrc  : [],
            imgSrc     : [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/" + `${process.env.CLOUDINARY_CLOUD_NAME}` +"/", 
                `${process.env.CLOUDINARY_DEF_URL}`, 
                "https://images.unsplash.com/"
            ],
            fontSrc    : [ "'self'", ...fontSrcUrls ],
            mediaSrc   : [ "https://res.cloudinary.com/dv5vm4sqh/" ],
            childSrc   : [ "blob:" ]
        }
    })
  )

// ----------------------------------------------

// ------------------------------------------ - - --== SESSION SETTINGS ==-- - - ----------------------------------------------------------------

// Good for Authentication and flash messages:

const store = new MongoStore({
    mongoUrl: dbUrl,
    secret: process.env.STORE_SECRET,
    touchAfter: 24 * 3600 // saying to the session be updated only one time in a period of 24 hours
})

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})
const sessionConfig = {
    store,
    name: process.env.SESS_NAME,
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { // Additional cookie information
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}
app.use(session(sessionConfig))


// ----------------------------------------------

// PASSPORT  SETTINGS:

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // find the autentication method on the user model

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ----------------------------------------------

// FLASH MESSAGES SETTINGS - use flash for messages:

app.use(flash()); 

// Flash middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user; // access global information about logged users
    res.locals.success = req.flash('success'); // on every route, we will have access to all 'success' messages under local, using the key 'success'
    res.locals.error = req.flash('error'); // on every route, we will have access to all 'success' messages under local, using the key 'success'
    next();
})

// ----------------------------------------------

// App routes
app.use('/campgrounds', campgroundsRoutes) // campground routes
app.use('/campgrounds/:id/reviews', reviewsRoutes) // reviews routes
app.use('/', userRoutes) // userRoutes


// -----------------------------------------------------------------------------------------------------------------------------------------------------

//  --== ROUTES ==--

// 01. Home
app.get('/',  (req, res) => {
    res.render('home')
})

 // ----------------------------------- ERROR HANDLING -------------------------------------------------------

// 08. 404 Error
app.all('*', (req, res, next) => {
    next(new ExpressError('Oh Snap! Page not found, another 404 classic!', 404))
})

// 09. Costum Error Handling
app.use((err, req, res, next) => {
    const { statusCode = 500} = err;
    if (!err.message) err.message = 'Oh no, something went wrong!'
    res.status(statusCode).render('error', { err })
})

 // --------------------------------------- RUN THE APP -----------------------------------------------------------

// Run app
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})