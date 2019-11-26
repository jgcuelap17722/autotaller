const pool = require('../database');
const helpers = require('../lib/helpers');
const ordenesCtr = {}

ordenesCtr.RecuperarOrden = async (req, res, next) => {
  res.send('REcuperando');
  next();
}

// abrir-orden post
ordenesCtr.crearOrden = async (req, res, next) => { //CREAR NUEVA ORDEN

  //RECUPERAR INFORMACION DEL USUARIO
    const InfoUser = await helpers.InfoUser(req.user.id_usuario);
    let id_usuario = InfoUser.id_usuario;

    let f_date  = req.app.locals.f_hoy.f_date,
        f_str   = req.app.locals.f_hoy.f_str;

  //RECUPERAR ID_VEHICULO Y EL ID_TIPO_CLIENTE
  let id_vehiculo     = parseInt(req.body.id_vehiculo, 10),
      id_cliente      = req.body.id_usuario,
      id_tipo_cliente = req.body.id_tipo_cliente;

  let Fn_RecuperarPlaca = await pool.query('CALL SP_FN_RecuperarPlaca(' + id_vehiculo + ')');
  let placa = Fn_RecuperarPlaca[0][0].placa;
  console.log('Fn_RecuperarPlaca', placa)

  console.log('id_usuario', id_usuario, 'id_vehiculo', id_vehiculo);
  const query_Existencia_de_Vehiculo_Orden = 'CALL SP_FN_Existe_Registro_Orden_Vehiculo('+id_vehiculo+','+id_usuario+');';
  const Existencia_de_Vehiculo_Orden = await pool.query(query_Existencia_de_Vehiculo_Orden);

  let { nro_ordenes_vehiculo } = Existencia_de_Vehiculo_Orden[0][0];
  console.log('nro_ordenes_vehiculo', Existencia_de_Vehiculo_Orden);
  if (nro_ordenes_vehiculo == 1) {
    req.flash('messages', 'Existe ya un pedido en proceso con esta placa')
    res.redirect('/info-cliente?id_vehiculo=' + id_vehiculo + '&placa=' + placa + '');
    next();
  } else {
    // === RECUPERAR SERVICIOS BUSCADOS O AGREGADOS :)
    const SP_Services = await pool.query('CALL SP_GET_Servicios_noTop()');
    const Get_Services = SP_Services[0];

    let idServices = [],nameServices = [];
    let index = 0
    Get_Services.forEach(element => {
      idServices[index]   = element.id_servicio
      nameServices[index] = element.nombre_servicio
      index++;
    });

    let allServices = { id: idServices, nombre_servicio: nameServices }

    // === RECUPERAR LOS SERVICIOS MAS RANKEADOS :)

    const Get_Servicio = await pool.query("SELECT id_servicio,nombre_servicio FROM v_primeros_servicios;");
    const Primeros_Servicios = Get_Servicio;
    console.log("Primeros_Servicios", Primeros_Servicios);

    let id = [], Nombre = [], i = 0;

    Primeros_Servicios.forEach(element => {
      id[i] = element.id_servicio
      Nombre[i] = element.nombre_servicio
      i++;
    });

    let Servicio = { id_servicio: id, nombre_servicio: Nombre }

    console.log('Servicio', Servicio)

    console.log("'" + id_vehiculo + "','" + id_cliente + "','" + id_usuario + "'")

    // ==> Generar un Numero de orden
    // e INCERTAR en tdetale_pedido y tordenes actuales

    const query = 'CALL SP_FN_generarNroOrden(' + id_vehiculo + ',' + id_cliente + ',' + id_usuario + ')';
    const callNroOrden = await pool.query(query);
    console.log('callNroOrden', callNroOrden)
    const { numero_Orden } = callNroOrden[0][0]

    console.log('NRO ORDEN GENERADA', numero_Orden)
    // ==> Incertar en ordenes Actuales y
    // en deTalle pedido SIN datos del asignado y sin datos de detalle
    console.log('numero_Orden,id_usuario,id_cliente,id_vehiculo', numero_Orden, id_usuario, id_cliente, id_vehiculo);
    let query_insert_Dpedido = 'CALL SP_add_OrdenActual_DetallePedido(' + numero_Orden + ',' + id_vehiculo + ',' + id_cliente + ',' + id_tipo_cliente + ',' + id_usuario + ',"'+f_str+'")';
    await pool.query(query_insert_Dpedido);

    const NroOrden = numero_Orden.toString().padStart(6, '0'); // Concatenamos el numero de ortden para mostrar
    console.log('NroOrden', NroOrden)

    // ==> Mostrar los Usuarios Mecanico
    const consulta_Mecanicos_Habilitados = 'SELECT id_usuario,nombre,apellido_paterno,nro_ordenes FROM v_mecanicos_hablilitados;';
    let Mecanicos_Habilitados = await pool.query(consulta_Mecanicos_Habilitados);

    console.log('Mecanicos_Habilitados', Mecanicos_Habilitados); 

    // ==> Enviar Toda la informacion al frontend
    const data = { InfoUser, numero_Orden, NroOrden, placa, Servicio, allServices, Mecanicos_Habilitados, id_tipo_cliente}

    res.render('../views/crearOrden', { data: data })
  }
}

ordenesCtr.asinarOrden = async (req, res, next) => {

  //RECUPERAR INFORMACION DEL USUARIO
  const InfoUser = await helpers.InfoUser(req.user.id_usuario);
  let id_usuario = InfoUser.id_usuario;
  const usuario = {id_usuario};
  console.log('Los datos Recepcionados', Object.values(req.body));
  const Infopedido        = Object.values(req.body),
        nro_orden         = Infopedido.shift(),   // extraer el nro_orden primero de un array
        km_inicial        = Infopedido.shift(),   // extraer el km_inicial luego del nro_orden
        id_user_asignado  = Infopedido.pop(),     // extraer el ultimo    
        MiObservacion     = Infopedido.pop();     // extraer el ultimo x2

  console.log('Infopedido', Infopedido);

  console.log('nro_orden', nro_orden, 'MiObservacion', MiObservacion)
  let Observacion_Cliente = [], ID_Servicio = [];

  for (let i = 0; i <= Infopedido.length - 1; i++) {
    if (i % 2 == 0) {
      ID_Servicio[ID_Servicio.length] = Infopedido[i];
    } else {
      Observacion_Cliente[Observacion_Cliente.length] = Infopedido[i];
    }
  }
  console.log('ID_Servicio,Observacion_Cliente = ', ID_Servicio, Observacion_Cliente)

  // === RECUPERAR PLACA ATRAVEZ DE SU NUMERO DE ORDEN :)
  const placa_recuperada = await pool.query("CALL SP_FN_GET_placa_orden('" + nro_orden + "')");
  const { placa } = placa_recuperada[0][0];
  console.log('placa_recuperada = ', placa)

  // === CONSULTAR SI EXISTE EL DETALLE PEDIDO PARA ESE CHECKLIST :) para que no se repita el pedido al recargar la pagina
  const Consulta_id_DetallePedido = await pool.query("select id_detallePedido as id_DetallePedido from tdetallepedido where nro_orden = '" + nro_orden + "'");
  const { id_DetallePedido }      = Consulta_id_DetallePedido[0];
  
  const Get_Existencia_pedido     = await pool.query("CALL SP_FN_GET_pedido_Existente('" + id_DetallePedido + "')")
  const { existencia }            = Get_Existencia_pedido[0][0];

  if (existencia != 0) { // Si existe algun dato
    await pool.query('DELETE FROM tpedido WHERE id_detallePedido = ' + id_DetallePedido + '');
    for (let richar = 0; richar <= ID_Servicio.length - 1; richar++) {
      await pool.query('CALL SP_NuevoPedido(' + ID_Servicio[richar] + ',' + id_DetallePedido + ',"' + Observacion_Cliente[richar] + '")');
    }
    await pool.query('UPDATE tdetallepedido SET id_usuario_asignado = ' + id_user_asignado + ',Detalle_usuario = "' + MiObservacion + '",km_inicial = "' + km_inicial + '" WHERE id_detallePedido = ' + id_DetallePedido + '')
  } else { // no existe algun   
    for (let richar = 0; richar <= ID_Servicio.length - 1; richar++) {
      await pool.query('CALL SP_NuevoPedido(' + ID_Servicio[richar] + ',' + id_DetallePedido + ',"' + Observacion_Cliente[richar] + '")');
    }
    await pool.query('UPDATE tdetallepedido SET id_usuario_asignado = ' + id_user_asignado + ',Detalle_usuario = "' + MiObservacion + '",km_inicial = "' + km_inicial + '" WHERE id_detallePedido = ' + id_DetallePedido + '')
  }
  console.log('Consulta_id_DetallePedido', id_DetallePedido)

  const Sp_Pedido_Cliente = await pool.query("Call SP_cliente_de_Pedido_actual('" + id_DetallePedido + "')");
  const pedido_cliente = { nombre, telefono, vehiculo_marca, modelo, color } = Sp_Pedido_Cliente[0][0];
  console.log('pedido_cliente', pedido_cliente);

  //const data = {placa,nro_orden,usuario,pedido_cliente,Checklist,Checklist_Aux}
  const data = { placa,km_inicial,nro_orden, usuario, pedido_cliente }
  console.log('Todos los datos :', data)
  req.flash('messages', 'La orden se ha asignado Correctamente !')
  res.redirect('/profile');

}

module.exports = ordenesCtr;