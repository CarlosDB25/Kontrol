const { db } = require('./config');

// ================================================
// INICIALIZACIÓN Y MIGRACIÓN AUTOMÁTICA
// ================================================

const inicializarBaseDatos = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Verificar si ya existe la nueva estructura
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='productos'", [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          console.log('🔄 Creando nueva estructura de base de datos...');
          crearTablas()
            .then(() => crearIndices())
            .then(() => insertarDatosIniciales())
            .then(() => {
              console.log('✅ Base de datos inicializada correctamente');
              resolve(true);
            })
            .catch(reject);
        } else {
          console.log('✅ Base de datos actualizada y lista');
          resolve(true);
        }
      });
    });
  });
};

const crearTablas = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla productos simplificada
      db.run(`
        CREATE TABLE IF NOT EXISTS productos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE,
          miniatura TEXT,
          stock_actual INTEGER NOT NULL DEFAULT 0,
          activo BOOLEAN NOT NULL DEFAULT 1,
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Tabla movimientos
      db.run(`
        CREATE TABLE IF NOT EXISTS movimientos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida')),
          descripcion TEXT NOT NULL DEFAULT 'Movimiento',
          total_productos INTEGER NOT NULL DEFAULT 0,
          total_movimiento REAL NOT NULL DEFAULT 0,
          fecha DATE DEFAULT (date('now')),
          fecha_completa DATETIME DEFAULT CURRENT_TIMESTAMP,
          usuario TEXT DEFAULT 'sistema'
        );
      `);
      
      // Tabla detalle de movimientos
      db.run(`
        CREATE TABLE IF NOT EXISTS movimientos_detalle (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          movimiento_id INTEGER NOT NULL,
          producto_id INTEGER NOT NULL,
          cantidad INTEGER NOT NULL,
          precio_unitario REAL NOT NULL,
          subtotal REAL GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
          stock_anterior INTEGER NOT NULL,
          stock_nuevo INTEGER NOT NULL,
          FOREIGN KEY (movimiento_id) REFERENCES movimientos (id) ON DELETE CASCADE,
          FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT
        );
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('📋 Tablas creadas');
          resolve(true);
        }
      });
    });
  });
};

const crearIndices = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_detalle_producto ON movimientos_detalle(producto_id);`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_detalle_movimiento ON movimientos_detalle(movimiento_id);`, (err) => {
        if (err) reject(err);
        else {
          console.log('📊 Índices creados');
          resolve(true);
        }
      });
    });
  });
};

const insertarDatosIniciales = () => {
  return new Promise((resolve, reject) => {
    // Crear producto fijo "Gasto Externo"
    db.run(`
      INSERT OR IGNORE INTO productos (id, nombre, miniatura, stock_actual, activo) 
      VALUES (1, 'Gasto Externo', '../../assets/img/gasto.png', 1, 1)
    `, (err) => {
      if (err) reject(err);
      else {
        console.log('📦 Datos iniciales insertados');
        resolve(true);
      }
    });
  });
};

// Ejecutar inicialización al cargar el módulo
inicializarBaseDatos().catch(console.error);

module.exports = {
  inicializarBaseDatos
};
