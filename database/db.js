const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'kontrol.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Tabla de productos - Incluye precios pero no se muestran en la interfaz productos.html
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      miniatura TEXT,
      precio_compra REAL NOT NULL DEFAULT 0,
      precio_venta REAL NOT NULL DEFAULT 0,
      utilidad REAL GENERATED ALWAYS AS (precio_venta - precio_compra) STORED,
      stock INTEGER NOT NULL DEFAULT 0
    );
  `);
  
  // Migración: Si existe la estructura antigua con precio, migrar a la nueva
  db.all("PRAGMA table_info(productos)", [], (err, columns) => {
    if (err) {
      console.error('Error al verificar estructura de tabla:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const tieneColumnaPreicioAntiguo = columnNames.includes('precio');
    const tieneColumnasPrecioNuevo = columnNames.includes('precio_compra') && columnNames.includes('precio_venta');
    
    if (tieneColumnaPreicioAntiguo && !tieneColumnasPrecioNuevo) {
      console.log('Migrando tabla productos: de precio único a precios separados...');
      
      // Crear tabla temporal con la nueva estructura
      db.serialize(() => {
        db.run(`
          CREATE TABLE productos_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            miniatura TEXT,
            precio_compra REAL NOT NULL DEFAULT 0,
            precio_venta REAL NOT NULL DEFAULT 0,
            utilidad REAL GENERATED ALWAYS AS (precio_venta - precio_compra) STORED,
            stock INTEGER NOT NULL DEFAULT 0
          );
        `);
        
        // Copiar datos, usando el precio antiguo como precio_venta por defecto
        db.run(`
          INSERT INTO productos_temp (id, nombre, miniatura, precio_compra, precio_venta, stock)
          SELECT id, nombre, miniatura, 0, COALESCE(precio, 0), stock FROM productos;
        `);
        
        // Eliminar tabla original
        db.run(`DROP TABLE productos;`);
        
        // Renombrar tabla temporal
        db.run(`ALTER TABLE productos_temp RENAME TO productos;`, (err) => {
          if (err) {
            console.error('Error en migración:', err);
          } else {
            console.log('✅ Migración completada: estructura de precios actualizada');
          }
        });
      });
    }
  });

  // Migración: Verificar si existe la columna total_movimiento en salidas
  db.all("PRAGMA table_info(salidas)", [], (err, columns) => {
    if (err) {
      console.error('Error al verificar estructura de tabla salidas:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const tieneTotalMovimiento = columnNames.includes('total_movimiento');
    
    if (!tieneTotalMovimiento && columnNames.length > 0) {
      console.log('Migrando tabla salidas: agregando columna total_movimiento...');
      
      db.serialize(() => {
        db.run(`ALTER TABLE salidas ADD COLUMN total_movimiento REAL NOT NULL DEFAULT 0`, (err) => {
          if (err) {
            console.error('Error al agregar columna total_movimiento:', err);
          } else {
            console.log('✅ Migración completada: columna total_movimiento agregada');
          }
        });
      });
    }
  });
  
  // Tabla de salidas grupales (maneja entradas y salidas unificadamente)
  db.run(`
    CREATE TABLE IF NOT EXISTS salidas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL DEFAULT 'salida' CHECK(tipo IN ('entrada', 'salida')),
      descripcion TEXT NOT NULL DEFAULT 'Movimiento',
      total_productos INTEGER NOT NULL DEFAULT 0,
      total_movimiento REAL NOT NULL DEFAULT 0,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Tabla de detalle de salidas (productos específicos por salida)
  db.run(`
    CREATE TABLE IF NOT EXISTS salidas_detalle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salida_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL DEFAULT 0,
      subtotal REAL GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
      stock_anterior INTEGER NOT NULL,
      stock_actual INTEGER NOT NULL,
      FOREIGN KEY (salida_id) REFERENCES salidas (id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos (id)
    );
  `);
  
  // Crear producto fijo "Gasto Externo" con ID=1 si no existe
  db.run(`
    INSERT OR IGNORE INTO productos (id, nombre, miniatura, precio_compra, precio_venta, stock) 
    VALUES (1, 'Gasto Externo', '../../assets/img/gasto.png', 0, 0, 1)
  `);
  
  // Actualizar la imagen del Gasto Externo si ya existe pero no tiene imagen
  db.run(`
    UPDATE productos 
    SET miniatura = '../../assets/img/gasto.png' 
    WHERE id = 1 AND (miniatura IS NULL OR miniatura = '')
  `);
});

const insertarProducto = (nombre, miniatura = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO productos (nombre, miniatura, precio_compra, precio_venta, stock) VALUES (?, ?, 0, 0, 0)`,
      [nombre, miniatura],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const obtenerProductos = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM productos`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const eliminarProducto = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM productos WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

const actualizarProducto = (id, nombre, miniatura = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE productos SET nombre = ?, miniatura = ? WHERE id = ?`,
      [nombre, miniatura, id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

// ==========================================
// FUNCIONES DE MOVIMIENTOS GRUPALES UNIFICADOS
// ==========================================

const registrarMovimiento = (tipo, descripcion, productos) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Calcular total del movimiento
      const totalMovimiento = productos.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0);
      
      // 1. Crear el movimiento principal
      db.run(
        `INSERT INTO salidas (tipo, descripcion, total_productos, total_movimiento) 
         VALUES (?, ?, ?, ?)`,
        [tipo, descripcion, productos.length, totalMovimiento],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          const movimientoId = this.lastID;
          let procesados = 0;
          let errores = [];
          
          // 2. Registrar cada producto en el movimiento
          productos.forEach((producto) => {
            // Insertar detalle del movimiento con precio
            db.run(
              `INSERT INTO salidas_detalle (salida_id, producto_id, cantidad, precio_unitario, stock_anterior, stock_actual) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [movimientoId, producto.producto_id, producto.cantidad, producto.precio_unitario, producto.stock_anterior, producto.stock_actual],
              function (detailErr) {
                if (detailErr) {
                  errores.push(detailErr);
                }
                
                // Actualizar stock del producto (solo si no es Gasto Externo)
                if (producto.producto_id !== 1) {
                  db.run(
                    `UPDATE productos SET stock = ? WHERE id = ?`,
                    [producto.stock_actual, producto.producto_id],
                    function (updateErr) {
                      if (updateErr) {
                        errores.push(updateErr);
                      }
                      
                      procesados++;
                      
                      // Cuando todos estén procesados
                      if (procesados === productos.length) {
                        if (errores.length > 0) {
                          db.run('ROLLBACK');
                          reject(new Error(`Errores en el procesamiento: ${errores.map(e => e.message).join(', ')}`));
                        } else {
                          db.run('COMMIT');
                          resolve(movimientoId);
                        }
                      }
                    }
                  );
                } else {
                  // Para Gasto Externo no actualizar stock
                  procesados++;
                  if (procesados === productos.length) {
                    if (errores.length > 0) {
                      db.run('ROLLBACK');
                      reject(new Error(`Errores en el procesamiento: ${errores.map(e => e.message).join(', ')}`));
                    } else {
                      db.run('COMMIT');
                      resolve(movimientoId);
                    }
                  }
                }
              }
            );
          });
        }
      );
    });
  });
};

const obtenerMovimientos = () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        s.id,
        s.tipo,
        s.descripcion,
        s.total_productos,
        s.total_movimiento,
        s.fecha,
        GROUP_CONCAT(p.nombre, ', ') as productos_nombres,
        GROUP_CONCAT(sd.cantidad, ', ') as cantidades,
        SUM(sd.cantidad) as cantidad_total
      FROM salidas s
      LEFT JOIN salidas_detalle sd ON s.id = sd.salida_id
      LEFT JOIN productos p ON sd.producto_id = p.id
      GROUP BY s.id
      ORDER BY s.fecha DESC
    `, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Nueva función para filtrar movimientos por producto
const obtenerMovimientosPorProducto = (productoId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT DISTINCT
        s.id,
        s.tipo,
        s.descripcion,
        s.total_productos,
        s.observaciones,
        s.fecha,
        GROUP_CONCAT(p.nombre, ', ') as productos_nombres,
        GROUP_CONCAT(sd.cantidad, ', ') as cantidades,
        SUM(sd.cantidad) as cantidad_total
      FROM salidas s
      INNER JOIN salidas_detalle sd ON s.id = sd.salida_id
      INNER JOIN productos p ON sd.producto_id = p.id
      WHERE s.id IN (
        SELECT DISTINCT salida_id 
        FROM salidas_detalle 
        WHERE producto_id = ?
      )
      GROUP BY s.id
      ORDER BY s.fecha DESC
    `, [productoId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const obtenerDetalleSalida = (salidaId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        sd.*,
        p.nombre as producto_nombre,
        sd.precio_unitario,
        sd.subtotal
      FROM salidas_detalle sd
      JOIN productos p ON sd.producto_id = p.id
      WHERE sd.salida_id = ?
      ORDER BY p.nombre
    `, [salidaId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

const actualizarStock = (id, nuevoStock) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE productos SET stock = ? WHERE id = ?`,
      [nuevoStock, id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

const eliminarSalida = (id) => {
  return new Promise((resolve, reject) => {
    // El CASCADE en la foreign key se encargará de eliminar los detalles
    db.run(`DELETE FROM salidas WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// ==========================================
// FUNCIONES DE GESTIÓN DE PRECIOS
// ==========================================

const actualizarPrecios = (id, precio_compra, precio_venta) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE productos SET precio_compra = ?, precio_venta = ? WHERE id = ?`,
      [precio_compra, precio_venta, id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

const obtenerProductosConPrecios = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, nombre, miniatura, precio_compra, precio_venta, utilidad, stock FROM productos`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ==========================================
// FUNCIONES DE ACTUALIZACIÓN DE MOVIMIENTOS
// ==========================================

const actualizarDetalleMovimiento = (detalleId, cantidad, precioUnitario) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE salidas_detalle SET cantidad = ?, precio_unitario = ? WHERE id = ?`,
      [cantidad, precioUnitario, detalleId],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

const actualizarTotalMovimiento = (movimientoId, nuevoTotal) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE salidas SET total_movimiento = ? WHERE id = ?`,
      [nuevoTotal, movimientoId],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

module.exports = {
  // Funciones de productos
  insertarProducto,
  obtenerProductos,
  eliminarProducto,
  actualizarProducto,
  actualizarStock,
  
  // Funciones de precios (para uso en otro módulo)
  actualizarPrecios,
  obtenerProductosConPrecios,
  
  // Funciones de movimientos unificados
  registrarMovimiento,
  obtenerMovimientos,
  obtenerMovimientosPorProducto,
  obtenerDetalleSalida,
  eliminarSalida,
  
  // Funciones de actualización de movimientos
  actualizarDetalleMovimiento,
  actualizarTotalMovimiento
};
