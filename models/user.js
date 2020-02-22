const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fname: { 
        type: String,
        required: true
    }, 
    lname: { 
        type: String,
        required: true
    }, 
    email: { type:String, required: true },
    password: { type:String, required: true },
    instagram: String,
    role: String
});

module.exports = mongoose.model("User", UserSchema);