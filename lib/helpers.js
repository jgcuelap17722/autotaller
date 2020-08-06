const bcrypt = require('bcryptjs'); // requiero modulo para encriptar contraceñas
const { format, register } = require('timeago.js'); // importamos la biblioteca
const nodemailer = require('nodemailer');
const generator = require('generate-password');
const fetch = require('node-fetch');
const moment = require('moment-timezone');
const dateFormat = require('dateformat');
const pool = require('../database');

const helpers = {};// despues utilizaremos esa instancia

helpers.encryptPassword = async (password) => { // recibimos la contraceña tal cual
  const salt = await bcrypt.genSalt(10); // generar un patron
  const hash = await bcrypt.hash(password, salt);
  // dar ese patron y contraceña a un metodo bycript
  // para cifrar la contraceña
  return hash; // una ves cifrada debolvemos ese valor
};

// una vez autenticado con la contraseña
// comparar la contraceña con la pw de la base de datos
// comparemos contraceña
helpers.matchPassword = async (password, savedPassword) => {
  try {
    // metodo compare compara 2 parametros

    // compara lo que tengo guardado

    // con lo que el usuario esta intentando ingresar
    return await bcrypt.compare(password, savedPassword);
  } catch (e) {
    console.log(e); // mostrar error
  }
};

helpers.EnviarMensage = (emailReceptor, Asunto, mensage) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: 'jgcuelap2018@gmail.com',
      pass: 'JOSSEm4tem4tic4'
    }
  });

  const mailOptions = {
    from: emailReceptor,
    to: emailReceptor,
    subject: Asunto,
    html: mensage
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error.message);
    }
    console.log('Mensage enviado');
  });
};

helpers.GenerarPassword = () => {
  const password = generator.generate({
    length: 10,
    numbers: true
  });
  console.log('Contraseña Generada:', password);
  return password;
};

helpers.GenerarUsername = async (pEmail) => {
  try {
    const key1 = pEmail.substring(0, pEmail.indexOf("@")); // extraer cadena antes del "@"
    const key2 = Math.floor(Math.random() * 90 + 10); // Generar un numero aleatorio del 10 - 99
    const Username = key1 + key2;
    const consulta = `SELECT username FROM tusuario WHERE username = "${Username}"`; // Comprovar si existe un usuario con ese username
    const rows = await pool.query(consulta);
    console.log('rows.length ', rows);
    if (rows.length > 0) {
      console.log('Existe', Username);
      await helpers.GenerarUsername(pEmail);
    } else {
      console.log('No Existe', Username);
      out = Username;
      console.log('Saida Final', out);
      return out;
    }
    return out;
  } catch (error) {
    console.log(error);
  }
};

// OBTENER TODA LA INFORMACION DE EL USUARIO LOGEADO
helpers.InfoUser = async (idUser) => {
  const consultaInfoUser = await pool.query(`SELECT id_usuario,nombre,apellido_paterno,sexo,id_tipo_usuario FROM v_tusuario_tpersona WHERE id_usuario = ${idUser}`);
  const InfoUser = {
    id_usuario, nombre, apellido_paterno, id_tipo_usuario
  } = consultaInfoUser[0];
  return InfoUser;
};

helpers.formatTime = (pdate) => {
  Convercion_ISO_String = (pStr_pfecha, TimeZOne) => {
    // Now we can access our time at date[1], and monthdayyear @ date[0]
    const date = new Date(pStr_pfecha).toLocaleString('en-US', {
      hour12: false,
      timeZone: TimeZOne
    }).split(" ");

    const time = date[1];
    let mdy = date[0];

    // We then parse  the mdy into parts
    mdy = mdy.split('/');
    const month = parseInt(mdy[0]);
    const day = parseInt(mdy[1]);
    const year = parseInt(mdy[2]);

    // Putting it all together
    const formattedDate = `${year}-${month}-${day} ${time}`;
    return formattedDate;
  };

  dateFormat.i18n = {
    dayNames: [
      'Dom', 'Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab',
      'Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'
    ],
    monthNames: [
      'En', 'Febr', 'Mzo', 'Abr', 'My', 'Jun', 'Jul', 'Agt', 'Sep', 'Oct', 'Nov', 'Dic',
      'Enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ],
    timeNames: [
      'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
    ]
  };
  const tZone = 'America/Lima'; let date = {};
  let d = new Date(pdate); // fecha
  let h = new Date(pdate); // hora
  let di = new Date(pdate).toISOString(); // timeago

  // Obtener mi año
  const Myanio = parseInt(new Date().toLocaleString('en-US', {
    timeZone: tZone,
    year: 'numeric'
  }), 10);

  console.log('MI anio', Myanio);

  // Obtener año entrante
  const pAnio = parseInt(new Date(pdate).toLocaleString('en-US', {
    timeZone: tZone,
    year: 'numeric'
  }), 10);

  console.log('panio', pAnio);

  // Obtener hora entrante
  h = dateFormat(h, "h:MM tt");
  console.log('h ', h);

  if (pAnio < Myanio) {
    d = dateFormat(d, "d 'de 'mmmm, yyyy");
  } else { d = dateFormat(d, "d 'de 'mmmm"); }

  console.log('d ', d);

  /*   di = di.toLocaleString('en-US',{
    timeZone: 'Asia/Oral'i
  }); */
  const eu_dddd_str = Convercion_ISO_String(di, 'Asia/Oral');
  const fecha_creada = new Date(eu_dddd_str);

  console.log('di es ', eu_dddd_str);

  di = helpers.timeago(new Date(fecha_creada));

  date = {
    fecha: d,
    hora: h,
    timeago: di
  };

  return date;
  /*
  let salida_fecha = dateFormat(new Date(pdate), "d 'de 'mmmm, yyyy, h:MM tt ");
 */
};

helpers.timeago = (timestamp) => {
  // convertir en formato 3 minutos atras
  // conole.log(timestamp) -- p
  // the local dict example is below.
  const localeFunc = (number, index, total_sec) =>
    // number: the timeago / timein number;
    // index: the index of array below;
    // total_sec: total seconds between date to be formatted and today's date;
    [
      ['justo ahora', 'ahora mismo'],
      ['%s segundos atrás', 'en %s segundos'],
      ['Hace 1 minuto', 'en 1 minuto'],
      ['hace %s minutos', 'en %s minutos'],
      ['hace 1 hora', 'en 1 hora'],
      ['hace %s horas', 'en %s horas '],
      ['hace 1 día', 'en 1 día'],
      ['hace %s días', 'en %s días'],
      ['hace 1 semana', 'en 1 semana'],
      ['%s semanas atrás', 'en %s semanas'],
      ['hace 1 mes', 'en 1 mes'],
      ['%s meses atrás', 'en %s meses'],
      ['hace 1 año', 'en 1 año'],
      ['hace %s años', 'en %s años']
    ][index];
  // register your locale with timeago
  register('my-locale', localeFunc);
  return format(timestamp, 'my-locale');
};

helpers.timeago_int = (pDate) => salida = helpers.timeago(pDate.setHours(pDate.getHours() + 5));

helpers.new_Date = (pDate) => {
  // I (fecha string formato ISO ,Nombre timezone)
  Convercion_ISO_String = (pStr_pfecha, TimeZOne) => {
    const date = new Date(pStr_pfecha).toLocaleString('en-US', {
      hour12: false,
      timeZone: TimeZOne
    }).split(" ");

    const time = date[1];
    let mdy = date[0];

    mdy = mdy.split('/');
    const month = parseInt(mdy[0]);
    const day = parseInt(mdy[1]);
    const year = parseInt(mdy[2]);

    const formattedDate = `${year}-${month}-${day} ${time}`;
    return formattedDate;
  };// O dddd-mm-dd hh:mm:ss

  const str_ISO = new Date(pDate).toISOString();

  const date_dddd = Convercion_ISO_String(str_ISO, 'America/Lima');

  const date = new Date(date_dddd);

  // TOMA LA FECHA DEL SERVIDOR Y RETORNA LA FECHA DE America/Lima en formato ( date )
  /*   let Newdate = new Date(moment(pDate).tz('America/Lima').format("YYYY-MM-DD HH:mm:ss"));
  console.log('Salida de fecha de Peru',helpers.formatDateTime(Newdate)); */
  return date;
};

helpers.formatDate = (date) => {
  if (date != null) {
    /*     var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getDate() + "/" + (date.getMonth()+1)+ "/" + date.getFullYear() + "  " + strTime; */
    const nDate = new Date(date).toLocaleString('en-US', {
      timeZone: 'America/Lima',
      year: "numeric",
      month: "2-digit",
      day: "numeric"
    });

    return nDate;
  }
  return '';
};

helpers.formatDateTime = (date) => {
  if (date != null) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    // var ampm = hours >= 12 ? 'pm' : 'am';
    // hours = hours % 12;
    // hours = hours ? hours : 12; // the hour '0' should be '12'
    // minutes = minutes < 10 ? '0'+minutes : minutes;
    // var strTime = hours + ':' + minutes + ' ' + ampm;
    // return date.getDate()+1 + ":" + (date.getMonth()+1)+ "/" + date.getFullYear() + "  " + strTime;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${hours}:${minutes}:${seconds}`;
  }
  return '';
};

// CONSULTAR DNI
helpers.Consulta_Dni = async (pDni) => {
  /*   try {
      if (pDni.toString().length < 8) { // Caso dni con menos de 8 digitos
        pDni          = pDni.toString().padStart(8, '0')
        let response  = await fetch('http:// api.ateneaperu.com/api/Reniec/Dni?sNroDocumento='+pDni)
        response      = await response.json();
        console.log('Salida de Consulta_Dni',response);
        // Saber si Haocurrido un error
        if (response.hasOwnProperty('Message')) {
          return helpers.Consulta_Dni_Aux(pDni)
          // return response.Message;    // Cuando no encuentra el Dni
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
        let response  = await fetch('http:// api.ateneaperu.com/api/Reniec/Dni?sNroDocumento='+pDni)
        response      = await response.json();
        console.log('Salida de Consulta_Dni',response);
        // Saber si Haocurrido un error
        if (response.hasOwnProperty('Message') ) {
          console.log('Si message',response.Message);
          return helpers.Consulta_Dni_Aux(pDni)
          // return response.Message;    // Cuando no encuentra el Dni
        }else{
          let fullname = '';
          fullname = fullname.concat(response.nombres,' ',response.apellido_paterno,' ',response.apellido_materno);
          // Convertir toda las Iniciales de texto en Mayusculas
            String.prototype.capitalize = function() {return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });};
            fullname = (fullname.toLowerCase()).capitalize();
          return fullname;            // todo bien
        } */
  /* } catch (err) { */
  // return helpers.Consulta_Dni_Aux(pDni)
  // console.log('Algo salio mal con la consulta dni ', err);
  // return 'DESCONECCION'
  /* } */

  try {
    if (pDni.toString().length < 8) {
      pDni = pDni.toString().padStart(8, '0');
    }
    return helpers.Consulta_Dni_Aux(pDni);
  } catch (err) {
    return "An error has occurred.";
  }
};

helpers.Consulta_Dni_Aux = async (pdni) => {
  console.log('Activando Auxiliar');
  try {
    const miToken    = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnY3VlbGFwQGdtYWlsLmNvbSJ9.t6cDUspkRA3grHKMtlCq1PzTGl2nElvjFHcAIi7QBqc';
    const apiUrl     = `https://dniruc.apisperu.com/api/v1/dni/${pdni}?token=${miToken}`;

    const respuesta   = await fetch(apiUrl);
    const info_dni    = await respuesta.json();
    if (info_dni.hasOwnProperty('message')) {
      console.error("MENSAGE DE ERROR --> ", info_dni);
      return "An error has occurred.";
    } if (info_dni.nombres == "") {
      console.log("DNI INCORRECTO");
      return "An error has occurred.";
    }
    let fullname    = '';
    fullname = fullname.concat(info_dni.nombres, ' ', info_dni.apellidoPaterno, ' ', info_dni.apellidoMaterno);
    // Convertir toda las Iniciales de texto en Mayusculas
    String.prototype.capitalize = function () { return this.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase()); };

    fullname = (fullname.toLowerCase()).capitalize();
    return fullname;
  } catch (err) {
    console.log('Algo salio mal con la consulta dni ', err);
    return 'DESCONECCION';
  }
};

// CONSULTAR RUC
helpers.Consulta_Ruc = async (pRuc) => {
/*   try {
    let response = await fetch('https:// api.sunat.cloud/ruc/'+pRuc+'')
    let info_ruc = await response.json()
    return info_ruc;
  } catch (err) {
    console.log('Algo salio mal con la consulta ruc ', err);
    return 'DESCONECCION RUC'
  } */
  try {
    const miToken    = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnY3VlbGFwQGdtYWlsLmNvbSJ9.t6cDUspkRA3grHKMtlCq1PzTGl2nElvjFHcAIi7QBqc';
    const apiUrl     = `https:// dniruc.apisperu.com/api/v1/ruc/${pRuc}?token=${miToken}`;

    const respuesta   = await fetch(apiUrl);
    const info_ruc    = await respuesta.json();

    const obj_ruc =      {
      razon_social: info_ruc.razonSocial,
      domicilio_fiscal: info_ruc.direccion
    };
    return obj_ruc;
  } catch (error) {
    console.log('Algo salio mal con la consulta ruc ', error);
    return 'DESCONECCION RUC';
  }
};

module.exports = helpers;
