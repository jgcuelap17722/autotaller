const bcrypt = require('bcryptjs');
const { format } = require('timeago.js'); 
const nodemailer = require('nodemailer');
const generator = require('generate-password');
const pool = require('../database');

const Queries = {};


Queries.Placas_IDS_Vehiculos = () => { //Consultar Las placas e id de Vehiculos
    const query_Consulta_Vehiculos = 'SELECT id_vehiculo,placa,id_marca,id_modelo,id_generacion,color FROM tvehiculo;';
    const Consulta_Vehiculos = pool.query(query_Consulta_Vehiculos);
    return Consulta_Vehiculos;
};

Queries.Tipo_Cliente_IDS_Tipo_Cliente = () => { //Consultar los tipos de cliente e ids y retornarlos
    const Consulta_tipo_cliente = 'SELECT id_tipo_cliente,tipo_cliente FROM ttipo_cliente;',
    TipoCliente = {id_tipo_cliente,tipo_cliente} = pool.query(Consulta_tipo_cliente);
    return TipoCliente;
};

// ------------------------------------ SP ------------------------------------

Queries.SP_recuperar_Cliente = async (pIdVehiculo) => { //Informacion de Usuarios de Ese vehiculo
    const SP_recuperar_Cliente = 'CALL SP_recuperar_Cliente('+pIdVehiculo+')',
    recuperar_Cliente = await pool.query(SP_recuperar_Cliente);
    return recuperar_Cliente[0];
    // RETORNA 
    /*  id_vehiculo,id_cliente,id_tipo_cliente,tipo_cliente ,nombre_cliente,telefono,email,
        dni,ruc,direccion,placa,vehiculo_marca,modelo,anio,color */
};

module.exports = Queries;