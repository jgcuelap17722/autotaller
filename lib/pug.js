//Especificar que ba a ser la biblioteca " timeago.js "
const { format } = require('timeago.js'); //importamos la biblioteca

const helpers = {}; //despues utilizaremos esa instancia

//creamos la funcion 
helpers.timeago_int = (timestamp) => {
	//convertir en formato 3 minutos atras
	//conole.log(timestamp) -- p
    return format(timestamp);  
};

module.exports = helpers;