const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
    photographer: String, 
    location: String, 
    caption: String, 
    instagram: String,
    featured: Boolean,
    image: String,
    imagePath: String
});

module.exports = mongoose.model("Feature", FeatureSchema);