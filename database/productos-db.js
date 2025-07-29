const { db } = require('./config');

// ================================================
// FUNCIONES DE PRODUCTOS
// ================================================

const insertarProducto = (nombre, miniatura = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO productos (nombre, miniatura, stock_actual) VALUES (?, ?, 0)`,
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
    db.all(`SELECT * FROM productos WHERE activo = 1 ORDER BY nombre`, [], (err, rows) => {
      if (err) reject(err);
      else {
        // Mapear para compatibilidad con código existente
        const productosCompatibles = rows.map(row => ({
          id: row.id,
          nombre: row.nombre,
          miniatura: row.miniatura,
          stock: row.stock_actual // Mantener nombre original para compatibilidad
        }));
        resolve(productosCompatibles);
      }
    });
  });
};

const obtenerProductoPorId = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM productos WHERE id = ? AND activo = 1`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const eliminarProducto = (id) => {
  return new Promise((resolve, reject) => {
    // Soft delete - marcar como inactivo en lugar de eliminar
    db.run(`UPDATE productos SET activo = 0 WHERE id = ?`, [id], function (err) {
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

const actualizarStock = (id, nuevoStock) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE productos SET stock_actual = ? WHERE id = ?`,
      [nuevoStock, id],
      function (err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

// ================================================
// FUNCIÓN DE RESUMEN RÁPIDO PARA EL MENÚ
// ================================================

const obtenerResumenRapido = () => {
  return new Promise((resolve, reject) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    // Consulta para obtener todos los datos del resumen
    db.all(`
      SELECT 
        (SELECT COUNT(*) FROM productos WHERE activo = 1) as total_productos,
        (SELECT COALESCE(SUM(stock_actual), 0) FROM productos WHERE activo = 1) as stock_total,
        (SELECT COUNT(*) FROM movimientos WHERE DATE(fecha) = ?) as movimientos_hoy
    `, [fechaHoy], (err, rows) => {
      if (err) {
        console.error('Error al obtener resumen rápido:', err);
        reject(err);
      } else {
        const resumen = rows[0] || { total_productos: 0, stock_total: 0, movimientos_hoy: 0 };
        resolve({
          totalProductos: resumen.total_productos,
          stockTotal: resumen.stock_total,
          movimientosHoy: resumen.movimientos_hoy
        });
      }
    });
  });
};

module.exports = {
  insertarProducto,
  obtenerProductos,
  obtenerProductoPorId,
  eliminarProducto,
  actualizarProducto,
  actualizarStock,
  obtenerResumenRapido
};
