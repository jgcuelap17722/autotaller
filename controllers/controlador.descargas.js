const pool = require('../database');
const DescargasCtrl = {}

DescargasCtrl.GenerarDescarga = async (req,res,next) => {


    const id_person = req.user.id_usuario,
            username =  req.user.username,
            usuario = {id_person,username};


}
module.exports = checkListCtr;