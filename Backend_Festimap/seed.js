
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Importar Modelos
const { Evento, Usuario } = require('./models');

const DB_NAME = "FestiMap_DB";
const MONGO_URI = `mongodb://localhost/${DB_NAME}`;

// Nueva lógica de rutas basada en tu estructura real:
// Backend está en: .../Proyecto_AWM_2025b_VA-XA-AC/Backend_Festimap
// db.json está en: .../Proyecto_AWM_2025b_VA-XA-AC/MyApp-FestiMap/db.json
const pathsToTry = [
  path.join(__dirname, '../MyApp-FestiMap/db.json'), // Ruta detectada por tu terminal
  path.join(__dirname, 'db.json'),                  // Por si acaso está local
  path.join(__dirname, '../db.json'),               // Por si acaso está en la raíz
];

let dbPath = null;
for (const p of pathsToTry) {
  if (fs.existsSync(p)) {
    dbPath = p;
    break;
  }
}

const seedDB = async () => {
  try {
    console.log("-----------------------------------------");
    console.log("🧪 INICIANDO MIGRACIÓN A MONGODB...");
    
    if (!dbPath) {
      console.error("❌ ERROR: No se encontró el archivo 'db.json'.");
      console.log("Se buscó en:");
      pathsToTry.forEach(p => console.log(` - ${p}`));
      return;
    }

    console.log(`📂 ¡Archivo encontrado!: ${dbPath}`);

    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB.");

    // 1. Leer db.json
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(rawData);

    // 2. Limpiar colecciones actuales
    await Evento.deleteMany({});
    await Usuario.deleteMany({});
    console.log("🧹 Base de datos limpiada.");

    // 3. Migrar Usuarios (Cifrando contraseñas)
    console.log("👤 Migrando usuarios...");
    const usuariosMigrados = await Promise.all(data.usuarios.map(async (u) => {
      const salt = await bcrypt.genSalt(10);
      const passOriginal = u.contra || u.password || "12345678";
      const hashedPassword = await bcrypt.hash(passOriginal, salt);
      
      return {
        nombre: u.nombre,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        tipoViajero: u.tipoViajero || 'turista',
        rol: u.email.includes('admin') ? 'admin' : 'user'
      };
    }));
    await Usuario.insertMany(usuariosMigrados);
    console.log(`✅ ${usuariosMigrados.length} usuarios migrados.`);

    // 4. Migrar Eventos
    console.log("🎉 Migrando eventos...");
    const eventosMigrados = data.eventos.map(e => {
      const { id, ...resto } = e; 
      return {
        ...resto,
        status: e.status || 'approved',
        visitas: Math.floor(Math.random() * 100) + 10, 
        asistencias: Math.floor(Math.random() * 50) + 5
      };
    });
    await Evento.insertMany(eventosMigrados);
    console.log(`✅ ${eventosMigrados.length} eventos migrados.`);

    console.log("-----------------------------------------");
    console.log("🚀 ¡MIGRACIÓN COMPLETADA CON ÉXITO!");
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("❌ ERROR DURANTE LA MIGRACIÓN:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();
