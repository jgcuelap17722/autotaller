module.exports = {
    isLoggedIn (req, res, next) {
        console.log('req',req.isAuthenticated())
        if (req.isAuthenticated()) { // retorna tru si existe usuario logeado
            return next();
        }
        return res.redirect('/signin'); //si no existe sesion redireccion singin
    },

    isNotLoggedIn(req,res,next){
    	if(!req.isAuthenticated()){
    		return next();
    	}
    	return res.redirect('/profile');
    }
};