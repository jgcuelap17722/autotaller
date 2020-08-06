// console.log(data);
const { id_vehiculo, Placas } = data;

const input = document.getElementById("cbPlaca");

const awesomplete = new Awesomplete(input, { maxItems: 5 });
awesomplete.list = Placas;
document.getElementById('cbPlaca').addEventListener('awesomplete-selectcomplete', function () {
  // MOSTRAR UNA PRUEBA DE LO SELECCIONADO
  const i = Placas.indexOf(this.value);
  console.log('Seleccionaste esta placa', this.value, 'Con este id:', id_vehiculo[i]);

  $('#id_Vehiculo').val(id_vehiculo[i]);
  $('#Placa').val(this.value);
  $('#form-get').submit();
});
