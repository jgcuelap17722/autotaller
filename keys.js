module.exports = {

  database: {
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
    host           : process.env.DB_HOST,
    user           : process.env.DB_USER,
    password       : process.env.DB_PASS,
    database       : process.env.DB_DATABASE,
    port           : process.env.DB_PORT
  }

};
