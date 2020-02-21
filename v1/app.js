const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const methodOverride = require('method-override');
const path = require('path');
const multer = require('multer');
const Post = require('./models/post');
const Mail = require('./models/mail');
const Feature = require('./models/feature');

const app = express();


//  ========== DB CONFIG ==========
const db = require('./config/keys').MongoURI;

// =============== Mongo Connection ===============
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.log(err));


app.set("view engine", "ejs");
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));



const PORT = process.env.PORT || 3000;

// ======= Post Upload and Download for Admin ========

// Storage Engine
const adminStorage = multer.diskStorage({
    destination: './public/admin',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Upload
const adminUpload = multer({
    storage: adminStorage,
    limits: {fileSize: 100000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('image');

// ==================================

// ======= Feature Requests ========

// Storage Engine
const featureStorage = multer.diskStorage({
    destination: './public/feature',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Upload
const featureUpload = multer({
    storage: featureStorage,
    limits: {fileSize: 100000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('image');

// =================================

// Check file type
function checkFileType(file, cb){
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}



// =============================
// ========== ROUTES ===========
// =============================


app.get('/', (req, res) =>{
    res.render('home');
});

app.get('/photographs', (req, res) => {
    Post.find({}, (err, posts) => {
        if(err){
            console.log(err);
        } else {
            res.render('photographs/index', {posts: posts});
        }
    });
});

app.get('/photographs/new', (req, res) => {
    res.render('photographs/new');
});

app.post('/photographs', (req, res) => {
    adminUpload(req, res, (err) => {
        if(err){
            console.log('Could not upload!');
            res.redirect('/photographs/new');
        } else {
            if(req.file === undefined){
                console.log('No file selected!');
                res.redirect('/photographs/new');
            } else {
                const { photographer, location, caption, instagram, featured } = req.body;
                const post = new Post({
                    photographer: photographer, location: location, caption: caption, instagram: instagram, featured: featured, image: req.file.filename
                });
                post.save()
                    .then(() => {
                        console.log("Posted!");
                        res.redirect('/photographs');
                    })
                    .catch(err => console.log(err));
            }
        }
    });
});

app.get('/photographs/:post_id', (req, res) => {
    Post.findById(req.params.post_id, (err, post) => {
        if(err){
            console.log(err);
        } else {
            res.render('photographs/show', {post: post});
        }
    });
});


app.get('/photographs/requests', (req, res) => {
    Feature.find({}, (err, posts) => {
        if(err) {
            console.log(err);
        } else {
            const showPosts = [];
            posts.forEach(function(post){
                if(!post.featured){
                    showPosts.push(post);
                }
            });
            res.render('photographs/requests', {posts: showPosts});
        }
    });
});

// ======= CONTACT ME =======

app.post('/mail', (req, res) => {
    const { name, email, instagram, message } = req.body;
    const mail = new Mail({
        name: name, email: email,instagram: instagram, message: message
    });
    mail.save()
        .then(() => console.log("Thank you! I'll reply soon!"))
        .catch(err => console.log(err));
    res.redirect('/photographs');
});


// ======== ADD POST FOR FEATURE ========

app.post('/feature', (req, res) => {
    featureUpload(req, res, (err) => {
        if(err){
            console.log('Could not upload!');
            res.redirect('/');
        } else {
            if(req.file === undefined){
                console.log('No file selected!');
                res.redirect('/');
            } else {
                const { photographer, location, caption, instagram } = req.body;
                const feature = new Feature({
                    photographer: photographer, location: location, caption: caption, instagram: instagram, featured: false, image: req.file.filename, imagePath: req.file.path
                });
                feature.save()
                    .then(() => {
                        console.log("Sent to Admin!");
                        res.redirect('/photographs');
                    })
                    .catch(err => console.log(err));
            }
        }
    });
});

// Download option for Admin
app.get('/photographs/:post_id', (req, res) =>{
    Feature.findById(req.params.post_id, (err, post) => {
        if(err){
            console.log(err);
        } else {
            res.download(post.imagePath);
        }
    });
});

// ======= ERROR 404 =======
app.get('*', (req, res) => {
    res.render('error');
});

app.listen(PORT, console.log('BurstShot Server is live!'));