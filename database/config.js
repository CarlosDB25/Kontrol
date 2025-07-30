const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Función para obtener la ruta correcta de la base de datos
function getDbPath() {
  // Si estamos en una aplicación empaquetada
  if (process.env.NODE_ENV === 'production' || process.resourcesPath) {
    // Usar la carpeta de datos del usuario
    const os = require('os');
    const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Kontrol');
    
    // Crear la carpeta si no existe
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    const dbPath = path.join(userDataPath, 'kontrol.db');
    
    // Si la base de datos no existe en el directorio del usuario, copiarla desde los recursos
    if (!fs.existsSync(dbPath)) {
      try {
        // Intentar copiar desde la carpeta de recursos empaquetados
        const sourceDbPath = path.join(process.resourcesPath, 'app', 'database', 'kontrol.db');
        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, dbPath);
        } else {
          // Si no está ahí, copiar desde la ubicación de desarrollo (fallback)
          const devDbPath = path.join(__dirname, 'kontrol.db');
          if (fs.existsSync(devDbPath)) {
            fs.copyFileSync(devDbPath, dbPath);
          }
        }
      } catch (error) {
        console.log('Error copiando base de datos:', error);
      }
    }
    
    return dbPath;
  } else {
    // En desarrollo, usar la ubicación normal
    return path.join(__dirname, 'kontrol.db');
  }
}

const dbPath = getDbPath();
const db = new sqlite3.Database(dbPath);

module.exports = { db, dbPath };
