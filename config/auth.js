module.exports = {
    isAdmin: function(req, res, next){
        if(req.isAuthenticated()){
            if(req.user.role === 'Admin'){
                next(); 
            } else{
                res.redirect("/photographs");
            }
        } else {
            res.redirect("/photographs");
        }
    }
}