const mysql         = require('mysql');
const mariadb       = require('mariadb');
const { promisify } = require('util');
const { database }  = require('./keys');

// const poolMysql   = mysql.createPool(database); // Mysql
const poolMariadb = mariadb.createPool(database); // Mariadb

// quiero recuperar un error u la coneccion
/* poolMysql.getConnection((err, connection) => {
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
}); */
// convertir a promesas las consultas Mysql sql
/* poolMysql.query = promisify(poolMysql.query); */

module.exports = poolMariadb;
