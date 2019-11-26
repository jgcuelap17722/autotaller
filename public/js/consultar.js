console.log(data)

const id_vehiculo = data.id_vehiculo,Placas = data.Placas;

var input = document.getElementById("cbPlaca");

var awesomplete = new Awesomplete(input, { maxItems: 5 });
awesomplete.list = Placas;
document.getElementById('cbPlaca').addEventListener('awesomplete-selectcomplete', function () {
    let i = Placas.indexOf(this.value);
    console.log('Seleccionaste esta placa', this.value, 'Con este id:', id_vehiculo[i])
    $('#id_Vehiculo').val(id_vehiculo[i])
    $('#Placa').val(this.value)
    $('#form-get').submit();
});

