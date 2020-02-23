module.exports = {
    isAdmin: function(req, res, next){
        if(req.isAuthenticated()){
            if(req.user.role === 'Admin'){
                next(); 
            } else{
                req.flash("error", "You don't have permission to view that page!");
                res.redirect("/photographs");
            }
        } else {
            req.flash("error","You need to be logged in as Admin!");
            res.redirect("/photographs");
        }
    }
}