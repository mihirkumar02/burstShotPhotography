const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    photographer: String, 
    location: String, 
    instagram: String,
    caption: String, 
    featured: Boolean,
    image: String
});

module.exports = mongoose.model("Post", PostSchema);