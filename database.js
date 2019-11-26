const mysql = require('mysql');
const { promisify }= require('util');
const { database } = require('./keys');

const pool = mysql.createPool(database);

//quiero recuperar un error u la coneccion
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has to many connections');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused');
    }
  }
  //si obtengo la conneccion
 if (connection) connection.release();
  console.log('DB is Connected');
  return;
});


// Promisify Pool Querys
//convertir a promesas las consultas sql
pool.query = promisify(pool.query);

//exportar pool para hacer las consultas
module.exports = pool;