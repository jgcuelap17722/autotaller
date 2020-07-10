const pool = require('../database'); //referencia a ala base de datos
const helpers = require('../lib/helpers');
const Queries = require('../lib/Queries');
const Ordenes_hoy = {}
Consulta = (pQuery) => {return pool.query(pQuery)};

Ordenes_hoy.recuperarOrdenes_hoy_get = async (req,res,next) => {
    const query_data_ordenes_hoy = 'call SP_GET_Historial_Ordenes_Hoy;';
   
    const consulta_data_ordenes_hoy = await Consulta(query_data_ordenes_hoy);
    const ordenes_hoy = consulta_data_ordenes_hoy[0]

    let Tiempo_Inicio=[];
    let Tiempo_Inicio_corto=[]
    let n = 0;
    ordenes_hoy.forEach(element => {
      Tiempo_Inicio[n] = helpers.timeago_int(ordenes_hoy[n].fecha_iniciacion)
      Tiempo_Inicio_corto[n] = helpers.formatDate(ordenes_hoy[n].fecha_iniciacion)
      n++
    });
    
    const data = {ordenes_hoy,Tiempo_Inicio,Tiempo_Inicio_corto};

    res.render('ordenes_hoy',{data:data});
}

module.exports = Ordenes_hoy;