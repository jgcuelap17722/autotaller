const helpers = require('../lib/helpers');
const Queries = require('../lib/Queries');
const consultasCtr = {}

  consultasCtr.HacerConsulta = async (req,res) => {
// ESTA FUNCION RETORNA A LA VISTA "formConsulta" Placas y Ids de vehiculos 
    // --- Mis Variables ---
    const id_vehiculo=[],Placas=[],
    InfoUser = await helpers.InfoUser(req.user.id_usuario) // <== Info del Usuario

    //Consultar Las placas e id de Vehiculos
    const Placas_IDS_Vehiculos = await Queries.Placas_IDS_Vehiculos();
    
    console.log('(CONSULTA)_Placas:',Placas_IDS_Vehiculos);
    
    //Ordenar ids de vehiculos y sus placas para el Combo
    let n = 0 
    Placas_IDS_Vehiculos.forEach(element => {
      id_vehiculo[n]    = element.id_vehiculo
      Placas[n]         = element.placa
    n++;});
    
    // Poner la informacion en Un Objeto
    const data_User = {id_vehiculo,Placas,InfoUser};
  
    console.log('Placas',Placas);
    return res.render('formConsulta',{data:data_User});
};

module.exports = consultasCtr;