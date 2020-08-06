// Autocompletado ==> TIPO VEHICULO
// - variables
// AWSTipoVehiculo = new Awesomplete(inputTipoVehiculo, {
//     maxItems: 5,
//     filter: Awesomplete.FILTER_STARTSWITH,
//     list: "#mylist"
// });
// let val_select_marca;
// - accion click obcion
const imgLista = [
  "http://www.maglioccola.com/images/add-1.png",
  "http://www.maglioccola.com/images/add-2.png",
  "http://www.maglioccola.com/images/add-3.png",
  "http://www.maglioccola.com/images/add-4.png"
];
const rows = [
  {
    idTipoVehiculo: 1,
    nombreTipoVehiculo: "@CAM%%",
    imgTipoVehiculo: "http://www.maglioccola.com/images/add-1.png"
  },
  {
    idTipoVehiculo: 2,
    nombreTipoVehiculo: "pickup",
    imgTipoVehiculo: "http://www.maglioccola.com/images/add-2.png"
  }
];
console.log("MI ENTRADA ", rows);
const Tipos = {};
const nombres = [];

for (let index = 0; index < rows.length; index++) {
  Tipos[rows[index].nombreTipoVehiculo] = rows[index].imgTipoVehiculo;
  nombres[index] = rows[index].nombreTipoVehiculo;
}
console.log("Salida Objeto", Tipos);
const imgList = {
  Camioneta: "http://www.maglioccola.com/images/add-1.png",
  pickup: "http://www.maglioccola.com/images/add-2.png",
  band: "http://www.maglioccola.com/images/add-3.png",
  "4x4": "http://www.maglioccola.com/images/add-4.png",
  lista_url: imgLista
};

const input = document.getElementById("id_tipoVehiculo");

function createItem(text) {
  const img = document.createElement("img");
  img.style.height = "20px";
  img.src = Tipos[text];
  const html = `${img.outerHTML} - ${text}`;
  return html;
}

function myItemFunc(pText) {
  return Awesomplete.$.create("li", {
    innerHTML: createItem(pText),
    "aria-selected": "false"
  });
}

const awesomplete = new Awesomplete(input, {
  item: myItemFunc,
  list: nombres
});
