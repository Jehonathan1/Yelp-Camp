const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Schema variable
const Review = require('./review')
const {cloudinary} = require("../cloudinary");


// Create the Schema
const CampgroundSchema = new Schema({
    title: String,
    images: [ {
        url: String,
        filename: String,
    } ],
    price: Number,
    description: String,
    location: String,
    author: 
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    console.log(doc)
    if(doc){ // if there are reviews related to a campground
        const res = await Review.deleteMany({_id: { $in: doc.reviews } }) // delete related reviews
        console.log(res) // Make sure reviews were deleted
        for (let file of doc.images) {
            await cloudinary.uploader.destroy(file.filename)

        }
    }
})

// next step is compiling our schema into a Model:
const Campground = mongoose.model('Campground', CampgroundSchema); 



// Export the above model to create campgrounds somewhere else!
module.exports = Campground;