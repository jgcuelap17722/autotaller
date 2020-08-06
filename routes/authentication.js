const passport                      = require('passport');
const express                       = require('express');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const pool                          = require('../database'); // referencia a ala base de datos
const helpers                       = require('../lib/helpers');
const { asinarOrden }               = require('../controllers/controlador.ordenes');

const router = express.Router();

//router.get('/signup',isNotLoggedIn, (req, res) =>{
//    res.render('auth/signup');
//})

router.get('/signup', isLoggedIn, async (req, res) => {
  let InfoUser      = await helpers.InfoUser(req.user.id_usuario);// Info Usuario Logueado
  if (InfoUser.id_usuario != 1) {
    res.render('profile');
  } else {
    const Data = await pool.query('SELECT id_tipo_usuario,tipo_usuario FROM ttipo_usuario;');

    const idTipo_Usuario = [];
    const Tipo_Usuario = [];
    let n = 0;

    console.log('Data', Data);
    Data.forEach((element) => {
      idTipo_Usuario[n] = element.id_tipo_usuario;
      Tipo_Usuario[n] = element.tipo_usuario;
      n++;
    });

    const Tipos_Usuario = { idTipo_Usuario, Tipo_Usuario };
    // Datos que se enviaran al registro
    const Registro_Usuario = { InfoUser, Tipos_Usuario };
    console.log('idTipo_Usuario,Tipo_Usuario', Tipos_Usuario);
    res.render('auth/signup', { data:Registro_Usuario });
  }
});

router.post('/signup',isNotLoggedIn, passport.authenticate('local.signup', { // REGISTRO
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }));

// SINGIN
router.get('/signin',isNotLoggedIn, (req, res) => {  // LOGGIN
    res.render('auth/signin');
  });
  
  router.post('/signin',isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local.signin', {
      successRedirect: '/profile',
      failureRedirect: '/signin',
      failureFlash: true
    })(req, res, next);
  });


//PROFILE
  router.get('/profile',isLoggedIn, async (req, res, next) =>{
      const InfoUser = await helpers.InfoUser(req.user.id_usuario);
      const data_User = {InfoUser};
      console.log('data_User',data_User)
      res.render('profile',{data:data_User});
  })

  router.route('/profile')
    .post(asinarOrden);

  router.get('/logout',isLoggedIn, (req, res) => {
    req.logOut();
    res.redirect('/signin');
  });

module.exports = router;