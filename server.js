const path = require('path');
const morgan = require('morgan');
const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const passport = require('passport');
const https = require('https');
const fs = require('fs')
const flash = require('connect-flash'); // Middlewares
const MySQLStore = require('express-mysql-session')
const coneccion = require('./database');
const { database } = require('./keys');
const helpers = require('./lib/helpers');
const CronJob = require('cron').CronJob;
require('dotenv').config()

// Funcion parahacer consultass
Consulta = (pQuery) => { return coneccion.query(pQuery) };

// Objeto para fecha normal HOY y Fecha Para incertar

//inicializacion
const app = express();
require('./lib/passport');

//Configuracion
app.set('port', process.env.PORT || 4500);

// Middlewares
app.use(session({
  secret: 'faztmysqlnodemysql',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore(database) //donde guardar la secion
}));

app.use(flash());
app.use(passport.initialize()); //iniciate passport
app.use(passport.session());  //inicia secion passport

app.use(morgan('dev')); //usar morgan
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Variables Globales variables que toda la APP pueda acceder"
app.use(async (req, res, next) => {
  app.locals.success = req.flash('success');
  app.locals.messages = req.flash('messages');
  app.locals.confirmation = req.flash('confirmation');
  app.locals.user = req.user;
  //console.log('req.user =============> ',req.user)
  if (typeof req.user != 'undefined') {
    const infUser = await Consulta('SELECT * FROM v_tusuario_tpersona WHERE id_usuario = ' + req.user.id_usuario + ';');
    app.locals.users = infUser[0];
  }
  next();
});

//Rutas
app.use('/', require('./routes'));
app.use('/abrir-orden', require('./routes/Ordenes'));
app.use(require('./routes/authentication')); //para autenticar usuario
/* var routes = require('./routes');
app.use('/', routes); */

//Publico "archibos que toda la APP pueda acceder"
app.use(express.static(path.join(__dirname, 'public')));

//Iniciar el Servidor

// localhost con sertificado ssl
/* const httpsOptions = {
  key: fs.readFileSync('./security/cert.key'),
  cert: fs.readFileSync('./security/cert.pem')
}

const server = https.createServer(httpsOptions, app)
  .listen(app.get('port'), () => {
    console.log('Servidor en Puerto ', app.get('port'));
  }); */

// localhost SIN sertificado ssl
const server = app.listen(app.get('port'),() => {
	console.log('Servidor en Puerto ',app.get('port'));
});

//coneccion de socket
const SocketIO = require('socket.io');
const io = SocketIO(server);

// Lugar de las vistas y con el respectivo motor de busquedas
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));

// creating routes 
app.get('*', function (req, res) {
  let error = 'error: Pagina no encontrada'; 
  res.render('Pagina404',{error:error});
}) 

/* var pool    =    mysql.createPool({
      connectionLimit   :   100,
      host              :   'localhost',
      user              :   'root',
      password          :   'password',
      database          :   'bd_autolinea_181119',
      debug             :   false
}); */
//====================================================================================

// === S O C K E T S ===

Ejecucion_de_Cron = async (data, nDatos) => {

  // INCERTAR LA FECHA DE NOTIFICACION 
  let fecha_Notificacion = helpers.new_Date(new Date()),
    fecha_Notificacion_str = helpers.formatDateTime(fecha_Notificacion);

  let query = 'UPDATE tseguimiento SET fecha_notificacion = "' + fecha_Notificacion_str + '" WHERE id_seguimiento = ' + data.id_seguimiento + ';';
  await Consulta(query);

  //let fecha_timeago = helpers.timeago(fecha_Notificacion);

  let obj_Crear_Seguimiento = {
    nombre_cliente: data.nombre_cliente,
    dia: data.nombre_etapa_seguimineto,
    fecha_notificacion: helpers.timeago_int(data.fecha_Notificacion),
    id_detalle_pedido: data.id_detallePedido,
    id_seguimiento: data.id_seguimiento,
    id_cliente: data.id_cliente,
    id_vehiculo: data.id_vehiculo,
    nro_seguimientos: nDatos
  };
  console.log('OBJETO ARMADO=>', obj_Crear_Seguimiento)
  io.emit('Crear_Notificaciones_Seguimiento', obj_Crear_Seguimiento)
}

(fauto = async () => {

  const query_notificaciones_futuras = 'SELECT * FROM v_ids_detalle_seguimiento WHERE fecha_notificacion is null && id_estado_seguimiento <> 2 && id_etapa_seguimiento <> 4 && id_etapa_seguimiento <> 5 && id_etapa_seguimiento <> 6;';
  const Notif_Futuras = await Consulta(query_notificaciones_futuras);
  console.log('Notificaciones SEGUIMIENTO HOY', Notif_Futuras)
  //ARMANDO MI FECHA
  let My_Fecha_Actual = helpers.new_Date(new Date());
  let Mi_anio = My_Fecha_Actual.getFullYear();
  let Mi_fecha = My_Fecha_Actual.getDate();  //1 - 31
  let Mi_mes = My_Fecha_Actual.getMonth() + 1; //0 - 11
  let Mi_fecha_String = '' + Mi_fecha + '/' + Mi_mes + '/' + Mi_anio + ''
  let nro_seguimientos = Notif_Futuras.length;

  for (let j = 0; j <= Notif_Futuras.length - 1; j++) {
    console.log('INICIO*******************************************************************************')
    //SABER EN QUE ETAPA ESTA LA NOTIFICACION QUE LLEGARÁ 1 2 3
    console.log('El contador es: ', j)
    // ARMAR EL OBJETO PARA ENVIARLO
    let data_seguimiento = {
      id_etapa_seguimiento: Notif_Futuras[j].id_etapa_seguimiento,
      nombre_cliente: Notif_Futuras[j].nombre_cliente,
      fecha_salida: Notif_Futuras[j].fecha_salida,
      fecha_notificacion: Notif_Futuras[j].fecha_notificacion,
      fecha_seguimiento: Notif_Futuras[j].fecha_seguimiento,
      id_detallePedido: Notif_Futuras[j].id_detallePedido,
      nombre_etapa_seguimineto: Notif_Futuras[j].nombre_etapa_seguimineto,
      id_seguimiento: Notif_Futuras[j].id_seguimiento,
      id_cliente: Notif_Futuras[j].id_cliente,
      id_vehiculo: Notif_Futuras[j].id_vehiculo
    }

    console.log('OBKETO_NUEVOd:', data_seguimiento);

    switch (data_seguimiento.id_etapa_seguimiento) {
      case 1:

        let fecha_cron_1 = data_seguimiento.fecha_salida;
        fecha_cron_1.setDate(fecha_cron_1.getDate() + 1);
        fecha_cron_1.setHours(9);
        fecha_cron_1.setMinutes(0);
        fecha_cron_1.setSeconds(0);

        let Mi_anio_cron_1 = fecha_cron_1.getFullYear();
        let Mi_fecha_cron_1 = fecha_cron_1.getDate();  //1 - 31
        let Mi_mes_cron_1 = fecha_cron_1.getMonth() + 1; //0 - 11

        let Mi_fecha_cron_1_String = '' + Mi_fecha_cron_1 + '/' + Mi_mes_cron_1 + '/' + Mi_anio_cron_1 + ''

        console.log('Nueva fecha Cron_1 es ==', helpers.formatDateTime(fecha_cron_1))
        console.log('Mi fecha', My_Fecha_Actual, ' >= ', fecha_cron_1);
        if (My_Fecha_Actual >= fecha_cron_1) {

          console.log('Si')
          Ejecucion_de_Cron(data_seguimiento, nro_seguimientos);

        } else if (Mi_fecha_String == Mi_fecha_cron_1_String) {

          new CronJob({
            cronTime: fecha_cron_1,
            onTick: CronFunction = () => {
              console.log('EJECUCION____Cron ID_', data_seguimiento.id_seguimiento);
              Ejecucion_de_Cron(data_seguimiento, nro_seguimientos);
            },
            start: true,
            timeZone: 'America/Lima'
          });

        } else {
          console.log('Todavia No -- Ahorita vemos')
        }
        console.log('CASE_1_ANTES', j);
        //j++
        console.log('CASE_1_DESPUES', j);
        break;
      case 2:
        const query_ultimo_seguimiento_2 = 'CALL SP_ULTIMO_REGISTRO_SEGUIMIENTO(' + data_seguimiento.id_vehiculo + ')';
        const consulta_ultimo_seguimiento_2 = await Consulta(query_ultimo_seguimiento_2);
        console.log('Ultimo seguimiento de Vehiculo_2', consulta_ultimo_seguimiento_2[0][0])

        let fecha_cron_2 = consulta_ultimo_seguimiento_2[0][0].fecha_seguimiento;
        fecha_cron_2.setDate(fecha_cron_2.getDate() + 7);
        fecha_cron_2.setHours(9);
        fecha_cron_2.setMinutes(0);
        fecha_cron_2.setSeconds(0);
        console.log('Nueva fecha Cron_2 es ==', helpers.formatDateTime(fecha_cron_2));

        let Mi_anio_cron_2 = fecha_cron_2.getFullYear();
        let Mi_fecha_cron_2 = fecha_cron_2.getDate();  //1 - 31
        let Mi_mes_cron_2 = fecha_cron_2.getMonth() + 1; //0 - 11

        let Mi_fecha_cron_2_String = '' + Mi_fecha_cron_2 + '/' + Mi_mes_cron_2 + '/' + Mi_anio_cron_2 + ''

        if (My_Fecha_Actual >= fecha_cron_2) {

          Ejecucion_de_Cron(data_seguimiento, nro_seguimientos);

        } else if (Mi_fecha_String == Mi_fecha_cron_2_String) {

          new CronJob({
            cronTime: fecha_cron_2,
            onTick: CronFunction = () => {
              console.log('EJECUCION____Cron ID_', data_seguimiento.id_seguimiento);
              Ejecucion_de_Cron(data_seguimiento, nro_seguimientos);
            },
            start: true,
            timeZone: 'America/Lima'
          });

        } else {
          console.log('Todavia No -- Ahorita vemos')
        }
        console.log('CASE_2_ANTES', j);
        //j++
        console.log('CASE_2_DESPUES', j);
        break;

      case 3:
        const query_ultimo_seguimiento_3 = 'CALL SP_ULTIMO_REGISTRO_SEGUIMIENTO(' + data_seguimiento.id_vehiculo + ')';
        const consulta_ultimo_seguimiento_3 = await Consulta(query_ultimo_seguimiento_3);
        console.log('Ultimo seguimiento de Vehiculo_3', consulta_ultimo_seguimiento_3[0])

        let fecha_cron_3 = consulta_ultimo_seguimiento_3[0][0].fecha_seguimiento;
        fecha_cron_3.setDate(fecha_cron_3.getDate() + 30);
        //fecha_cron_3.setMonth(fecha_cron_3.getMonth());
        //fecha_cron_3.setFullYear(consulta_ultimo_seguimiento_3[0][0].fecha_seguimiento.getFullYear());
        fecha_cron_3.setHours(9);
        fecha_cron_3.setMinutes(0);
        fecha_cron_3.setSeconds(0);
        console.log('Nueva fecha Cron_3 es ==', helpers.formatDateTime(fecha_cron_3));

        let Mi_anio_cron_3 = fecha_cron_3.getFullYear();
        let Mi_fecha_cron_3 = fecha_cron_3.getDate();  //1 - 31
        let Mi_mes_cron_3 = fecha_cron_3.getMonth() + 1; //0 - 11

        let Mi_fecha_cron_3_String = '' + Mi_fecha_cron_3 + '/' + Mi_mes_cron_3 + '/' + Mi_anio_cron_3 + ''
        console.log('Hora de llegada pactada', Mi_fecha_cron_3_String)

        if (My_Fecha_Actual >= fecha_cron_3) {

          Ejecucion_de_Cron(data_seguimiento, nro_seguimientos);

        } else if (Mi_fecha_String == Mi_fecha_cron_3_String) {

          new CronJob({
            cronTime: fecha_cron_3,
            onTick: CronFunction = () => {
              console.log('EJECUCION____Cron ID_', data_seguimiento.id_seguimiento);
              Ejecucion_de_Cron(data_seguimiento, nro_seguimientos);
            },
            start: true,
            timeZone: 'America/Lima'
          });

        } else {

          console.log('Todavia No -- Ahorita vemos')

        }
        console.log('CASE_3_ANTES', j);
        //j++
        console.log('CASE_3_DESPUES', j);
        break;
      /*         default:
                break; */

    }
    console.log('FIN*******************************************************************************')
    console.log('El contador j es: ', j);

  }

  console.log('Esta es mi fecha', My_Fecha_Actual);

})();

io.on('connection', (sk_nuevoCliente) => {
  console.log("socket sk_nuevoCliente");

  // RECIBIR UNA MARCA Y DEVOLVER SUS MODELOS E IDS
  sk_nuevoCliente.on('marca_auto', async (pmarca) => {
    const SP_modelo_de_marca = await coneccion.query('call SP_get_modelo_marca("' + pmarca + '")');
    // Variables para extraer modelo de la marca
    const id = [], modelo = [], modelo_de_marca = SP_modelo_de_marca[0];
    // Extraer valores atravez de un forEach
    let i = 0
    modelo_de_marca.forEach(element => {
      id[i] = element.id_modelo_auto
      modelo[i] = element.modelo
      i++;
    });
    const idModelo = { id, modelo }
    // enviar esos modelos por un socket :D
    sk_nuevoCliente.emit('modelo_auto', idModelo);
  });

  sk_nuevoCliente.on('generacion_modelo', async (pmodelo) => {
    const SP_modelo_de_marca = await coneccion.query('call SP_get_generacion_modelo("' + pmodelo + '")');
    // Variables para extraer modelo de la marca
    const id = [], generacion = [], generacion_de_modelo = SP_modelo_de_marca[0];
    // Extraer valores atravez de un forEach
    let i = 0
    generacion_de_modelo.forEach(element => {
      id[i] = element.id_generacion
      generacion[i] = element.generacion
      i++;
    });
    const idGeneracion = { id, generacion }
    // enviar esos modelos por un socket :D
    sk_nuevoCliente.emit('generacion_auto', idGeneracion);
  });

  sk_nuevoCliente.on('data_cliente', async (pid_cliente) => {
    const Query_info_Cliente = await coneccion.query('SELECT nombre_cliente,telefono,email,dni,ruc,razon_social,direccion FROM tcliente WHERE id_cliente = "' + pid_cliente + '"');
    // Variables para extraer modelo de la marca
    const data = { tipo_cliente, nombre_cliente, telefono, email, dni, ruc, razon_social, direccion } = Query_info_Cliente[0];
    console.log('data', data);
    sk_nuevoCliente.emit('data_info_cliente', data);
  });

  //SOCKES PARA CONSULTAS DE APIS
  sk_nuevoCliente.on('solicitar_info_dni', async (pDni) => {
    let data = await helpers.Consulta_Dni(pDni);
    sk_nuevoCliente.emit('recuperar_info_dni', data)
  });

  sk_nuevoCliente.on('solicitar_info_ruc', async (pRuc) => {

    let data = await helpers.Consulta_Ruc(pRuc);
    if (data == 'DESCONECCION RUC') {
      sk_nuevoCliente.emit('recuperar_info_ruc', data)
    } else {
      console.log('test data 2', data);

      String.prototype.capitalize = function () {
        return this.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
      };

      const razon_social = (data.razon_social.toLowerCase()).capitalize();
      const domicilio_fiscal = (data.domicilio_fiscal.toLowerCase()).capitalize();

      const info_ruc = { razon_social, domicilio_fiscal };

      console.log('Salida Ruc', info_ruc)

      sk_nuevoCliente.emit('recuperar_info_ruc', info_ruc)
    }
  });
});

// INCERTAR UN NUEVO NOMBRE DE  SERVICIO
io.on('connection', (sk_CrearOrden) => {
  sk_CrearOrden.on('Crear_Servicio', async (Data) => {
    console.log(Data)
    let str_fecha = helpers.formatDateTime(helpers.new_Date(new Date()))
    await coneccion.query('CALL SP_Crear_Servicio("' + Data.Nombre + '","' + Data.id + '","'+str_fecha+'");');
    let Servicio_Agregado = await coneccion.query('CALL SP_Recuperar_Servicio_Agregado("' + Data.id + '")');
    const NewService = Servicio_Agregado[0][0]
    sk_CrearOrden.emit('Servicio_agregado', NewService);
  });

  // SOCKET UTILIZADO ACUALIAR ACCION DE MECANICO A 3
  // CON UN SOCKET LISTANDO LOS NUEVOS MECANICOS DESOCUPADOS
  sk_CrearOrden.on('Asignar_Mecanico', async (data) => {
    const query_asignar_mecanico = 'UPDATE tusuario SET nro_ordenes = nro_ordenes + 1 WHERE (id_usuario = ' + data + ');';

    const query_Mecanicos_Habilitados = 'SELECT id_usuario,nombre,apellido_paterno,nro_ordenes FROM v_mecanicos_hablilitados;';

    await coneccion.query(query_asignar_mecanico);

    let Mecanicos_Habilitados = await coneccion.query(query_Mecanicos_Habilitados);
    // LISTAR LOS MEANICOS DESOCUPADOS
    io.emit('Mecanico_Asignado', Mecanicos_Habilitados); // => crearOrden
  });

});


io.on('connection', (sk_Navigation) => {
  console.log('=> k_Navigation')

  // Este es un pinche tubo que registra la asignacion y envia esa notificacion
  sk_Navigation.on('Enviar_Notificacion', async (data_idUsuario_receptor, data_idUsuario_emisor, pNoroOrden) => {

    // === === === === ASIGNACION DE PEDIDO === === === ===

    //SABER CON QUE TIPO USUARIO ESTOY 
    let query_id_tipo_usuario = 'SELECT id_tipo_usuario FROM tusuario_ttipousuario WHERE id_usuario = ' + data_idUsuario_receptor + ';';
    let consulta_idTipo_usuario = await Consulta(query_id_tipo_usuario);
    let { id_tipo_usuario } = consulta_idTipo_usuario[0];
    // salida de esta consulta 
    console.log('Mi id: ', data_idUsuario_receptor, ' es de tipo: ', id_tipo_usuario);

    //RECUPERAR EL (id_detallePedido) AL QUE ESTA SIENDO ASIGNADO
    let query_idDetallePedido = 'SELECT id_detallePedido,id_vehiculo FROM tdetallepedido WHERE id_usuario_asignador = ' + data_idUsuario_emisor + ' && nro_orden = ' + pNoroOrden + ';'
    const consulta_idDetallePedido = await Consulta(query_idDetallePedido)
    const { id_detallePedido, id_vehiculo } = await consulta_idDetallePedido[0]
    console.log('AL QUE ESTA SIENDO ASIGNADO', consulta_idDetallePedido);


    //RECUPERAR EL ID DE NOTIFICACION VINCULADA A ESTE EMISOR Y RECEPTOR
    //(Fn_Enviar_Notificacion) esta funcion inserta en tnotificaciones un user_emisor y user_receptor
    //despues recupera el id de la notificacion agregada.
    console.log('Mostrar Objeto',f_hoy);
    let str_fecha = helpers.formatDateTime(helpers.new_Date(new Date()))
    let query_id_notificacion = 'CALL SP_FN_Enviar_Notificacion(' + data_idUsuario_emisor + ',' + data_idUsuario_receptor + ',"'+str_fecha+'")';
    const consulta_id_Notificacion = await Consulta(query_id_notificacion)
    const { id_Notificacion } = consulta_id_Notificacion[0][0]

    //CAPTURAR LOS DETALLES DEL USUARIO QUE ME ESTA ENVIANDO ESTA NOTIFICACION
    //(SP_Detalles_Notificacion) muestra toda la informacion del "idUsuario_emisor"
    let query_Detalle_Notificacion = 'CALL SP_Detalles_Notificacion(' + data_idUsuario_receptor + ',' + id_Notificacion + ')'
    const consulta_Detalles_Notificacion = await Consulta(query_Detalle_Notificacion);
    const User_Emisor = { nombre, apellido_paterno, fecha_creacion } = consulta_Detalles_Notificacion[0][0]
    const tiempo_Notificacion = helpers.timeago_int(fecha_creacion) // ==> convertir el tiempo

    // OBTENER EL NRO DE NOTIFICACIONES DE ESTE USUARIO
    let query_Notificaciones = 'SELECT count(id_notificaciones) as nro_Notificaciones FROM tnotificaciones WHERE id_user_receptor = ' + data_idUsuario_receptor + ' && id_estado_notificacion = 1;';
    const consulta_Notificacion = await coneccion.query(query_Notificaciones);
    const { nro_Notificaciones } = consulta_Notificacion[0];

    // RECUPERAR LA INFO DEL VEHICULO PARA MOSTRAR EN LA NOTIFICACION
    console.log('IDE', id_detallePedido)
    let query_info_vehiculo = 'SELECT placa,vehiculo_marca,modelo FROM v_tvehiculo WHERE id_vehiculo = ' + id_vehiculo + ';';
    let consulta_info_vehiculo = await Consulta(query_info_vehiculo);
    console.log('detale Vehiculo Consulta', consulta_info_vehiculo)
    let vehiculo = {
      placa: consulta_info_vehiculo[0].placa,
      vehiculo_marca: consulta_info_vehiculo[0].vehiculo_marca,
      modelo: consulta_info_vehiculo[0].modelo
    }

    console.log('detale Vehiculo', vehiculo)

    //UNIMOS TODO PARA ENVIAR A - navigation -
    const info_Notif = { User_Emisor, pNoroOrden, nro_Notificaciones, tiempo_Notificacion };
    console.log('Info noti =>', info_Notif, 'id_Receptor => ', data_idUsuario_receptor)
    io.emit('Notificacion_Recibida', info_Notif, data_idUsuario_receptor, id_detallePedido, id_tipo_usuario, id_Notificacion, vehiculo)
  });

  // Solo Se usa este socket cuano el mecanico emite a facturar la orden
  sk_Navigation.on('Enviar_Notificacion_detallePedido_terminada', async (data_idUsuario_receptor,
    data_idUsuario_emisor,
    pNoroOrden,
    pId_Detalle_Pedido,
    pId_Notificacion) => {

    let query_info_vehiculo = `SELECT distinct placa,vehiculo_marca,modelo  
      FROM v_detales_de_enviopedido
      WHERE id_detallePedido = `+ pId_Detalle_Pedido + `;`;
    let consulta_info_vehiculo = await Consulta(query_info_vehiculo);
    let vehiculo = {
      placa: consulta_info_vehiculo[0].placa,
      vehiculo_marca: consulta_info_vehiculo[0].vehiculo_marca,
      modelo: consulta_info_vehiculo[0].modelo
    }

    console.log('data VEHICULO', vehiculo)


    const consulta_id_caja = await Consulta('SELECT id_usuario FROM v_cajeros_habilitados limit 1;');
    data_idUsuario_receptor = consulta_id_caja[0].id_usuario // sacamos el usuaro de caja solo el primer resultado

    //SABER CON QUE TIPO USUARIO ESTOY 
    let query_id_tipo_usuario = 'SELECT id_tipo_usuario FROM tusuario_ttipousuario WHERE id_usuario = ' + data_idUsuario_receptor + ';';
    let consulta_idTipo_usuario = await Consulta(query_id_tipo_usuario);

    console.log('consulta_idTipo_usuario', consulta_idTipo_usuario[0]);

    let { id_tipo_usuario } = consulta_idTipo_usuario[0];

    console.log('data_idUsuario_receptor', data_idUsuario_receptor);
    console.log('data_idUsuario_emisor', data_idUsuario_emisor);

    //RECUPERAR EL ID DE NOTIFICACION VINCULADA A ESTE EMISOR(MECANICO) Y RECEPTOR(CAJA)
    console.log('Mostrar Objeto',f_hoy);
    let str_fecha = helpers.formatDateTime(helpers.new_Date(new Date()))
    let query_id_notificacion = 'CALL SP_FN_Enviar_Notificacion(' + data_idUsuario_emisor + ',' + data_idUsuario_receptor + ',"'+str_fecha+'")';
    const consulta_id_Notificacion = await coneccion.query(query_id_notificacion)
    const { id_Notificacion } = consulta_id_Notificacion[0][0]

    //CAPTURAR LOS DETALLES DEL USUARIO QUE ME ESTA ENVIANDO ESTA NOTIFICACION
    let query_Detalle_Notificacion = 'CALL SP_Detalles_Notificacion(' + data_idUsuario_receptor + ',' + id_Notificacion + ')'
    const consulta_Detalles_Notificacion = await coneccion.query(query_Detalle_Notificacion);
    const User_Emisor = { nombre, apellido_paterno, fecha_creacion } = consulta_Detalles_Notificacion[0][0]
    const tiempo_Notificacion = helpers.timeago_int(fecha_creacion) // ==> convertir el tiempo

    //LIBERAR AL MECANICO ASIGNADO PARA LUEGO SER ASIGNADO
    const consulta_Liberar_Mecanico = 'UPDATE tusuario SET nro_ordenes = nro_ordenes-1 WHERE (id_usuario = ' + data_idUsuario_emisor + ');';
    await coneccion.query(consulta_Liberar_Mecanico);

    //ELIMINAR LA NOTIFICACION QUE HABIA RECIBIDO CUANDO LO ASIGNARON A UN ORDEN
    //await coneccion.query('DELETE FROM tnotificaciones WHERE (id_user_receptor ='+data_idUsuario_emisor+' );')

    await coneccion.query('UPDATE tnotificaciones SET id_estado_notificacion = 2 WHERE id_notificaciones = ' + pId_Notificacion + ';')

    // OBTENER EL NRO DE NOTIFICACIONES DE ESTE USUARIO
    let query_Notificaciones = 'SELECT count(id_notificaciones) as nro_Notificaciones FROM tnotificaciones WHERE id_user_receptor = ' + data_idUsuario_receptor + ' && id_estado_notificacion = 1;';

    // ACTUALIZAMOS EL DETALLEPedido a Facturando
    await Consulta('UPDATE tdetallepedido SET id_estadoOrden = 6 WHERE id_detallePedido = ' + pId_Detalle_Pedido + ';');

    // ACTUALIZAMOS EL TORDENES ACTUALES a Facturando
    await Consulta('UPDATE tordenes_actuales SET id_estadoOrden = 6 WHERE nro_orden = ' + pNoroOrden + ';');

    const consulta_Notificacion = await coneccion.query(query_Notificaciones);
    const { nro_Notificaciones } = consulta_Notificacion[0];

    const info_Notif = { User_Emisor, pNoroOrden, nro_Notificaciones, tiempo_Notificacion };
    console.log('INFORMACION DE NOTIFICACION--------------------------');
    console.log(info_Notif);
    console.log('INFORMACION DE NOTIFICACION--------------------------FIN');
    io.emit('Notificacion_Recibida', info_Notif, data_idUsuario_receptor, pId_Detalle_Pedido, id_tipo_usuario, id_Notificacion, vehiculo)
  });

  // ESTA FUNCION ES LA QUE SE CONSULTA POR RECARGA DE PAGINA
  // CNSULTANDO A LA TABLA SI TENGO NOTIFICACIONES
  sk_Navigation.on('Requiero_Notificaciones', async (data_idUsuario_receptor) => {
    // Variables de Entorno
    let Emisor_nombre = [], Emisor_apellido_paterno = [], Emisor_fecha_creacion = [], ids_Notificaciones = [], nro_orden = [], id_Detalle_Pedidos = [], vehiculo = [];

    //SABER CUANTAS NOTIFICACIONES HAY EN LA TABLA TNOTIFICACIONES DE MI USUARIO
    let query_nro_Notificaciones = 'SELECT count(id_notificaciones) as nro_Notificaciones FROM tnotificaciones WHERE id_user_receptor = ' + data_idUsuario_receptor + ' && id_estado_notificacion = 1;';
    let consulta_Notificacion = await Consulta(query_nro_Notificaciones);
    let { nro_Notificaciones } = consulta_Notificacion[0];
    // salida de esta consulta 
    console.log('Mi id: ', data_idUsuario_receptor, ' tiene: ', nro_Notificaciones, 'Notificaciones');

    //SABER CON QUE TIPO USUARIO ESTOY HACIENDO LA RECARGA DE PAGINA
    let query_id_tipo_usuario = 'SELECT id_tipo_usuario FROM tusuario_ttipousuario WHERE id_usuario = ' + data_idUsuario_receptor + ';';
    let consulta_idTipo_usuario = await coneccion.query(query_id_tipo_usuario);
    let { id_tipo_usuario } = consulta_idTipo_usuario[0];
    // salida de esta consulta 
    console.log('Mi id: ', data_idUsuario_receptor, ' es de tipo: ', id_tipo_usuario);

    //SABER CUALES SON LOS IDS DE NOTIFICACION DE MI ID
    let consulta_id_notificacion = await coneccion.query('SELECT id_notificaciones FROM tnotificaciones WHERE id_user_receptor = ' + data_idUsuario_receptor + ' && id_estado_notificacion = 1');
    // salida de esta consulta 
    console.log('Mi id: ', data_idUsuario_receptor, ' tiene estos id de notificacion: ', consulta_id_notificacion);

    // VERIFICAR EL TIPO DE USUARIO QUE ESTA RECARGANDO LA PAGINA
    if (id_tipo_usuario != 2 && id_tipo_usuario != 1) {
      if (nro_Notificaciones != 0) {
        //let id_Detalle_Pedidos = [];
        // si es cajero(a) y tiene mas de 0 notificaciones

        //SABER CUANTOS ID_DETALLEPEDIDO_TENGO ASIGNADO COMO CAJA
        const query_id_detalle_pedido_caja = 'CALL SP_GET_idDetalle_Pedido_caja(' + data_idUsuario_receptor + ');';
        const consulta_id_detalle_pedido_caja = await coneccion.query(query_id_detalle_pedido_caja);

        console.log('Mi id:', data_idUsuario_receptor, ' tiene ', consulta_id_detalle_pedido_caja[0]);

        const ids_detalle_pedido_caja = consulta_id_detalle_pedido_caja[0];
        const ids_detalle_pedido = [];
        let cont = 0;
        ids_detalle_pedido_caja.forEach(element => {
          ids_detalle_pedido[cont] = element.idDetallePedido;
          cont++
        });

        console.log('ids_detalle_pedido_caja____________________________-', ids_detalle_pedido);

        // EXTRAER EL NUMERO DE ORDEN DE LA CONSULTA

        for (let i = 0; i <= ids_detalle_pedido_caja.length - 1; i++) {
          id_Detalle_Pedidos[i] = ids_detalle_pedido_caja[i].idDetallePedido;
          let query_info_Emisor = 'CALL SP_Mis_facturaciones_asignadas (' + id_Detalle_Pedidos[i] + ');';
          let consulta_info_Emisor = await coneccion.query(query_info_Emisor);
          console.log('Salida del boocle es ', consulta_info_Emisor[0][0].nro_orden);
          nro_orden[i] = consulta_info_Emisor[0][0].nro_orden;
          vehiculo[i] = {
            placa: consulta_info_Emisor[0][0].placa,
            vehiculo_marca: consulta_info_Emisor[0][0].vehiculo_marca,
            modelo: consulta_info_Emisor[0][0].modelo
          }
        }

        console.log('Los numeros de orden para la noti es ', nro_orden);

        // RECORRER EL ARRAY "consulta_id_notificacion" para sacar

        for (let index = 0; index <= consulta_id_notificacion.length - 1; index++) {
          // Saber los datos del que me esat enviado esta notificacion con SP_Detalles_Notificacion("mi id","id_notificacion")
          let query_Detalle_Notificacion = 'CALL SP_Detalles_Notificacion(' + data_idUsuario_receptor + ',' + consulta_id_notificacion[index].id_notificaciones + ')'
          let consulta_Detalles_Notificacion = await coneccion.query(query_Detalle_Notificacion)
          console.log('Mi id: ', data_idUsuario_receptor, ' le esta enviando esta orden: ', consulta_id_notificacion[index].id_notificaciones);
          console.log('consulta_Detalles_Notificacion____________', consulta_Detalles_Notificacion[0][0].nombre)
          //Despues procedemos a almacenar los datos del emisor en estos arrays
          Emisor_nombre[index] = consulta_Detalles_Notificacion[0][0].nombre;
          Emisor_apellido_paterno[index] = consulta_Detalles_Notificacion[0][0].apellido_paterno;
          Emisor_fecha_creacion[index] = helpers.timeago_int(consulta_Detalles_Notificacion[0][0].fecha_creacion);
          ids_Notificaciones[index] = consulta_id_notificacion[index].id_notificaciones;
        }

        // salida de la iteracion
        console.log('Salida de Emisor Nombre', Emisor_nombre, 'Apellido_p: ', Emisor_apellido_paterno, ' Fecha de Creacion_noti: ', Emisor_fecha_creacion)
        // aca almacenamos en una variable
        const Lista_De_Notificaciones = [Emisor_nombre, Emisor_apellido_paterno, Emisor_fecha_creacion, ids_Notificaciones];
        console.log('Lista_De_Notificaciones', Lista_De_Notificaciones);
        sk_Navigation.emit('Envio_Notificacion', Lista_De_Notificaciones, nro_Notificaciones, nro_orden, id_tipo_usuario, ids_detalle_pedido, vehiculo)
      }

    } else {
      if (nro_Notificaciones != 0) {

        console.log('consulta_id_notificacion', consulta_id_notificacion[0].id_notificaciones)
        console.log('TAMAÑO', consulta_id_notificacion.length)

        //let Emisor_nombre=[],Emisor_apellido_paterno=[],Emisor_fecha_creacion=[];

        // Saber que nro de orden te ASIGNARON 

        //const query_nro_orden = `SELECT id_detallePedido,nro_orden FROM tdetallepedido where id_estadoOrden = 4 && id_usuario_asignado = '+data_idUsuario_receptor+';`;
        let id_etapa_pedido = 4;
        const query_nro_orden = `CALL SP_GET_Info_Notificacion(` + data_idUsuario_receptor + `,` + id_etapa_pedido + `);`;

        const consulta_nro_orden = await coneccion.query(query_nro_orden);
        //const {nro_orden,id_detallePedido} = consulta_nro_orden[0];
        const Nro_orden = consulta_nro_orden[0];

        console.log('Salida ==> ', consulta_nro_orden[0]);

        let n = 0;
        Nro_orden.forEach(element => {
          nro_orden[n] = element.nro_orden;
          id_Detalle_Pedidos[n] = element.id_detallePedido;
          vehiculo[n] = {
            placa: Nro_orden[n].placa,
            vehiculo_marca: Nro_orden[n].vehiculo_marca,
            modelo: Nro_orden[n].modelo
          }
          n++;
        });

        console.log('vehiculo', vehiculo);

        for (let index = 0; index <= consulta_id_notificacion.length - 1; index++) {
          let query_Detalle_Notificacion = 'CALL SP_Detalles_Notificacion(' + data_idUsuario_receptor + ',' + consulta_id_notificacion[index].id_notificaciones + ')'
          let consulta_Detalles_Notificacion = await coneccion.query(query_Detalle_Notificacion)
          console.log(consulta_Detalles_Notificacion[0][0]);
          Emisor_nombre[index] = consulta_Detalles_Notificacion[0][0].nombre;
          Emisor_apellido_paterno[index] = consulta_Detalles_Notificacion[0][0].apellido_paterno;
          Emisor_fecha_creacion[index] = helpers.timeago_int(consulta_Detalles_Notificacion[0][0].fecha_creacion);
          ids_Notificaciones[index] = consulta_id_notificacion[index].id_notificaciones;
          //nro_orden[i] = consulta_Detalles_Notificacion[0][0].nro_orden;
        }
        console.log('Salida de Emisor Nombre', Emisor_nombre, Emisor_apellido_paterno, Emisor_fecha_creacion)
        const Lista_De_Notificaciones = [Emisor_nombre, Emisor_apellido_paterno, Emisor_fecha_creacion, ids_Notificaciones];
        sk_Navigation.emit('Envio_Notificacion', Lista_De_Notificaciones, nro_Notificaciones, nro_orden, id_tipo_usuario, id_Detalle_Pedidos, vehiculo)
      }
    }
  });

  sk_Navigation.on('Registrar_Seguimiento', async (data) => {
    try {
      //helpers.Notificacion_dia_1();
      console.log('informacion entrante', data);
      let { id_detalle_pedido, id_cliente, id_vehiculo } = data;

      let fecha_salida = helpers.new_Date(new Date()),
        fecha_salida_str = helpers.formatDateTime(fecha_salida);

      //fecha_salida_str    = fecha_salida.toISOString().slice(0, 19).replace('T', ' ');

      let query_info_este_seguimiento = `CALL SP_Add_Seguimiento(
          `+ id_detalle_pedido + `,
          `+ id_cliente + `,
          `+ id_vehiculo + `,
          "`+ fecha_salida_str + `");`;

      const consulta_info_este_seguimiento = await Consulta(query_info_este_seguimiento);
      const info_este_seguimiento = consulta_info_este_seguimiento[0][0]
      console.log('Info de este_seguimiento_', consulta_info_este_seguimiento[0][0])

      //ARMANDO MI FECHA (Para compararla)
      let My_Fecha_Actual = helpers.new_Date(new Date()),
        Mi_anio = My_Fecha_Actual.getFullYear(),
        Mi_fecha = My_Fecha_Actual.getDate(),  //1 - 31
        Mi_mes = My_Fecha_Actual.getMonth() + 1, //0 - 11
        Mi_fecha_String = '' + Mi_fecha + '/' + Mi_mes + '/' + Mi_anio + '';

      // ARMAR EL OBJETO (Para crear la notificacion)
      let data_seguimiento = {
        id_etapa_seguimiento,
        nombre_cliente,
        fecha_salida,
        fecha_notificacion,
        fecha_seguimiento,
        id_detallePedido,
        nombre_etapa_seguimineto,
        id_seguimiento,
        id_cliente,
        id_vehiculo
      } = info_este_seguimiento;

      switch (data_seguimiento.id_etapa_seguimiento) {
        case 1:

          let fecha_cron_1 = data_seguimiento.fecha_salida;
          fecha_cron_1.setDate(fecha_cron_1.getDate() + 1);
          fecha_cron_1.setHours(9);
          fecha_cron_1.setMinutes(0);
          fecha_cron_1.setSeconds(0);

          let Mi_anio_cron_1 = fecha_cron_1.getFullYear();
          let Mi_fecha_cron_1 = fecha_cron_1.getDate();  //1 - 31
          let Mi_mes_cron_1 = fecha_cron_1.getMonth() + 1; //0 - 11

          let Mi_fecha_cron_1_String = '' + Mi_fecha_cron_1 + '/' + Mi_mes_cron_1 + '/' + Mi_anio_cron_1 + ''

          console.log('Nueva fecha Cron_1 es ==', helpers.formatDateTime(fecha_cron_1));

          if (Mi_fecha_String == Mi_fecha_cron_1_String) {

            new CronJob({
              cronTime: fecha_cron_1,
              onTick: CronFunction = () => {
                console.log('EJECUCION____Cron ID_', data_seguimiento.id_seguimiento);
                Ejecucion_de_Cron(data_seguimiento, nro_seguimientos);
              },
              start: true,
              timeZone: 'America/Lima'
            });
          } else {
            const mensage_salida = `* * * * * * * * * * * * * * * *\nNuevo Cron con id: ` + data_seguimiento.id_seguimiento + `\nDe estado: ` + data_seguimiento.nombre_etapa_seguimineto + `\nFue programado para esta fecha: ` + helpers.formatDate(fecha_cron_1) + `\n* * * * * * * * * * * * * * * *`;
            console.log(mensage_salida);

          }
          break;
      }
      async function Ejecucion() {
        let fecha_salida_timeago = helpers.timeago_int(fecha_salida);
        let consulta_cliente_pedido = await Consulta('CALL SP_cliente_de_Pedido_actual(' + id_detalle_pedido + ');')
        let fecha_Notificacion = helpers.new_Date(new Date()),
          //fecha_Notificacion_str  = fecha_Notificacion.toISOString().slice(0, 19).replace('T', ' ');
          fecha_Notificacion_str = helpers.formatDateTime(fecha_Notificacion);
        await Consulta('UPDATE tseguimiento SET fecha_notificacion = "' + fecha_Notificacion_str + '" where id_seguimiento = ' + id_seguimiento + ';');
        let { nombre_cliente } = consulta_cliente_pedido[0][0];

        const informacion_Seguimiento =
        {
          nombre_cliente,
          dia: 'dia 1',
          fecha_salida_timeago,
          id_detalle_pedido,
          id_seguimiento,
          id_cliente,
          id_vehiculo
        }
        console.log('enviar esta información', informacion_Seguimiento);
        io.emit('Enviar_Notificaciones_Seguimiento', informacion_Seguimiento);
      }

      /*           new CronJob({
                  cronTime  : fecha_salida,   // The time pattern when you want the job to start
                  onTick    : function Trabajo_1(){
                    console.log('_____________________________________________Hola humano',id_seguimiento);
                  },   // Task to run
                  start     : true,          // immediately starts the job.
                  timeZone  : 'America/Lima'   // The timezone
                }); */

      /*           const trabajo = new CronJob(fecha_salida,await function ejecutable(pfecha_programada) {
                  console.log('Esta fue la fecha programada',pfecha_programada);
                }, null, false, 'America/Lima');
    
                trabajo.ejecutable(fecha_programada);
                trabajo.start(); */

    } catch (err) {
      console.log('OCURRIÓ UN ERROR =>', err)
    }
  });

  sk_Navigation.on('Requiero_Notificaciones_Seguimiento', async () => {
    const query_notificaciones_seguimiento = 'SELECT * FROM v_ids_detalle_seguimiento WHERE fecha_notificacion is not null && id_estado_seguimiento <> 2;';
    const consulta_notificaciones_seguimiento = await Consulta(query_notificaciones_seguimiento);
    console.log('por recarga de seguimiento = ', consulta_notificaciones_seguimiento)

    let data_seguimiento = [], i = 0, nro_seguimientos = consulta_notificaciones_seguimiento.length;

    consulta_notificaciones_seguimiento.forEach(element => {
      data_seguimiento[i] = {
        id_seguimiento: element.id_seguimiento,
        id_detalle_pedido: element.id_detallePedido,
        nombre_cliente: element.nombre_cliente,
        fecha_notificacion: helpers.timeago_int(element.fecha_notificacion),
        dia: element.nombre_etapa_seguimineto,
        id_cliente: element.id_cliente,
        id_vehiculo: element.id_vehiculo,
      }
      i++
    });
    console.log('Salida del array data_seguimiento', data_seguimiento);
    sk_Navigation.emit('Emitir_Notificaciones_Seguimineto', data_seguimiento, nro_seguimientos);
  })
})

// INCERTAR UN NUEVO NOMBRE DE  CHECKLIST IMPORTANTE
/* io.on('connection',(sk_CrearChecklist)=>{
    sk_CrearChecklist.on('Crear_CheckList', async (Data) => {
      console.log(Data)
      await coneccion.query('CALL SP_Crear_Item_Checklist("'+Data.Nombre+'","'+Data.id+'");');
      let checklist_Agregado = await coneccion.query('CALL SP_Recuperar_CheckList_Agregado("'+Data.id+'")');
      const NewCheckList = checklist_Agregado[0][0]
      sk_CrearChecklist.emit('Checklist_agregado',NewCheckList);
    });
 }); */

io.on('connection', (sk_InfoCliente) => {
  sk_InfoCliente.on('Registrar_Ususario', async (Data) => {
    try {
      //const id_person = req.user;
      if (Data.val_arr[1] != 0) {
        const { nombre_cliente, telefono, email, dni, ruc, razon_social, direccion, val_arr, val_id_Vehiculo, id_persona } = Data;
        const tipo_cliente = val_arr[0];
        // incertar nuevo tipo cliente
        let str_fecha = helpers.formatDateTime(helpers.new_Date(new Date()))
        const query_1 = 'CALL SP_ADD_New_Client(' + val_id_Vehiculo + ',\
          '+ null + ',"' + tipo_cliente + '","' + nombre_cliente + '","' + telefono + '","' + email + '",' + dni + ',' + ruc + ',"' + razon_social + '","' + direccion + '",\
          '+ id_persona + ',' + 1 + ',"'+str_fecha+'")';
        await coneccion.query(query_1, (err, rows) => {
          if (!err && rows[0].length > 0) {
            console.log('rows', rows);
            sk_InfoCliente.emit('Nuevo_Cliente', rows[0]);
          } else {
            console.error(err.message);
          }
        });

        console.log('query_1', query_1);

      } else {
        const { nombre_cliente, telefono, email, dni, ruc, razon_social, direccion, val_arr, val_id_Vehiculo } = Data;
        const id_tipo_cliente = val_arr[0];
        // incertar nuevo tipo cliente
        let str_fecha = helpers.formatDateTime(helpers.new_Date(new Date()))
        const query_2 = 'CALL SP_ADD_New_Client(' + val_id_Vehiculo + ',\
          '+ id_tipo_cliente + ',"' + null + '","' + nombre_cliente + '","' + telefono + '","' + email + '",' + dni + ',' + ruc + ',"' + razon_social + '","' + direccion + '",\
          '+ null + ',' + 0 + ',"'+str_fecha+'")';
        await coneccion.query(query_2, (err, rows) => {
          if (!err && rows[0].length > 0) {
            console.log('rows', rows);
            sk_InfoCliente.emit('Nuevo_Cliente', rows[0]);
          } else {
            console.error(err.message);
          }
        });
        console.log('query_2', query_2);
      }
    } catch (error) {
      console.log(error)
    }
  });
});

/* io.on('connection', (sk_usuario) => {
  console.log("socket en usuario");
  sk_usuario.on('datos_a_enviar', () => {
    sk_usuario.emit('datos_a_enviar2', (datos));
    console.log("enviando sk_usuario", datos);
    datos = [];
  })
}); */

// ACTUALIZAR EL REQUERIMIENTO EN DETALLE PEDIDO  - DEMO -
io.on('connection', (sk_detallePedido) => {

  sk_detallePedido.on('Guardar_detalle_pedido', async (data) => {
    const id_detallepedido = data.id_Detalle_Pedido;
    const mis_requerimientos = data.mis_requerimientos;
    await coneccion.query('UPDATE tdetallepedido SET Detalle_requerimiento = "' + mis_requerimientos + '" WHERE (id_detallePedido = ' + id_detallepedido + ');');
    sk_detallePedido.emit('Actualizo_detalle_pedido');
  });

});

//1330