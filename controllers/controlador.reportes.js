const pool = require('../database'); //referencia a ala base de datos
const helpers = require('../lib/helpers');
const Queries = require('../lib/Queries');
const Reportes = {}
Consulta = (pQuery) => {return pool.query(pQuery)};

Reportes.recuperarReporte_get = async (req,res,next) => {
    //let InfoUser      = await helpers.InfoUser(req.user.id_usuario);      // Info Usuario Logueado
    //const query_data_vehiculos_recurrentes = 'SELECT * FROM v_historial_resumen;';
    const query_data_vehiculos_recurrentes = 'SELECT * FROM v_reporte_vehiculos_recurrentes ORDER BY nregistros DESC;';
    const query_data_top_10_marcas = 'select * from v_top_vehiculos_registrados order by cantidad desc limit 10;'
    
    const consulta_data_historial_resumen = await Consulta(query_data_vehiculos_recurrentes);
    const vehiculos_recurrentes = consulta_data_historial_resumen

    const consulta_data_top_marcas = await Consulta(query_data_top_10_marcas);
    const top_marcas = consulta_data_top_marcas

    const data = {vehiculos_recurrentes,top_marcas};

    res.render('Reportes',{data:data});
}

module.exports = Reportes;