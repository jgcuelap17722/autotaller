const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  //console.log(req.body);
  console.log('username es ',username);
  //console.log(password);
  const rows = await pool.query('SELECT * FROM tusuario WHERE username = ?', [username]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) {
      done(null, user, req.flash('success', 'Welcome ' + user.username));
    } else {
      done(null, false, req.flash('message', 'Incorrect Password'));
    }
  } else {
    return done(null, false, req.flash('message', 'The Username does not exists.'));
  }
}));



passport.use('local.signup', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true // sirve para 
}, async (req, username, password, done) => {

	console.log(req.body);
  const { fullname } = req.body;
  let newUser = {
    fullname,
    username,
    password
  };
  //desde helpers quiero usar su metodo encript paswword
  //para sifrarla pw y recibe una contraceña (paswword) y es asincrono 
  newUser.password = await helpers.encryptPassword(password);
  //y recojer mi contraceña sifrada
  // Saving in the Database
  const result = await pool.query('SET @@auto_increment_increment = 1; INSERT INTO tusuario SET ? ', [newUser]);
  console.log(result);
  newUser.id_persona = result.insertId; //agregar el id al newuser
  return done(null, newUser); //debolber el nuevo usuario
}));

//guardar el id del usuario en una sesion
passport.serializeUser((user, done) => {
  done(null, user.id_persona);
});

//usar el id almacenado para obtener los datos 
passport.deserializeUser(async (id_persona, done) => {
  const rows = await pool.query('SELECT * FROM tusuario WHERE id_usuario = ?', [id_persona]);
  done(null, rows[0]);
});