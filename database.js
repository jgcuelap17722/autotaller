const mysql = require('mysql');
const mariadb = require('mariadb');
const { promisify } = require('util');
const { database } = require('./keys');

const pool = mysql.createPool(database);

// quiero recuperar un error u la coneccion
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
  // si obtengo la conneccion
  if (connection) connection.release();
  console.log('DB is Connected');
});

// Promisify Pool Querys
// convertir a promesas las consultas sql
pool.query = promisify(pool.query);

// exportar pool para hacer las consultas

const pool2 = mariadb.createPool(database);

module.exports = pool2;
