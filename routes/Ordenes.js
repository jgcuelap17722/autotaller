var express = require('express');
var helpers = require('../lib/pug');
var router = express.Router();

const {crearOrden,RecuperarOrden} = require('../controllers/controlador.ordenes');

router.route('/')
  .post(crearOrden)
  .get(RecuperarOrden)
  //.get(crearOrden)

module.exports = router;