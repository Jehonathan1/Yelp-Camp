const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Schema variable

// Create the Schema
const reviewSchema = new Schema({
    body:String,
    rating: Number,
    author: 
    {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
});

// next step is compiling our schema into a Model:
const Review = mongoose.model('Review', reviewSchema); 

// Export the above model to create campgrounds somewhere else!
module.exports = Review;