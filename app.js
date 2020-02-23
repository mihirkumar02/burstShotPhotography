const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const methodOverride = require('method-override');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const User = require('./models/user');
const Post = require('./models/post');
const Mail = require('./models/mail');
const Feature = require('./models/feature');
const { isAdmin } = require('./config/auth');
const app = express();

// Passport config
require('./config/passport')(passport);

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


// Express Session middleware
app.use(session({
    secret: 'Secret message',
    resave: true,
    saveUninitialized: true
}));

// Passport middleware (Always after express session middleware)
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    // res.locals.error = req.flash('error');
    next();
});


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
            req.flash("error", "Something went wrong!");
        } else {
            res.render('photographs/index', {posts: posts});
        }
    });
});

app.get('/photographs/new', isAdmin, (req, res) => {
    res.render('photographs/new');
});


app.post('/photographs', isAdmin, (req, res) => {
    adminUpload(req, res, (err) => {
        if(err){
            req.flash("error", "Could not upload!");
            res.redirect('/photographs/new');
        } else {
            if(req.file === undefined){
                req.flash("error", "No file selected!");
                res.redirect('/photographs/new');
            } else {
                const { photographer, location, caption, instagram, featured } = req.body;
                const post = new Post({
                    photographer: photographer, location: location, caption: caption, instagram: instagram, featured: featured, image: req.file.filename
                });
                post.save()
                    .then(() => {
                        req.flash("success", "Posted!");
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
            req.flash("error", "Something went wrong!");
        } else {
            res.render('photographs/show', {post: post});
        }
    });
});

/*
app.get('/photographs/requests', (req, res) => {
    Feature.find({}, (err, foundPosts) =>{ 
        if(err){
            console.log(err);
        } else {
            const showPosts = [];
            foundPosts.forEach(function(post){
                if(!post.featured){
                    showPosts.push(post);
                }
            });
            res.render('photographs/requests', {posts: showPosts});
        }
    });
});

<li><a href="/photographs/requests"><i class="fa fa-plus"></i> Requests</a></li>

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
*/

// ======= CONTACT ME =======

app.post('/mail', (req, res) => {
    const { name, email, instagram, message } = req.body;
    const mail = new Mail({
        name: name, email: email,instagram: instagram, message: message
    });
    mail.save()
        .then(() => {
            req.flash("success", "Thank you! I hope you like the photos..");
            res.redirect('/');
        })
        .catch(err => req.flash("error", "Something went wrong!"));
});


// ======== ADD POST FOR FEATURE ========

app.post('/feature', (req, res) => {
    featureUpload(req, res, (err) => {
        if(err){
            req.flash("error", "Could not upload!");
            res.redirect('/');
        } else {
            if(req.file === undefined){
                req.flash("error", "No file selected!");
                res.redirect('/');
            } else {
                const { photographer, location, caption, instagram } = req.body;
                const feature = new Feature({
                    photographer: photographer, location: location, caption: caption, instagram: instagram, featured: false, image: req.file.filename, imagePath: req.file.path
                });
                feature.save()
                    .then(() => {
                        req.flash("success", "Your photo will be uploaded soon!"); 
                        res.redirect('/photographs');
                    })
                    .catch(err => console.log(err));
            }
        }
    });
});


// ============= AUTHENTICATION ==========

app.get("/users/login", (req, res) => res.render("login"));
app.get("/users/register", (req, res)=> res.render("register"));


// Register Handling

app.post('/users/register', function(req, res){
    const { fname, lname, email, password, instagram, role } = req.body;
    
    /*let errors = [];

    // Check required fields

    if (!fname || !lname || !email || !password || !password2 || !contact) {
        errors.push({ msg: 'Please fill all fields '});
    }
    // For faculties, check if access code matches
    
     if(code != 'edu123cafe'){
        errors.push({ msg: 'Incorrect Access Code!' });
    }
    

    // Check passwords match

    if(password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if(password.length < 6){
        errors.push({msg: 'Password should be atleast 6 characters'});
    }

    if(contact.length != 10){
        errors.push({msg: 'Contact number should be 10 digits long'});
    }

    if(errors.length > 0) {
        res.render('register', { errors, fname, lname, email, password, password2, contact, website, about, interests, city, country, role});
    } else {*/
        
        // Validation passed, now...
User.findOne({ email: email })
    .then(user => {
        if(user) {
            //errors.push({ msg: 'Email is already registered '});
            //User exists
            res.render('register', { fname, lname, email, password, instagram, role});
        } else {
            const newUser = new User({
                fname: fname, lname: lname, email: email, password: password,instagram: instagram, role: role
            })
            // Hash password
            bcrypt.genSalt(10, (err, salt) => 
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err
                    // Set password to hashed
                    newUser.password = hash;
                    newUser.save()
                        .then(user => {
                            req.flash('success', 'You are now registered and can log in.');
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err));
            }));
        }
    });
});


// Login handling
app.post('/users/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/photographs',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout handling
app.get('/logout', (req, res)=>{
    req.logout();
    req.flash('success', 'You are logged out!');
    res.redirect('/users/login');
});


// ========================================

// ======= ERROR 404 =======
app.get('*', (req, res) => {
    res.render('error');
});

app.listen(PORT, console.log('BurstShot Server is live!'));