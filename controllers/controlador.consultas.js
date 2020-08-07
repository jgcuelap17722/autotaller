const helpers = require('../lib/helpers');
const Queries = require('../lib/Queries');

const consultasCtr = {};

consultasCtr.HacerConsulta = async (req, res) => {
// ESTA FUNCION RETORNA A LA VISTA "formConsulta" Placas y Ids de vehiculos
// --- Mis Variables ---
  const id_vehiculo = []; const Placas = [];
  const InfoUser = await helpers.InfoUser(req.user.id_usuario); // <== Info del Usuario

  // Consultar Las placas e id de Vehiculos
  const placasIdsVehiculos = await Queries.Placas_IDS_Vehiculos();
  // console.log('(CONSULTA)_Placas:', placasIdsVehiculos);

  // Ordenar ids de vehiculos y sus placas para el Combo
  let n = 0;
  placasIdsVehiculos.forEach((element) => {
    id_vehiculo[n] = element.id_vehiculo;
    Placas[n] = element.placa;
    n++;
  });

  // Poner la informacion en Un Objeto
  const data = { id_vehiculo, Placas, InfoUser };

  console.log('Placas', Placas);
  return res.render('formConsulta', { data:data });
};

module.exports = consultasCtr;
