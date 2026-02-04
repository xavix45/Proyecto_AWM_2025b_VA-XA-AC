const mongoose = require("mongoose");

const bdd_name = "FestiMap_DB";

const conectarBDD = async() =>{
    try{
        await mongoose.connect(`mongodb://localhost/${bdd_name}`);
        console.log(`Conexión a BDD ${bdd_name} exitosa`);
    }catch(err){
        console.log("Falló la conexión a la BDD " + err)
    } 
}

conectarBDD();