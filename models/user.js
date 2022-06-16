const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Schema variable
const passportLocalMongoose = require('passport-local-mongoose');

// Create the Schema
const UserSchema = new Schema({ // we need email, name and password
    email:{
        type: String,
        required: true,
        unique: true
    }
});

// Possible error messages
const options = {
    MissingPasswordError: 'No password was given',
    AttemptTooSoonError: 'Account is currently locked. Try again later',
    TooManyAttemptsError: 'Account locked due to too many failed login attempts',
    NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
    IncorrectPasswordError: 'Password or username are incorrect',
    IncorrectUsernameError: 'Password or username are incorrect',
    MissingUsernameError: 'No username was given',
    UserExistsError: 'A user with the given username is already registered'
    };
    
UserSchema.plugin(passportLocalMongoose, options) // Adding username and password fields

// handling the unique email error during registration
UserSchema.post('save', function (error, _, next) {
    next(error.code === 11000
        ? new Error(`An account with that email address already exists. If that's you, please login.`)
        : error)
});

// next step is compiling our schema into a Model:
const User = mongoose.model('User', UserSchema); 

// Export the above model to create campgrounds somewhere else!
module.exports = User;