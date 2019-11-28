const bcrypt = require('bcryptjs'); //requiero modulo para encriptar contraceñas
const { format ,register} = require('timeago.js'); //importamos la biblioteca
const nodemailer = require('nodemailer');
const generator = require('generate-password');
const pool = require('../database');
const fetch = require('node-fetch');
const moment = require('moment-timezone');

const helpers = {};//despues utilizaremos esa instancia

helpers.encryptPassword = async (password) => { //recibimos la contraceña tal cual
  const salt = await bcrypt.genSalt(10); //generar un patron 
  const hash = await bcrypt.hash(password, salt);
  //dar ese patron y contraceña a un metodo bycript
  //para cifrar la contraceña
  return hash; // una ves cifrada debolvemos ese valor
};

//una vez autenticado con la contraseña
// comparar la contraceña con la pw de la base de datos
//comparemos contraceña
helpers.matchPassword = async (password, savedPassword) => {
  try {
  	//metodo compare compara 2 parametros 
  	//compara lo que tengo guardado
  	//con lo que el usuario esta intentando ingresar 
    return await bcrypt.compare(password, savedPassword);
  } catch (e) {
    console.log(e) //mostrar error
  }
};

helpers.EnviarMensage = (email_receptor,Asunto,mensage) => {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
          user: 'jgcuelap2018@gmail.com',
          pass: 'JOSSEm4tem4tic4'
      }
  });

  let mailOptions = {
      from: email_receptor,
      to: email_receptor,
      subject: Asunto,
      html: mensage
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error.message);
      }
      console.log('Mensage enviado');
  });
}

helpers.GenerarPassword = () => {
  let password = generator.generate({
    length: 10,
    numbers: true
  })
  console.log('Contraseña Generada:',password);
  return password;
}

helpers.GenerarUsername = async (pEmail) => {
  try {
    const key_1 = pEmail.substring(0, pEmail.indexOf("@")); //extraer cadena antes del "@"
    const key_2 = Math.floor(Math.random() * 90 + 10);     //Generar un numero aleatorio del 10 - 99
    const Username = key_1+key_2
    let consulta = 'SELECT username FROM tusuario WHERE username = "'+Username+'"'; // Comprovar si existe un usuario con ese username
    const rows = await pool.query(consulta);
    console.log('rows.length ',rows)
    if(rows.length > 0){
      console.log('Existe',Username)
      await helpers.GenerarUsername(pEmail);
    }else{
      console.log('No Existe',Username)
      out = Username;
      console.log('Saida Final',out)
      return out;
    }
    return out;
  } catch (error) {
    console.log(error)
  }
}

//OBTENER TODA LA INFORMACION DE EL USUARIO LOGEADO
helpers.InfoUser = async (idUser) => {
  const consulta_info_User = await pool.query('SELECT id_usuario,nombre,apellido_paterno,sexo,id_tipo_usuario FROM v_tusuario_tpersona WHERE id_usuario = '+idUser+'');
  const InfoUser = {id_usuario,nombre,apellido_paterno,id_tipo_usuario} = consulta_info_User[0];
  return InfoUser;
}

helpers.timeago = (timestamp) => {
	//convertir en formato 3 minutos atras
  //conole.log(timestamp) -- p
  // the local dict example is below.
  const localeFunc = (number, index, total_sec) => {
    // number: the timeago / timein number;
    // index: the index of array below;
    // total_sec: total seconds between date to be formatted and today's date;
      return [
        ['justo ahora','ahora mismo'],
        ['%s segundos atrás','en %s segundos'],
        ['Hace 1 minuto','en 1 minuto'],
        ['hace %s minutos','en %s minutos'],
        ['hace 1 hora','en 1 hora'],
        ['hace %s horas','en %s horas '],
        ['hace 1 día','en 1 día'],
        ['hace %s días','en %s días'], 
        ['hace 1 semana','en 1 semana'], 
        ['%s semanas atrás','en %s semanas'], 
        ['hace 1 mes','en 1 mes'] , 
        ['%s meses atrás','en %s meses'], 
        ['hace 1 año','en 1 año'],
        ['hace %s años','en %s años'] 
      ][index];
    };
    // register your locale with timeago
    register('my-locale', localeFunc);
    return format(timestamp,'my-locale');  
};

helpers.timeago_int = (pDate) => {
  // COMO PARAMETRO REQUIERE FECHA INTERNACIONAL Y COMPARA CON FECHA ACTUAL DEL SERVIDOR
  // Cambiar a America/Lima Si el servidor del sistema es Localhost 
  // Encaso de un servidor alquilado poner la ubicacion del servidor "Europe/Lisbon"
  let NewTimeago = new Date(moment(pDate).tz('Europe/Lisbon').format("YYYY-MM-DD HH:mm:ss"));
      console.log('Salida de fecha extrangera',helpers.formatDateTime(NewTimeago));
      NewTimeago = helpers.timeago(NewTimeago);
      console.log('Salida de helpers.timeago_int',NewTimeago);
  return NewTimeago
}

helpers.new_Date = (pDate) => {
  // TOMA LA FECHA DEL SERVIDOR Y RETORNA LA FECHA DE America/Lima en formato ( date )
  let Newdate = new Date(moment(pDate).tz('America/Lima').format("YYYY-MM-DD HH:mm:ss"));
  console.log('Salida de fecha de Peru',helpers.formatDateTime(Newdate));
  return Newdate;
}

helpers.formatDate = (date) => {
  if(date != null){
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getDate() + "/" + (date.getMonth()+1)+ "/" + date.getFullYear() + "  " + strTime;
  }else{
    return '';
  }
}

helpers.formatDateTime = (date) => {
  if(date != null){
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    //var ampm = hours >= 12 ? 'pm' : 'am';
    //hours = hours % 12;
    //hours = hours ? hours : 12; // the hour '0' should be '12'
    //minutes = minutes < 10 ? '0'+minutes : minutes;
    //var strTime = hours + ':' + minutes + ' ' + ampm;
    //return date.getDate()+1 + ":" + (date.getMonth()+1)+ "/" + date.getFullYear() + "  " + strTime;
    return date.getFullYear() + "-" + (date.getMonth()+1)+ "-" + (date.getDate()) + " "+hours+":"+minutes+ ":"+seconds;
  }else{
    return '';
  }
}

// CONSULTAR DNI
helpers.Consulta_Dni = async (pDni) => {
  try {
    if (pDni.toString().length < 8) { // Caso dni con menos de 8 digitos
      pDni          = pDni.toString().padStart(8, '0')
      let response  = await fetch('http://api.ateneaperu.com/api/Reniec/Dni?sNroDocumento='+pDni)
      response      = await response.json();
      console.log('Salida de Consulta_Dni',response);
      // Saber si Haocurrido un error
      if (response.hasOwnProperty('Message')) {
        return helpers.Consulta_Dni_Aux(pDni)
        //return response.Message;    // Cuando no encuentra el Dni
      }else{
        let fullname = '';
        fullname = fullname.concat(response.nombres,' ',response.apellido_paterno,' ',response.apellido_materno);
        // Convertir toda las Iniciales de texto en Mayusculas
          String.prototype.capitalize = function() {return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });};
          fullname = (fullname.toLowerCase()).capitalize();
        return fullname;            // todo bien
      }
    }

    // Caso dni con todos los digitos
      let response  = await fetch('http://api.ateneaperu.com/api/Reniec/Dni?sNroDocumento='+pDni)
      response      = await response.json();
      console.log('Salida de Consulta_Dni',response);
      // Saber si Haocurrido un error
      if (response.hasOwnProperty('Message') ) {
        console.log('Si message',response.Message);
        return helpers.Consulta_Dni_Aux(pDni)
        //return response.Message;    // Cuando no encuentra el Dni
      }else{
        let fullname = '';
        fullname = fullname.concat(response.nombres,' ',response.apellido_paterno,' ',response.apellido_materno);
        // Convertir toda las Iniciales de texto en Mayusculas
          String.prototype.capitalize = function() {return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });};
          fullname = (fullname.toLowerCase()).capitalize();
        return fullname;            // todo bien
      }
  } catch (err) {
    return helpers.Consulta_Dni_Aux(pDni)
    //console.log('Algo salio mal con la consulta dni ', err);
    //return 'DESCONECCION'
  }
}

helpers.Consulta_Dni_Aux = async (pdni) => {
  console.log('Activando Auxiliar');
  try {
      let mi_token    = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnY3VlbGFwQGdtYWlsLmNvbSJ9.t6cDUspkRA3grHKMtlCq1PzTGl2nElvjFHcAIi7QBqc',
          api_url     = 'https://dniruc.apisperu.com/api/v1/dni/'+pdni+'?token='+mi_token+'',
          
          respuesta   = await fetch(api_url),
          info_dni    = await respuesta.json();
      
      let fullname    = '';  
          fullname    = fullname.concat(info_dni.nombres,' ',info_dni.apellidoPaterno,' ',info_dni.apellidoMaterno);
      // Convertir toda las Iniciales de texto en Mayusculas
      String.prototype.capitalize = function() {return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });};
      
          fullname    = (fullname.toLowerCase()).capitalize();
      return fullname;
      
  } catch (err) {
    console.log('Algo salio mal con la consulta dni ', err);
    return 'DESCONECCION'
  }
}

// CONSULTAR RUC
helpers.Consulta_Ruc = async (pRuc) => {
/*   try {
    let response = await fetch('https://api.sunat.cloud/ruc/'+pRuc+'')
    let info_ruc = await response.json()
    return info_ruc;
  } catch (err) {
    console.log('Algo salio mal con la consulta ruc ', err);
    return 'DESCONECCION RUC'
  } */
  try {
    let mi_token    = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnY3VlbGFwQGdtYWlsLmNvbSJ9.t6cDUspkRA3grHKMtlCq1PzTGl2nElvjFHcAIi7QBqc',
        api_url     = 'https://dniruc.apisperu.com/api/v1/ruc/'+pRuc+'?token='+mi_token+'',
        
        respuesta   = await fetch(api_url),
        info_ruc    = await respuesta.json();

    let obj_ruc = 
      {
        razon_social      : info_ruc.razonSocial,
        domicilio_fiscal  : info_ruc.direccion,
      }
    return obj_ruc;

  } catch (error) {
    console.log('Algo salio mal con la consulta ruc ', error);
    return 'DESCONECCION RUC'
  }
}

module.exports = helpers;