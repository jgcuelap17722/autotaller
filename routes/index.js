var express = require('express');
var helpers = require('../lib/helpers');
const { isNotLoggedIn } = require('../lib/auth');
const pdf = require('html-pdf')
var path = require('path');
const moment = require('moment-timezone');
var router = express.Router();

const pool = require('../database'); //referencia a ala base de datos
const { isLoggedIn } = require('../lib/auth'); //SIRBE PARA PROTEGER rutas

//const {crearCheckList} = require('../controllers/controlador.checklist');
const {asinarOrden} = require('../controllers/controlador.ordenes');
const {HacerConsulta} = require('../controllers/controlador.consultas');
const {Recuperar_info_Cliente} = require('../controllers/controlador.info-cliente');

// Funcion parahacer consultass
Consulta = (pQuery) => {return pool.query(pQuery)};

router.post('/info-cliente',async (req, res, next) =>{
  let InfoUser      = await helpers.InfoUser(req.user.id_usuario);      // Info Usuario Logueado
  let data = req.body;
  let {placa,id_cliente} = data;
  console.log('la data',data)
  let id_person = InfoUser.id_usuario;
  //let {id_cliente} = data // aca recibe un id_cliente o vacio si no hace una busqueda
  console.log('busqueda id es = ',id_cliente);
  let id_vehiculo;
  //VARIABLE QUE ALMACENA EL CASO QUE ESTA ENVIANDO LA VISTA ADD_CLIETE
  let estado_Caso = data.case,
    estado_tipo_cliente = data.tipo_cliente.split(',');

  let pFechaHoy = helpers.new_Date(new Date())
      pFechaHoy = helpers.formatDateTime(pFechaHoy);

  // CONVERTIMOS EL TIPO DE CASO A NUMERO
    const tipo_Caso = parseInt(estado_Caso,10) // vehiculo
    // tipo entrada puede ser NaN/1/2/3
    // 0 = si marca si modelo si generacion
    // 1 = no marca no modelo no generacion
    // 2 = si marca no modelo no generacion
    // 3 = si marca si modelo no generacion
    console.log('Salida Tipo Caso es =>',tipo_Caso)
    console.log('Salida estado_tipo_cliente es =>',estado_tipo_cliente)

    // SABER SI YA EXISTE EL REGISTRO DE ESTE VEHICULO ( "prevenimos qeu actualizela pagina e incerte duplicado" )
    // 0 ==> no existe 1 ==> si existe
    const Consulta_Existencia = await Consulta('CALL SP_FN_Existe_Registro_Vehiculo("'+placa+'");')
    const Existe = parseInt(Consulta_Existencia[0][0].Existencia,10)
    console.log('Salida de Consulta_Existencia es =>',Consulta_Existencia);

    if(Existe != 1){
      switch (tipo_Caso) {
        case 0: // A entra NaN osea no activo el Switch / 0
            console.log('si marca si modelo si generacion',tipo_Caso)
            if(id_cliente != ''){ // recibimos ID_CLIENTE BUSQUEDA
              console.log('Usando id_tipo_cliente:',estado_tipo_cliente[0])
              const {placa,idMarca,idModelo,idGeneracion,color,id_cliente} = data

              if(estado_tipo_cliente[1] != 0){

                const tipo_cliente = estado_tipo_cliente[0];
                let query0_0 = 'CALL SP_ADD_Caso_0("'+placa+'",'+idMarca+','+idModelo+','+idGeneracion+',"'+color+'",'+id_cliente+',\
                '+null+',"'+tipo_cliente+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",'+id_person+','+0+','+1+',"'+pFechaHoy+'")'
                id_vehiculo = await Consulta(query0_0);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }else{

                const id_tipo_cliente = estado_tipo_cliente[0];
                let query0_1 = 'CALL SP_ADD_Caso_0("'+placa+'",'+idMarca+','+idModelo+','+idGeneracion+',"'+color+'",'+id_cliente+',\
                '+id_tipo_cliente+',"'+null+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",'+null+','+0+','+0+',"'+pFechaHoy+'")'
                id_vehiculo = await Consulta(query0_1);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }
              console.log('Datos a enviar',placa,idMarca,idModelo,idGeneracion,color,id_cliente,tipo_Caso);
              //  INSERT placa,idMarca,idModelo,idGeneracion,color a (tvehiculo)
              //  SELECT el "id_vehiculo" ultimo agregado
              //  INSERT "id_vehiculo" y "id_cliente" en la tabla (tvehiculo_tcliente)

              // aca usamos el id_tipo_cliente para INSERT auto nuevo
            }else if(estado_tipo_cliente[1] != 0){ // tipo_cliente 1 // recibimos '' vacio 1/1  escribio nuevo_tipo_cliente
                
                console.log('Registrar Nuevo tipo_cliente:',estado_tipo_cliente[0])

                const {placa,idMarca,idModelo,idGeneracion,color} = data;
                const tipo_cliente = estado_tipo_cliente[0];
                const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;

                let newRuc  = parseInt(ruc, 10),
                    esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
                esNaN ? newRuc = 0:newRuc = newRuc;

                let query1 = 'CALL SP_ADD_Caso_0("'+placa+'",'+idMarca+','+idModelo+','+idGeneracion+',"'+color+'",'+null+',\
                '+null+',"'+tipo_cliente+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",'+id_person+','+1+','+null+',"'+pFechaHoy+'")';
                
                console.log('DATOS ENVIADOS :',query1);
                id_vehiculo = await Consulta(query1);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
                //  INSERT placa,idMarca,idModelo,idGeneracion,color a (tvehiculo)
                //  SELECT el "id_vehiculo" ultimo agregado

                //  INSERT "tipo_cliente" a la tabla (ttipo_cliente)
                //  SELECT el "tipo_cliente" ultimo agregado

                //  INSERT IDtipo_cliente,nombre,telefono,email,dni,ruc,direccion (tcliente)
                //  SELECT el "id_cliente" ingresado de ese "dni"
                //  INSERT "id_vehiculo" y "id_cliente" en la tabla (tvehiculo_tcliente)

                // aca incertamos el nuevo tipo cliente
              }else{ // tipo_cliente 0 Si existe tipo cliente
                console.log('Usar el id tipo_persona',estado_tipo_cliente[0])

                const {placa,idMarca,idModelo,idGeneracion,color} = data;
                const id_tipo_cliente = estado_tipo_cliente[0];
                const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;
                
                let newRuc  = parseInt(ruc, 10),
                    esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
                esNaN ? newRuc = 0:newRuc = newRuc;

                console.log('Slida de ruc',newRuc);
                let query2 = 'CALL SP_ADD_Caso_0("'+placa+'",'+idMarca+','+idModelo+','+idGeneracion+',"'+color+'",'+null+',\
                '+id_tipo_cliente+',"'+null+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",'+null+','+2+','+null+',"'+pFechaHoy+'")';
                
                console.log('DATOS ENVIADOS :',query2);
                //await Consulta(query2);

                //  INSERT idMarca,idModelo,idGeneracion,color a (tvehiculo)
                //  SELECT el "id_vehiculo" ultimo agregado

                //  INSERT IDtipo_cliente,nombre,telefono,email,dni,ruc,direccion (tcliente)
                //  SELECT el "id_cliente" ingresado de ese "dni"
                //  INSERT "id_vehiculo" y "id_cliente" en la tabla (tvehiculo_tcliente)

                // aca no incertamos tipo cleinte solo usamos el que selecciono
                
                id_vehiculo = await Consulta(query2);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;

              }
            break;
        case 1:
            console.log('no marca no modelo no generacion',tipo_Caso)
            if(id_cliente != ''){ // recibimos ID_CLIENTE  0
              console.log('Usando id_tipo_cliente:',estado_tipo_cliente[0])
              console.log(data);
              const {placa,Marca,modelo,anio,color,id_cliente} = data

              if(estado_tipo_cliente[1] != 0){
                const tipo_cliente = estado_tipo_cliente[0];
                let query3_0 = 'CALL SP_ADD_Caso_1("'+placa+'","'+Marca+'","'+modelo+'","'+anio+'","'+color+'",'+id_cliente+',\
                '+null+',"'+tipo_cliente+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",\
                '+id_person+','+0+','+1+',"'+pFechaHoy+'")'
                
                console.log('DATOS ENVIADOS :',query3_0)
                id_vehiculo = await Consulta(query3_0);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }else{
                const id_tipo_cliente = estado_tipo_cliente[0];
                let query3_1 = 'CALL SP_ADD_Caso_1("'+placa+'","'+Marca+'","'+modelo+'","'+anio+'","'+color+'",'+id_cliente+',\
                '+id_tipo_cliente+',"'+null+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",\
                '+id_person+','+0+','+0+',"'+pFechaHoy+'")'
                
                console.log('DATOS ENVIADOS :',query3_1)
                id_vehiculo = await Consulta(query3_1);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }

              // aca usamos el id_tipo_cliente
            }else if(estado_tipo_cliente[1] != 0){ // tipo_cliente 1 // recibimos '' vacio 1/1 1
                console.log('Registrar Nuevo tipo_cliente:',estado_tipo_cliente[0])

                const {placa,Marca,modelo,anio,color} = data
                const tipo_cliente = estado_tipo_cliente[0];
                const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;

                let newRuc  = parseInt(ruc, 10),
                    esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
                esNaN ? newRuc = 0:newRuc = newRuc;

                let query4 = 'CALL SP_ADD_Caso_1 ("'+placa+'","'+Marca+'","'+modelo+'","'+anio+'","'+color+'",'+null+',\
                '+null+',"'+tipo_cliente+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",\
                '+id_person+','+1+','+null+',"'+pFechaHoy+'")'; 

                console.log('DATOS ENVIADOS :',query4)
                id_vehiculo = await Consulta(query4);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
                // aca incertamos el nuevo tipo cliente
              }else{ // tipo_cliente 0 2
                // INGRESAR TIPO DE PERSONA EXISTENTE Y NUEVO TODO LO DEMAS;
                const {placa,Marca,modelo,anio,color} = data
                const id_tipo_cliente = estado_tipo_cliente[0];
                const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;

                let newRuc  = parseInt(ruc, 10),
                    esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
                esNaN ? newRuc = 0:newRuc = newRuc;

                let query5 = 'CALL SP_ADD_Caso_1 ("'+placa+'","'+Marca+'","'+modelo+'","'+anio+'","'+color+'",'+null+',\
                '+id_tipo_cliente+',"'+null+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",\
                '+id_person+','+2+','+null+',"'+pFechaHoy+'")';
                
                console.log('DATOS ENVIADOS :',query5)
                id_vehiculo = await Consulta(query5);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }
          break;
        case 2:
            console.log('si marca no modelo no generacion',tipo_Caso)
            if(id_cliente != ''){ // recibimos ID_CLIENTE 
              console.log('Usando id_tipo_cliente:',estado_tipo_cliente[0])

              const {placa,idMarca,modelo,anio,color,id_cliente} = data

              if(estado_tipo_cliente[1] != 0){
                const tipo_cliente = estado_tipo_cliente[0];
                let query6_0 = 'CALL SP_ADD_Caso_2("'+placa+'",'+idMarca+',"'+modelo+'","'+anio+'","'+color+'",'+id_cliente+',\
                '+null+',"'+tipo_cliente+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",\
                '+id_person+','+0+','+1+',"'+pFechaHoy+'")'
                
                console.log('DATOS ENVIADOS :',query6_0)
                id_vehiculo = await Consulta(query6_0);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }else{
                const id_tipo_cliente = estado_tipo_cliente[0];
                let query6_1 = 'CALL SP_ADD_Caso_2("'+placa+'",'+idMarca+',"'+modelo+'","'+anio+'","'+color+'",'+id_cliente+',\
                '+id_tipo_cliente+',"'+null+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",\
                '+id_person+','+0+','+0+',"'+pFechaHoy+'")'
                
                console.log('DATOS ENVIADOS :',query6_1)
                id_vehiculo = await Consulta(query6_1);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }

              // aca usamos el id_tipo_cliente
            }else if(estado_tipo_cliente[1] != 0){ // tipo_cliente 1 // recibimos '' vacio 1/1
                console.log('Registrar Nuevo tipo_cliente:',estado_tipo_cliente[0])
                // aca incertamos el nuevo tipo cliente

                const {placa,idMarca,modelo,anio,color} = data
                const tipo_cliente = estado_tipo_cliente[0];
                const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;

                let newRuc  = parseInt(ruc, 10),
                    esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
                esNaN ? newRuc = 0:newRuc = newRuc;

                let query7 = 'CALL SP_ADD_Caso_2 ("'+placa+'",'+idMarca+',"'+modelo+'","'+anio+'","'+color+'",'+null+',\
                '+null+',"'+tipo_cliente+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",\
                '+id_person+','+1+','+null+',"'+pFechaHoy+'")'; 

                console.log('DATOS ENVIADOS :',query7)
                id_vehiculo = await Consulta(query7);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
                // aca incertamos el nuevo tipo cliente

              }else{ // tipo_cliente 0
                // aca no incertamos tipo cleinte
                // INGRESAR TIPO DE PERSONA EXISTENTE Y NUEVO TODO LO DEMAS;
                const {placa,idMarca,modelo,anio,color} = data
                const id_tipo_cliente = estado_tipo_cliente[0];
                const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;

                let newRuc  = parseInt(ruc, 10),
                    esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
                esNaN ? newRuc = 0:newRuc = newRuc;

                let query8 = 'CALL SP_ADD_Caso_2 ("'+placa+'",'+idMarca+',"'+modelo+'","'+anio+'","'+color+'",'+null+',\
                '+id_tipo_cliente+',"'+null+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",\
                '+id_person+','+2+','+null+',"'+pFechaHoy+'")';
                
                console.log('DATOS ENVIADOS :',query8)
                id_vehiculo = await Consulta(query8);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }
            break;
        case 3:
            console.log('si marca si modelo no generacion',tipo_Caso)
            if(id_cliente != ''){ // recibimos ID_CLIENTE 
              console.log('Usando id_tipo_cliente:',estado_tipo_cliente[0])
              const {placa,idMarca,idModelo,anio,color,id_cliente} = data
              if(estado_tipo_cliente[1] != 0){
                const tipo_cliente = estado_tipo_cliente[0];
                let query9_0 = 'CALL SP_ADD_Caso_3("'+placa+'",'+idMarca+',"'+idModelo+'","'+anio+'","'+color+'",'+id_cliente+',\
                '+null+',"'+tipo_cliente+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",\
                '+id_person+','+0+','+1+',"'+pFechaHoy+'")'
                
                console.log('DATOS ENVIADOS :',query9_0)
                id_vehiculo = await Consulta(query9_0);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }else{
                const id_tipo_cliente = estado_tipo_cliente[0];
                let query9_1 = 'CALL SP_ADD_Caso_3("'+placa+'",'+idMarca+',"'+idModelo+'","'+anio+'","'+color+'",'+id_cliente+',\
                '+id_tipo_cliente+',"'+null+'","'+null+'","'+null+'","'+null+'",'+null+','+null+',"'+null+'","'+null+'",\
                '+id_person+','+0+','+0+',"'+pFechaHoy+'")'
                
                console.log('DATOS ENVIADOS :',query9_1)
                id_vehiculo = await Consulta(query9_1);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }
              // aca usamos el id_tipo_cliente
            }else if(estado_tipo_cliente[1] != 0){ // tipo_cliente 1 // recibimos '' vacio 1/1
              console.log('Registrar Nuevo tipo_cliente:',estado_tipo_cliente[0])
              // aca incertamos el nuevo tipo cliente

              const {placa,idMarca,idModelo,anio,color} = data
              const tipo_cliente = estado_tipo_cliente[0];
              const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;

              let newRuc  = parseInt(ruc, 10),
              esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
              esNaN ? newRuc = 0:newRuc = newRuc;

              let query10 = 'CALL SP_ADD_Caso_3 ("'+placa+'",'+idMarca+','+idModelo+',"'+anio+'","'+color+'",'+null+',\
              '+null+',"'+tipo_cliente+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",\
              '+id_person+','+1+','+null+',"'+pFechaHoy+'")'; 

              console.log('DATOS ENVIADOS :',query10)
              id_vehiculo = await Consulta(query10);
              id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              // aca incertamos el nuevo tipo cliente

              }else{ // tipo_cliente 0
                // aca no incertamos tipo cleinte
                // INGRESAR TIPO DE PERSONA EXISTENTE Y NUEVO TODO LO DEMAS;
                const {placa,idMarca,idModelo,anio,color} = data
                const id_tipo_cliente = estado_tipo_cliente[0];
                const {nombre_cliente,telefono,email,dni,ruc,razon_social,direccion} = data;

                let newRuc  = parseInt(ruc, 10),
                esNaN   = isNaN(newRuc); // false = si hay ruc (true) = no hay ruc = 0
                esNaN ? newRuc = 0:newRuc = newRuc;

                let query11 = 'CALL SP_ADD_Caso_3 ("'+placa+'",'+idMarca+','+idModelo+',"'+anio+'","'+color+'",'+null+',\
                '+id_tipo_cliente+',"'+null+'","'+nombre_cliente+'","'+telefono+'","'+email+'",'+dni+','+newRuc+',"'+razon_social+'","'+direccion+'",\
                '+id_person+','+2+','+null+',"'+pFechaHoy+'")';
                
                console.log('DATOS ENVIADOS :',query11)
                id_vehiculo = await Consulta(query11);
                id_vehiculo = id_vehiculo[0][0].id_vehiculo;
              }
          break;
      }

/*       // Consulta para los Tipo de Cliente
      const Consulta_tipo_cliente = await Consulta('SELECT id_tipo_cliente,tipo_cliente FROM ttipo_cliente') 
      const TipoCliente = {id_tipo_cliente,tipo_cliente} = Consulta_tipo_cliente;

      const idTipo_cliente=[];
      const Tipo_cliente=[];
      let n = 0 
      TipoCliente.forEach(element => {
        idTipo_cliente[n] = element.id_tipo_cliente
        Tipo_cliente[n] = element.tipo_cliente
        n++;
      });
      const Tipos_Cliente = {idTipo_cliente,Tipo_cliente}
      console.log('idTipo_cliente,Tipo_cliente',Tipos_Cliente)

      // RECUPERAR LA NUEVA INFORMACION DEL CLIENTE - VEHICULO
      //Para despues mostrar en la vista formInfoCliente
      await Consulta("CALL SP_recuperar_Cliente_Placa('"+placa+"')",(err,rows)=>{
        try {
          let SP_recuperar_Cliente = rows[0]
          if(SP_recuperar_Cliente.length == 0 || err){
            console.log('hubo un error')
            res.send('No se encontro esa placa o Hubo un ERROR => '+err+' LUUUL');
            next();
          }else{
            console.log('Exito')
            
            //Almacenamos la cantidad de dueños de dicha placa
              const nResultados = SP_recuperar_Cliente.length;

            //Almacenamos los datos de los dueños de dicha placa
              const ClientCarr = SP_recuperar_Cliente;
        
            //Almacenamos en un solo arreglo los datos antes dichos
              const data_Cliente = {InfoUser,ClientCarr,nResultados,Tipos_Cliente}
        
              console.log('(Resumen) El cliente Es nuevo L a info es',data_Cliente);
        
            //Renderizamos enviando los datos almacenados en "dataCliente"
              //res.render("formInfoCliente",{data:data_Cliente});
              res.redirect('info-cliente?id_vehiculo=260&placa=prueba3');
          }
        } catch (error) {
            res.send('Ocurrio un error en la Consulta o otra cosa XD => '+err)
            next();
        }
        
      }); */
      console.log('Consulta 1 hecha id vehiculo es',id_vehiculo);
      res.redirect('info-cliente?id_vehiculo='+id_vehiculo+'&placa='+placa+'');
    }else{
/*       let data = req.body;
      let {placa} = data;
      console.log('placa',placa)
      const id_person = req.user.id_persona;
      // Consulta para los Tipo de Cliente
      const Consulta_tipo_cliente = await Consulta('SELECT id_tipo_cliente,tipo_cliente FROM ttipo_cliente') 
      const TipoCliente = {id_tipo_cliente,tipo_cliente} = Consulta_tipo_cliente;

      const idTipo_cliente=[];
      const Tipo_cliente=[];
      let n = 0 
      TipoCliente.forEach(element => {
        idTipo_cliente[n] = element.id_tipo_cliente
        Tipo_cliente[n] = element.tipo_cliente
        n++;
      });
      const Tipos_Cliente = {idTipo_cliente,Tipo_cliente}
      console.log('idTipo_cliente,Tipo_cliente',Tipos_Cliente)
      
      await Consulta("CALL SP_recuperar_Cliente_Placa('"+placa+"')",(err,rows) => {
        try {
          let SP_recuperar_Cliente = rows[0]
          if(SP_recuperar_Cliente.length == 0 || err){
            console.log('hubo un error')
            res.send('No se encontro esa placa o Hubo un ERROR => '+err+'');
            next();
          }else{
            console.log('Exito')
            
            //Almacenamos la cantidad de dueños de dicha placa
              const nResultados = SP_recuperar_Cliente.length;

            //Almacenamos los datos de los dueños de dicha placa
              const ClientCarr = SP_recuperar_Cliente;
        
            //Almacenamos en un solo arreglo los datos antes dichos
              const data_Cliente = {InfoUser,ClientCarr,nResultados,Tipos_Cliente,id_person}
        
              console.log('Informacion del Cliente Nuevo:',data_Cliente.ClientCarr[0].placa);
        
            //Renderizamos enviando los datos almacenados en "dataCliente"
              //res.render("formInfoCliente",{data:data_Cliente});
              
          }
        } catch (error) {
            res.send('Ocurrio un error en la Consulta o otra cosa => '+error)
            next();
        }
      }); */
      console.log('Consulta 2 hecha id vehiculo es',id_vehiculo);
      res.redirect('info-cliente?id_vehiculo='+id_vehiculo+'&placa='+placa+'');
    }
});

router.route('/info-cliente')
  .get(isLoggedIn,Recuperar_info_Cliente);

router.get('/listar',isLoggedIn,async (req, res, next)=> {
  const InfoUser      = await helpers.InfoUser(req.user.id_usuario);
  const SP_misOrdenes = await Consulta('SELECT * FROM tdetallepedido WHERE id_usuario_asignado = "'+InfoUser.id_usuario+'"');
  const misOrdenes = SP_misOrdenes;
  var index = 0;
  misOrdenes.forEach(element => {
    misOrdenes[index].fecha = helpers.timeago_int(misOrdenes[index].fecha);
/*     console.log(element.created_at,m); */
    index++;
  });
  console.log(req.flash('success','Se agrego correctamente'),"get")
  res.render("formListarOrdenes",{datos:misOrdenes});
});

router.post('/listar',isLoggedIn, async (req, res, next) => {
  console.log(req.body);
  const {title,url,description} = req.body;
  const nueva_orden = {
    title,
    url,
    description,
    user_id: req.user.id
  };
  await Consulta('INSERT INTO torden set ?', [nueva_orden]);
/*     console.log("tamaño es",misOrdenes.length,"y",misOrdenes[0]); */
  console.log(req.flash('success',''),"post")
/*   res.render("formListarOrdenes"); */
  req.flash('success','Orden Agregada correctamente')
  res.redirect('/listar');
 });
 

router.post('/nuevo-cliente',async (req, res, next) => {
  const {nueva_placa} = req.body
  const InfoUser      = await helpers.InfoUser(req.user.id_usuario);      // Info Usuario Logueado
  const consulta_Placa_Existente = await Consulta('CALL SP_FN_Existencia_Placa("'+nueva_placa+'");');
  const {existencia_placa} = consulta_Placa_Existente[0][0];
  console.log('Placabuscada',nueva_placa);
  console.log('RESPUESTA',existencia_placa);
  if (existencia_placa != 0) {
    req.flash('messages','Esa placa ya existe')
    res.redirect('/consultar');
  }else{
    const consulta_cliente_dni = await Consulta('select nombre_cliente,dni,id_cliente from tcliente');
    const data = {nombre_cliente,dni,id_cliente} = consulta_cliente_dni;

    let nombre_dni=[];

    let pId_cliente =[];
    let pnombre_cliente =[];
    
    let cont = 0 
    data.forEach(element => {
      pnombre_cliente[cont] = element.nombre_cliente;
      pId_cliente[cont] = element.id_cliente
      nombre_dni[cont,cont] = [element.dni+' - '+element.nombre_cliente,element.nombre_cliente]
      cont++;
    });

    const Sp_get_marcas = await Consulta('CALL SP_get_marca_auto()');
    const consulta = Sp_get_marcas[0];

    const id=[];
    const marca=[];
    let i = 0 
    consulta.forEach(element => {
      id[i]    = element.id_marca_auto
      marca[i] = element.marca
      i++;
    });

    // Consulta para los Tipo de Cliente
    const Consulta_tipo_cliente = await Consulta('SELECT id_tipo_cliente,tipo_cliente FROM ttipo_cliente') 
    const TipoCliente = {id_tipo_cliente,tipo_cliente} = Consulta_tipo_cliente;

    const idTipo_cliente=[];
    const Tipo_cliente=[];
    let n = 0 
    TipoCliente.forEach(element => {
      idTipo_cliente[n] = element.id_tipo_cliente
      Tipo_cliente[n] = element.tipo_cliente
      n++;
    });
    const Tipos_Cliente = {idTipo_cliente,Tipo_cliente}
    console.log('idTipo_cliente,Tipo_cliente',Tipos_Cliente)

    const {nueva_placa} = req.body;
    const id_marca = {InfoUser,id,marca,nueva_placa,nombre_dni,pId_cliente,pnombre_cliente,Tipos_Cliente}
    //console.log(id_marca)
    
    res.render('formAddCliente', {data:id_marca});
  }
  
});

router.post('/cliente', (req, res, next) => {
  console.log(req.body);
});

router.get('/',isNotLoggedIn, (req, res, next)=>{
  try {
    console.log('typeof req.user',typeof req.user)
    if(typeof req.user != 'undefined'){
      res.redirect('/profile',{data:tiempo_es});
    }else{
      res.render('auth/signin');
    }
  } catch (error) {
    res.render('auth/signin');
    console.log(error)
  }
});

router.post('/', async (req, res, next)=>{
  const person_username = req.user.username;
  const {password_old,password_new,password_confirm} = req.body
  console.log('Datass',password_old,password_new,password_confirm)
  const Password = await Consulta('SELECT password FROM tusuario WHERE username = "'+person_username+'";');
  let Existencia_Password = await helpers.matchPassword(password_old,Password[0].password);

  if(Existencia_Password){
    if(password_new == password_confirm){
      let encript_password_new = await helpers.encryptPassword(password_confirm);

      await Consulta('UPDATE tusuario SET password ="'+encript_password_new+'" WHERE username = "'+person_username+'"');

      // Enviar a email Su nueva contraseña
        const Email_Usuario = await Consulta('SELECT email FROM v_tusuario_tpersona WHERE username = "'+person_username+'";');
        console.log('EMAIL,',Email_Usuario)
        const cuerpoMensage = '<ul>\
          <li><b>Usuario:</b>'+person_username+'</li>\
          <li><b>Nueva contraseña:</b>'+password_confirm+'</li>\
          </ul>'
        helpers.EnviarMensage(Email_Usuario[0].email,'Actualizacion de contraseña',cuerpoMensage);
      
      req.flash('confirmation','La contraseña se actualizo correctamente')
      res.redirect('/');

    }else{
      req.flash('confirmation','Las contraseña no coinciden')
      res.redirect('/edit-password');
    }
  }else{
    req.flash('confirmation','La contraseña antigua no existe')
    res.redirect('/edit-password');
  }
});

router.get('/nueva-orden',isLoggedIn, (req, res, next)=>{
  //res.rendesr("loggin");
  res.render("nuevo");
});

router.get('/listar/delete/:id',async (req,res,next) => {
  const { id } = req.params;
  await Consulta('delete from torden where id= ?',[id]);
  req.flash('success','Orden finalizada correctamente');
  res.redirect('/listar');
});

router.get('/listar/edit/:id',async (req,res,next) => {
  const { id } = req.params;
  const ordenes = await Consulta('SELECT * FROM torden WHERE id= ?',[id]);
  res.render('editarOrden',{ordenes:ordenes[0]});
});

router.post('/listar/edit/:id',async (req,res,next) => {
  const { id } = req.params;
  const { title, description, url} = req.body; 
  const newLink = {
      title,
      description,
      url
  };
  //console.log(newLink);
  //res.send('actualizado');
  await Consulta('UPDATE torden set ? WHERE id = ?', [newLink, id]);
  req.flash('success','Orden actualizada correctamente');
  res.redirect('/listar');
});

router.route('/consultar')
  .get(isLoggedIn,HacerConsulta)

router.get('/checklist',isLoggedIn,(req,res,next) => {
  res.render('FormCkeckList');
});

router.get('/studio',async (req,res,next) => {
  Convercion_ISO_String = (pStr_pfecha,TimeZOne) =>{
    // Now we can access our time at date[1], and monthdayyear @ date[0]
    var date = new Date(pStr_pfecha).toLocaleString('en-US',{
      hour12:false,
      timeZone: TimeZOne
    }).split(" ");

    var time = date[1];
    var mdy = date[0];

    // We then parse  the mdy into parts
    mdy = mdy.split('/');
    var month = parseInt(mdy[0]);
    var day = parseInt(mdy[1]);
    var year = parseInt(mdy[2]);

    // Putting it all together
    const formattedDate = year + '-' + month + '-' + day + ' ' + time;
    return formattedDate
  }

  let fecha_sql = await Consulta('SELECT creacionVehiculo FROM tvehiculo where id_vehiculo = 515;')
  let date_pfecha = fecha_sql[0].creacionVehiculo;
  // 2019-11-30 11:38:38
  console.log('▼▼▼▼▼▼▼▼▼▼▼▼▼▼ MI FECHA ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼');
  
  console.log(' Entrada Fecha Formato ISO-Date ',date_pfecha);
  let str_pfecha = date_pfecha.toISOString();
  console.log(' Convercion Fecha Formato ISO-String ',str_pfecha);

  let My_format_dDate = Convercion_ISO_String(str_pfecha,'Europe/Lisbon'); // donde estas?
  console.log(' Convercion Fecha Formato yyyy-mm-dd ',My_format_dDate);

  let fecha_creada = new Date(str_pfecha);

  console.log(' Convercion de ISO-String => ISO-Date ',fecha_creada);
 
  console.log('▼▼▼▼▼▼▼▼▼▼▼▼▼▼ FECHA EUROPE ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼');

  console.log(' Entrada Fecha Formato ISO-Date ',date_pfecha);
  let eu_ISOstr_pfecha = date_pfecha.toISOString();
  console.log(' Convercion Fecha Formato ISO-String ',eu_ISOstr_pfecha);

  let eu_dddd_str = Convercion_ISO_String(eu_ISOstr_pfecha,'Asia/Oral');

  // Desde aca se considera fecha de 'Europe/Lisbon'
  console.log(' Convercion Fecha Formato yyyy-mm-dd ',eu_dddd_str);

  // Convertimos a formato iso string
  let eu_iso_str = new Date(eu_dddd_str).toISOString();
  console.log(' Convercion de yyyy-mm-dd a ISO-String ',eu_iso_str);

  let eu_fecha_creada = new Date(eu_iso_str);

  // Convercion fecha europea a AMerica/Lima
  let am_dddd_str = Convercion_ISO_String(eu_ISOstr_pfecha,'America/Lima');
  console.log(' Convercion Fecha Formato yyyy-mm-dd (America) ',am_dddd_str);

  let am_iso_str = new Date(am_dddd_str).toISOString();
  console.log(' Convercion de yyyy-mm-dd a ISO-String (America) ',am_iso_str);

  let objet_salida = {
    date:eu_dddd_str,
    timeago:helpers.timeago(eu_fecha_creada)
  }

  res.send(objet_salida);
});

router.route('/crear-checklist')
  .post(asinarOrden);

router.get('/edit-password',isLoggedIn,async (req,res,next) => {
  res.render('edit-password');
});

router.post('/registro-completo',isLoggedIn,async (req,res,next) => {
  let InfoUser      = await helpers.InfoUser(req.user.id_usuario);      // Info Usuario Logueado
  const {tipo_usuario,nombre,apellido_paterno,apellido_materno,telefono,dni,direccion,sexo,edad,email} = req.body;
  
  // Datos para TUsuario
  const Username = await helpers.GenerarUsername(email);
  const Password = await helpers.GenerarPassword();
  let password_ecript = await helpers.encryptPassword(Password);
  const query = 'CALL SP_Crear_Nuevo_Usuario2('+tipo_usuario+',"'+nombre+'","'+apellido_paterno+'","'+apellido_materno+'","'+telefono+'",\
  '+dni+',"'+direccion+'","'+sexo+'",'+edad+',"'+email+'","'+Username+'","'+password_ecript+'")';
  console.log('query',query);

  try {
    await Consulta(query);
    console.log('pasword_encriptado',password_ecript);

    console.log('Username:',Username);
    console.log('Password',Password);
  
    const cuerpoMensage = '<ul>\
    <li><b>Usuario:</b>'+Username+'</li>\
    <li><b>Password:</b>'+Password+'</li>\
    <li>List item</li>\
    <li>List item</li>\
  </ul>'
    await helpers.EnviarMensage(''+email+'','UN MENSAGE NUEVO',cuerpoMensage);
    console.log('req.body',req.body);
  } catch (error) {
    console.log('error: ',error)
  }
  req.flash('messages','Se ha registrado correctamente el Usuario');
  const data = {InfoUser}
  res.render('FormExito_registro',{data:data})
  next();
});

router.post('/detalle-pedido',isLoggedIn,async (req,res,next) => {

  const {id_detalle_pedido,mis_Observaciones,id_tipo_usuario,id_usuario_asignador} = req.body;

  console.log('mis_Observaciones',req.body);
  await Consulta('UPDATE tdetallepedido SET Detalle_requerimiento = "'+mis_Observaciones+'" WHERE (id_detallePedido = '+id_detalle_pedido+');');
  
  //SELECCIONARA EL ID DE CAJA RANDOM XD soi telible
  const consulta_id_caja = await Consulta('SELECT id_usuario FROM v_cajeros_habilitados ORDER BY RAND() limit 1;');
  const {id_usuario} = consulta_id_caja[0];

  //INGRESAMOS UN NUEVO DETALLE PEDIDO PARA FACTURACION

  await Consulta('CALL SP_ADD_Detalle_Facturacion('+id_usuario+','+id_detalle_pedido+');');
  req.flash('messages','Se ha enviado a facturar esta orden con exito')
  res.redirect('/profile')
})

router.get('/detalle-pedido',isLoggedIn,async (req,res,next) => {

  // === === === ESTA RUTA SOLO SERA PARA EL MECANICO :( === === ===

  // RECIBIMOS LAS BARIABLES POR LA DIRECCION URL
  // El id_receptor = yo / El idDetallePedido = al que me asignaron.
  const InfoUser = await helpers.InfoUser(req.user.id_usuario)
  console.log('req.query',req.query);
  console.log('InfoUser',InfoUser);
  const {id_receptor,idDetallePedido,idDNotificacion} = req.query;

  const consulta_verificacion = await Consulta('SELECT id_tipo_usuario FROM tusuario_ttipousuario WHERE id_usuario = '+id_receptor+';');
  const {id_tipo_usuario} = consulta_verificacion[0];

  console.log('idTipo_usuario => ',id_tipo_usuario)
    const query_Detalle_mis_pedidos_asignados = 'CALL SP_Mis_pedidos_asignados('+id_receptor+')';
    const consulta_Detalle_mis_pedidos_asignados = await Consulta(query_Detalle_mis_pedidos_asignados);
    console.log('consulta_Detalle_mis_pedidos_asignados:',consulta_Detalle_mis_pedidos_asignados[0],'para mi id: ',id_receptor);

    //SOLAMENTE QUIERO VER LA INFORMACION DEL PEDIDO CON ESTE ID_DETALLE_PEDIDO
    const query_Detalle_pedido_terminado = 'CALL SP_Mis_facturaciones_asignadas('+idDetallePedido+')';
    const consulta_Detalle_pedido_terminado = await Consulta(query_Detalle_pedido_terminado);
    console.log('Respuesta detalle-pedido:',consulta_Detalle_pedido_terminado[0]);

    const Detalle_Pedido = consulta_Detalle_pedido_terminado[0];
    const data = {InfoUser,Detalle_Pedido,id_tipo_usuario,idDNotificacion,idDetallePedido};
    
    console.log('informacion pedido',data); 
    console.log('Detalle_Pedido.length =>',Detalle_Pedido.length); 
    //REnderizamos enviando los datos
    res.render('Detalle_Pedido',{data:data});
  //}
});

router.post('/detalle-pedido-facturacion',isLoggedIn,async (req,res,next) => {
  const {id_detalle_pedido,id_usuario_asignador,id_Notificacion} = req.body;
  console.log('req.body',req.body);

   console.log('INICIO CAJERO SUBMIT______________________________________________________________________________________________');
    
  // SABER LA FECHA DE INICIO Y nro_orden de este id_detalle_pedido
    let query_fecha_inicio = 'SELECT fecha,nro_Orden FROM tdetallepedido where id_detallePedido = '+id_detalle_pedido+';';
    const consulta_fecha_inicio = await Consulta(query_fecha_inicio);
    const {fecha,nro_Orden} = consulta_fecha_inicio[0];

    // ordenamos la fecha para incertar en TABLA ORDENES GENERALES
      let date = fecha.getFullYear()+'-'+(fecha.getMonth()+1)+'-'+fecha.getDate();
      let time = fecha.getHours() + ":" + fecha.getMinutes() + ":" + fecha.getSeconds();
      let dateTime = date+' '+time;
      let pFechaHoy = helpers.new_Date(new Date())
          pFechaHoy = helpers.formatDateTime(pFechaHoy)
      // la salida es esta
      console.log('La Fecha de iniciacion es',dateTime,'Y numero de orden es : ',nro_Orden)

   // CAMBIAR EL ESTADO DE ORDEN A 5 = finalizado DE ORDENES ACTUALES
    await Consulta('UPDATE tordenes_actuales SET id_estadoOrden = 5 WHERE (nro_orden = '+nro_Orden+');');
    await Consulta('UPDATE tdetallepedido SET id_estadoOrden = 5 WHERE (nro_orden = '+nro_Orden+');');

    // INCERTANDO EN ORDENES GENERALES
     await Consulta('CALL SP_ADD_OrdenesGenerales('+nro_Orden+',"'+dateTime+'","'+pFechaHoy+'",'+id_detalle_pedido+');');
  
     // ACTUALIZAMOS EL DETALLE FACTURACION A 2 PARA SABER QUE SE HA FACTURADO
    await Consulta('UPDATE tdetalle_facturacion SET id_estado_facturacion = 2 where (id_detalle_pedido = '+id_detalle_pedido+');');
  
    // ELIMINAR ESTA NOTIFICACION DE PEDIDO QUE ME ENVIO EL ASIGNADOR
    await Consulta('UPDATE tnotificaciones SET id_estado_notificacion = 2 where (id_notificaciones = '+id_Notificacion+');');

    // ELIMINAR ESTA NOTIFICACION DE PEDIDO QUE ME ENVIO EL ASIGNADOR
    const consulta_IdServicios_Usados = await Consulta('SELECT id_servicio FROM tpedido where (id_detallePedido = '+id_detalle_pedido+');');
    const id_servicio = consulta_IdServicios_Usados;
    console.log('id_servicio',id_servicio);

    //RANKEAR LOS SERVICIOS QUE SE UTILIZARON
    for (let cont = 0; cont <= id_servicio.length-1; cont++) {  
      let consulta_veces = await Consulta('SELECT veces_usada FROM tservicios_generales WHERE id_servicios_generales = '+id_servicio[cont].id_servicio+';'); 
      let veces = consulta_veces[0].veces_usada;
      veces++;
      await Consulta('UPDATE tservicios_generales SET veces_usada = '+veces+' WHERE id_servicios_generales = '+id_servicio[cont].id_servicio+';');
    } 

  //await Consulta('DELETE FROM tnotificaciones WHERE (id_user_emisor = '+id_usuario_asignador+' && id_user_receptor = '+req.user.id_persona+');');
  req.flash('messages','Se ha acabado con esta orden')
  console.log('FIN CAJERO SUBMIT______________________________________________________________________________________________');
  res.redirect('/profile')    
  next();
})

router.get('/detalle-pedido-facturacion',isLoggedIn,async (req,res,next) => {
  console.log('req.query',req.query);
  const InfoUser = await helpers.InfoUser(req.user.id_usuario)
  const {id_receptor,idDetallePedido,idDNotificacion} = req.query;

  //SABER CUANTOS ID_DETALLEPEDIDO_TENGO ASIGNADO COMO CAJA
  const query_id_detalle_pedido_caja = 'CALL SP_GET_idDetalle_Pedido_caja('+id_receptor+');';
  const consulta_id_detalle_pedido_caja = await Consulta(query_id_detalle_pedido_caja);

  console.log('Mi id:',id_receptor,' tiene ',consulta_id_detalle_pedido_caja);

  //SOLAMENTE QUIERO VER LA INFORMACION DEL PEDIDO CON ESTE ID_DETALLE_PEDIDO
  const query_Detalle_pedido_terminado = 'CALL SP_Mis_facturaciones_asignadas('+idDetallePedido+')';
  const consulta_Detalle_pedido_terminado = await Consulta(query_Detalle_pedido_terminado);
  console.log('Respuesta:',consulta_Detalle_pedido_terminado[0]);

  const Detalle_Pedido = consulta_Detalle_pedido_terminado[0];
  const data = {InfoUser,Detalle_Pedido,idDNotificacion};
  console.log('Detalle_Pedido.length =>',Detalle_Pedido.length);

  res.render('Detalle_Facturacion',{data:data});
})

router.get('/pdf',async (req,res,next) => {

  var contenido = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
      body {
        font-family: "Arial", serif;
      }
  
      .cabeza {
        font-size: 13px;
      }
  
      table {
        width: 100%;
      }
  
      table,
      th,
      td {
        border: 1px solid black;
        border-collapse: collapse;
      }
  
      th,
      td {
        padding: 6px;
        text-align: left;
      }
      
      img{
        height:100px;
        width:100px;
      }
      
      .sin_borde{
        border: 0px
      }
    </style>
  </head>
  
  <body>
    <table style="border: 0px">
      <tr>
        <td style="border: 0px">
          <img style="display:none" src="../public/img/logo-autolinea.jpg" alt="logo Autolinea" 
            style="border-radius: 5px;">
        </td>
        <td style="border: 0px">
          <div class='cabeza'>
            <strong>AUTOLINEA N&C SOCIAEDAD ANONIMA CERRADA</strong><br>
            <strong>AUTOLINEA N&C SAC</strong><br>
            <strong>PRINCIPAL : AV REPUBLICA DE VENEZUELA MZA. H LOTE. 6 URB. PARQUE INDUSTRIAL</strong><br>
            <small>Cusco - Wanchaq</small><br>
          </div>
        </td>
      </tr>
    </table>
    <hr>
    <table class='sin_borde'>
        <tr>
          <th class='sin_borde'>ASESOR:</th>
          <td class='sin_borde'>Raul Bernardo</td>
      
          <th class='sin_borde'>MECANICO</th>
          <td class='sin_borde'>Ruben Patricio</td>
        </tr>
        <tr>
          <th class='sin_borde'>OBS ASESOR:</th>
          <td class='sin_borde' colspan="5">Es Necesario hacer una Revicion</td>
        </tr>
    </table>
    <br>
    <table>
      <tr>
        <tr>
          <td colspan="6" style="text-align: center;">INFORMACION USUARIO</td>
        </tr>
        <th>CLIENTE</th>
        <td>Bill Gates</td>
        <th>RUC/DNI</th>
        <td>0000001</td>
        <th>TELEFONO</th>
        <td>978276311</td>
      </tr>
      <tr>
        <th>DIRECCION</th>
        <td colspan="5">Av Huayrurupata N310</td>
      </tr>
    </table>
  
    <br>
    <table>
      <tr>
      <tr>
        <td colspan="6" style="text-align: center;">INFORMACION VEHICULO</td>
      </tr>
      <th>MARCA</th>
      <td>Mercedes-Benz</td>
  
      <th>MODELO</th>
      <td>Sprinter</td>
  
      <th>COLOR</th>
      <td>Blanco</td>
      </tr>
      <tr>
        <th>PLACA</th>
        <td colspan="5">XAP-963</td>
      </tr>
    </table>
    <br>
    <table>
      <thead>
        <tr>
        <tr>
          <td colspan="4" style="text-align: center;">INFORMACION DE SERVICIO</td>
        </tr>
        <th>DESCRIPCION</th>
        <th>OBS CLIENTE</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-column="DESCRIPCION">Alineamineto</td>
          <td data-column="OBS CLIENTE">Se necesitaba corregir</td>
        </tr>
      </tbody>
    </table>
    <br>
    <table>
      <thead>
        <tr>
          <th style="text-align: center;">INFORMACION DE SERVICIO</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-column="INFORMACION DE SERVICIO">4 Pastillas nuevas 200 soles, 
            Desenllante de 4 Ruedas, 4 Plomos de 5 gr
          </td>
        </tr>
      </tbody>
    </table>
    <br><hr>
  </body>
  </html>`;



  var imgSrc = 'file://' + process.cwd() + '/public/img/logo-autolinea.jpg';
  imgSrc = path.normalize(imgSrc);
  var result = "<img src='" + imgSrc + "' alt='logo Autolinea' /><div style='text-align: center;'>Author: Marc Bachmann</div>";
  var result2 = `<img src='` + imgSrc + `' alt='logo Autolinea' /><div style='text-align: center;'>Author: Marc Bachmann</div>`;

  console.log('La direccion de la imagen es:',imgSrc);
   var options = {
      format: 'A4',
      orientation: 'portrait'
  }

  pdf.create(result2,options).toFile('./Downloads/salida.pdf', function(err, res) {
      if (err){
          console.log(err);
      } else {
          console.log(res);
      }
  });
 
  res.render('Download');
}) 

router.post('/pdfd',async (req,res,next) => {
  var file = './Downloads/salida.pdf';
  console.log('Se esta descargandoel archibo');
  res.download(file);
})

router.get('/historial',isLoggedIn,async (req,res,next) => {
  let InfoUser      = await helpers.InfoUser(req.user.id_usuario);      // Info Usuario Logueado
  //const query_data_historial_resumen = 'SELECT * FROM v_historial_resumen;';
  const query_data_historial_resumen = 'SELECT * FROM v_historial_completo;';

  const consulta_data_historial_resumen = await Consulta(query_data_historial_resumen);
  const historial = consulta_data_historial_resumen

  let Tiempo_Inicio=[];
  let Tiempo_Inicio_corto=[]
  let n = 0;
  historial.forEach(element => {
    Tiempo_Inicio[n] = helpers.timeago_int(historial[n].fecha_iniciacion)
    Tiempo_Inicio_corto[n] = helpers.formatDate(historial[n].fecha_iniciacion)
    n++
  });

  const data = {historial,Tiempo_Inicio,Tiempo_Inicio_corto,InfoUser};

  console.log('Resumen de Historial',data);
  res.render('plantilla',{data:data});
})

router.get('/detalle-seguimiento',isLoggedIn,async (req,res,next) => {
  console.log('req.query',req.query);
  const InfoUser = await helpers.InfoUser(req.user.id_usuario)
  const {idDetallePedido,idSeguimiento,id_cliente,id_vehiculo} = req.query;

  // RECUPERAR HISTORIAL DE SERVICIOS DEL VEHICULO
  const query_historial_servicios     = 'SELECT * FROM v_historial_resumen where id_vehiculo = '+id_vehiculo+';',
        consulta_historial_servicios  = await Consulta(query_historial_servicios),
        historial_servicios           = consulta_historial_servicios;
  
  // RECUPERAR DATOS "Principales" DEL VEHICULO
  const Info_vehiculo = {placa,vehiculo_marca,modelo,color} = historial_servicios[0];
  
  let Tiempo_Inicio = [],
      Tiempo_Inicio_corto = [],
      n = 0;
  
  historial_servicios.forEach(element => {
    Tiempo_Inicio[n]        = helpers.timeago_int(historial_servicios[n].fecha_iniciacion)
    Tiempo_Inicio_corto[n]  = helpers.formatDate(historial_servicios[n].fecha_iniciacion)
    n++
  });

  // RECUPERAR DATOS "Principales" DEL CLIENTE
  const query_info_Cliente     = 'SELECT * FROM v_cliente_tipo_cliente WHERE id_cliente = '+id_cliente+';',
        consulta_info_Cliente  = await Consulta(query_info_Cliente);
  console.log('Datos del cliente',consulta_info_Cliente);
  
  const Info_Cliente = {nombre_cliente,telefono,dni,ruc,tipo_cliente} = consulta_info_Cliente[0];

  // RECUPERAR HISTORIUAL DE LLAMADAS
  const query_historial_seguimiento       = 'SELECT * FROM v_ids_detalle_seguimiento where id_vehiculo = '+id_vehiculo+' && id_usuario is not null;',
        consulta_historial_seguimiento    = await Consulta(query_historial_seguimiento),
        historial_seguimiento             = consulta_historial_seguimiento;
  
  Validar_Usuario_Seguimiento = async (pId_usuario) => {
    //let Info_Usuario = {};
    //if(pId_usuario != null){
      const query_info_Usuario     = 'SELECT nombre,apellido_paterno FROM v_tusuario_tpersona WHERE id_usuario = '+pId_usuario+';',
            consulta_info_Usuario  = await Consulta(query_info_Usuario);
      let {nombre,apellido_paterno} = consulta_info_Usuario[0];
      console.log('No es nulo el id_usuario',consulta_info_Usuario)
    //}else{
    //  Info_Usuario = {nombre:'SIN ',apellido_paterno:'NOMBRE'}
    //  console.log('SI es nulo el id_usuario')
    //}
    let data = {nombre:nombre,apellido_paterno:apellido_paterno}
    return data;
  }

  if (historial_seguimiento.length != 0){

    let Tiempo_Seguimiento=[]
    let Tiempo_Seguimiento_corto=[]
    let i = 0;
    let info_emisor = {}
    let pObjeto;
  
/*     historial_seguimiento.forEach(element => {
      Tiempo_Seguimiento[i]       = helpers.timeago(historial_seguimiento[i].fecha_seguimiento)
      Tiempo_Seguimiento_corto[i] = helpers.formatDate(historial_seguimiento[i].fecha_seguimiento)
      info_emisor = {nombre:nombre,apellido_paterno:apellido_paterno} = await Validar_Usuario_Seguimiento(historial_seguimiento[i].id_usuario)
      console.log('BOOCLE',info_emisor)
      await Object.assign(element[i],info_emisor)
      i++
    }); */

    for (let index = 0; index <= historial_seguimiento.length-1; index++) {
      Tiempo_Seguimiento[index]       = helpers.timeago_int(historial_seguimiento[index].fecha_seguimiento)
      Tiempo_Seguimiento_corto[index] = helpers.formatDate(historial_seguimiento[index].fecha_seguimiento)
      info_emisor = {nombre:nombre,apellido_paterno:apellido_paterno} = await Validar_Usuario_Seguimiento(historial_seguimiento[index].id_usuario)
      console.log('BOOCLE',info_emisor)
      await Object.assign(historial_seguimiento[index],info_emisor)
    }

    //console.log('Salida de la funcion',info_emisor);
  
    console.log('Data Historial Seguimiento',historial_seguimiento);
    // HACER OBJETO PARA LA VISTA
    const data = 
    {
      InfoUser,
      historial_servicios,
      historial_seguimiento,
      Tiempo_Inicio,
      Tiempo_Inicio_corto,
      Tiempo_Seguimiento,
      Tiempo_Seguimiento_corto,
      Info_vehiculo,
      Info_Cliente,
      idSeguimiento,
      estado:true
    }
    res.render('Form_detalle_seguimiento',{data:data});
  }else{
    const data = 
    {
      InfoUser,
      historial_servicios,
      Tiempo_Inicio,
      Tiempo_Inicio_corto,
      Info_vehiculo,
      Info_Cliente,
      idSeguimiento,
      estado:false
    }
    res.render('Form_detalle_seguimiento',{data:data});
  }

});

router.post('/detalle-seguimiento',isLoggedIn,async (req,res,next) => {
  const InfoUser = await helpers.InfoUser(req.user.id_usuario)
  const {id_seguimiento,detalle_seguimiento} = req.body
  let f_date  = req.app.locals.f_hoy.f_date,
      f_str   = req.app.locals.f_hoy.f_str;
  // RECUPERAR INFORMACION DE ESTE SEGUIMIENTO
  const query_info_seguimiento     = 'SELECT * FROM tseguimiento WHERE id_seguimiento = '+id_seguimiento+';',
        consulta_info_seguimiento  = await Consulta(query_info_seguimiento),
        info_seguimiento           = consulta_info_seguimiento[0];

        let {
          id_detalle_pedido,
          id_vehiculo,
          id_cliente,
          id_estado_seguimiento,
          id_etapa_seguimiento,
          fecha_salida,
        } = info_seguimiento;

        console.log('Convercion de fecha',helpers.formatDateTime(fecha_salida));
        console.log('info_seguimiento',info_seguimiento);

        console.log('SP_',id_seguimiento,
        id_detalle_pedido,
        id_cliente,
        id_vehiculo,
        InfoUser.id_usuario,
        id_estado_seguimiento,
        id_etapa_seguimiento,
        detalle_seguimiento,
        helpers.formatDateTime(fecha_salida))

  const query_registrar_seguimiento     = `CALL SP_Registrar_Seguimiento(
    `+id_seguimiento+`,
    `+id_detalle_pedido+`,
    `+id_cliente+`,
    `+id_vehiculo+`,
    `+InfoUser.id_usuario+`,
    `+id_estado_seguimiento+`,
    `+id_etapa_seguimiento+`,
    "`+detalle_seguimiento+`",
    "`+helpers.formatDateTime(fecha_salida)+`",
    "`+f_str+`"
    );`;
  await Consulta(query_registrar_seguimiento); 
  //console.log('Salida de ESTE SEGUIMIENTO',info_seguimiento[0]);
  const data = {InfoUser}
  res.render('F_Registro_seguimiento_exito',{data:data});
})
module.exports = router; // 859