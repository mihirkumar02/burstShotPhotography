const mongoose = require('mongoose');

const MailSchema = new mongoose.Schema({
    name: { type:String, required: true},
    email: { type:String, required: true },
    instagram: String, 
    message: { type:String, required: true}
});

module.exports = mongoose.model("Mail", MailSchema);