const pool = require('../database');

const checkListCtr = {};

checkListCtr.crearCheckList = async (req, res) => {
/*  En el req.body llega un array con 3 tipos de valores
    Tipo 1 : Siempre esta en la posision [0] y sera el "NRO_ORDEN"
    Tipo 2 : Siempre esta en la ultima posision del array y sera "MI DESCRIPCION"
    Tipo 3 : Siempre esta entre "NRO_ORDEN" y "MI DESCRIPCION"
    = es la descripcion del cliente y el Id de servicio que esta requiriendo */

  // ==> Recuperar los datos del usuario logeado.

  const idPerson = req.user.id_usuario;
  const { username } = req.user.username;
  const usuario = { idPerson, username };

  // === RECUPERAR SERVICIOS BUSCADOS O AGREGADOS :)
  /*         const SP_CheckList_find = await pool.query('SELECT id_check_list,  nombre_checklist FROM v_items_checlist_add_or_find');
        const Get_CheckList_Aux = SP_CheckList_find;

        let idCkecklist=[],
            nameCkecklist =[];
        let index = 0 
        Get_CheckList_Aux.forEach(element => {
            idCkecklist[index]     = element.id_check_list
            nameCkecklist[index] = element.nombre_checklist
            index++;
        });
        
        let Checklist_Aux = {id:idCkecklist,nombre:nameCkecklist}
        console.log('Get_CheckList_Aux',Checklist_Aux) */

    // === RECUPERAR DATOS DEL CUERPO DE ORDEN :)

            // ojo ARRAY.shift() elimina el primer elemento y lo retorna
            // ojo ARRAY.pop() elimina el ultimo elemento y lo retorna
        const   Infopedido          = Object.values(req.body),
                nro_orden           = Infopedido.shift(),   // extraer el nro_orden primero de un array
                id_user_asignado    = Infopedido.pop(),     // extraer el ultimo    
                MiObservacion       = Infopedido.pop();     // extraer el ultimo x2
    
        console.log('Infopedido',Infopedido);
        
        console.log('nro_orden',nro_orden,'MiObservacion',MiObservacion)
        let Observacion_Cliente =[],ID_Servicio =[];
        
        for (let i = 0; i <= Infopedido.length-1; i++) {
            if(i%2 == 0){
                ID_Servicio[ID_Servicio.length] = Infopedido[i];
            }else{
                Observacion_Cliente[Observacion_Cliente.length] = Infopedido[i];
            }
        }
        console.log('ID_Servicio,Observacion_Cliente = ',ID_Servicio,Observacion_Cliente)

    // === RECUPERAR PLACA ATRAVEZ DE SU NUMERO DE ORDEN :)
        const placa_recuperada = await pool.query("CALL SP_FN_GET_placa_orden('"+nro_orden+"')");
        const {placa} = placa_recuperada[0];
        console.log('placa_recuperada = ',placa)

    // === CONSULTAR SI EXISTE EL DETALLE PEDIDO PARA ESE CHECKLIST :) para que no se repita el pedido al recargar la pagina
        const Consulta_id_DetallePedido = await pool.query("select id_detallePedido as id_DetallePedido from tdetallepedido where nro_orden = '"+nro_orden+"'");
        const {id_DetallePedido} = Consulta_id_DetallePedido[0];
        const Get_Existencia_pedido = await pool.query("CALL SP_FN_GET_pedido_Existente('"+id_DetallePedido+"')")
        const {existencia} = Get_Existencia_pedido[0][0];

        if(existencia != 0){ // Si existe algun dato
            await pool.query('DELETE FROM tpedido WHERE id_detallePedido = '+id_DetallePedido+'');
            for (let richar = 0; richar <= ID_Servicio.length-1; richar++) {
                await pool.query('CALL SP_NuevoPedido('+ID_Servicio[richar]+','+id_DetallePedido+',"'+Observacion_Cliente[richar]+'")');
            }
            await pool.query('UPDATE tdetallepedido SET id_usuario_asignado = '+id_user_asignado+',Detalle_usuario = "'+MiObservacion+'" WHERE id_detallePedido = '+id_DetallePedido+'')
        }else{ // no existe algun   
            for (let richar = 0; richar <= ID_Servicio.length-1; richar++) {
                await pool.query('CALL SP_NuevoPedido('+ID_Servicio[richar]+','+id_DetallePedido+',"'+Observacion_Cliente[richar]+'")');
            }
            await pool.query('UPDATE tdetallepedido SET id_usuario_asignado = '+id_user_asignado+',Detalle_usuario = "'+MiObservacion+'" WHERE id_detallePedido = '+id_DetallePedido+'')
        }
        console.log('Consulta_id_DetallePedido',id_DetallePedido)
    
    // === RECUPERAR LOS NOMBRES DE ITEMS POR DEFECTO DEL CHECKLIST
        /* const GET_Items_Checklist = await pool.query("SELECT id_check_list,nombre_checklist FROM v_items_checlist_default;");
        const Items_Checklist = GET_Items_Checklist;
        let id=[],
            Nombre=[],
            i = 0;
        Items_Checklist.forEach(element => {
            id[i]     = element.id_check_list
            Nombre[i] = element.nombre_checklist
        i++;
        });
        let Checklist = {id_check_list:id,nombre_checklist:Nombre}

        console.log('Lista de Checlist por defecto ',Checklist) */
    // RECUPERAR LOS DATOS DEL USUARIO ("CLIENTE") 
        const Sp_Pedido_Cliente = await pool.query("Call SP_cliente_de_Pedido_actual('"+id_DetallePedido+"')");
        const pedido_cliente = {nombre,telefono,vehiculo_marca,modelo,color} = Sp_Pedido_Cliente[0][0];
        console.log('pedido_cliente',pedido_cliente);

    //const data = {placa,nro_orden,usuario,pedido_cliente,Checklist,Checklist_Aux}
    const data = {placa,nro_orden,usuario,pedido_cliente}
    console.log('Todos los datos :',data)
    req.flash('messages','La orden se ha asignado Correctamente !')
    res.redirect('/profile');
    //res.render('../views/FormCkeckList',{crearCheckList:data}); 

}
module.exports = checkListCtr;