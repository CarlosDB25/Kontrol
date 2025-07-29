const { db } = require('./config');

// ================================================
// FUNCIONES DE MOVIMIENTOS
// ================================================

const registrarMovimiento = (tipo, descripcion, productos) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Calcular total del movimiento
      const totalMovimiento = productos.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0);
      
      // 1. Crear el movimiento principal
      db.run(
        `INSERT INTO movimientos (tipo, descripcion, total_productos, total_movimiento) 
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
            // Insertar detalle del movimiento
            db.run(
              `INSERT INTO movimientos_detalle (movimiento_id, producto_id, cantidad, precio_unitario, stock_anterior, stock_nuevo) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [movimientoId, producto.producto_id, producto.cantidad, producto.precio_unitario, producto.stock_anterior, producto.stock_actual],
              function (detailErr) {
                if (detailErr) {
                  errores.push(detailErr);
                }
                
                // Actualizar stock del producto (solo si no es Gasto Externo)
                if (producto.producto_id !== 1) {
                  db.run(
                    `UPDATE productos SET stock_actual = ? WHERE id = ?`,
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
        m.id,
        m.tipo,
        m.descripcion,
        m.total_productos,
        m.total_movimiento,
        m.fecha,
        m.fecha_completa,
        GROUP_CONCAT(p.nombre, ', ') as productos_nombres,
        GROUP_CONCAT(md.cantidad, ', ') as cantidades,
        SUM(md.cantidad) as cantidad_total
      FROM movimientos m
      LEFT JOIN movimientos_detalle md ON m.id = md.movimiento_id
      LEFT JOIN productos p ON md.producto_id = p.id
      GROUP BY m.id
      ORDER BY m.fecha_completa DESC
    `, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const obtenerDetalleSalida = (movimientoId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        md.*,
        p.nombre as producto_nombre,
        md.precio_unitario,
        md.subtotal
      FROM movimientos_detalle md
      JOIN productos p ON md.producto_id = p.id
      WHERE md.movimiento_id = ?
      ORDER BY p.nombre
    `, [movimientoId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const eliminarSalida = (id) => {
  return new Promise((resolve, reject) => {
    // Primero obtener los detalles para restaurar el stock
    db.all(`
      SELECT md.*, m.tipo 
      FROM movimientos_detalle md 
      JOIN movimientos m ON md.movimiento_id = m.id 
      WHERE m.id = ?
    `, [id], (err, detalles) => {
      if (err) {
        reject(err);
        return;
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Restaurar stocks para productos (excepto Gasto Externo)
        let procesados = 0;
        let errores = [];
        
        if (detalles.length === 0) {
          // Si no hay detalles, solo eliminar el movimiento
          db.run(`DELETE FROM movimientos WHERE id = ?`, [id], function (delErr) {
            if (delErr) {
              db.run('ROLLBACK');
              reject(delErr);
            } else {
              db.run('COMMIT');
              resolve(true);
            }
          });
          return;
        }
        
        detalles.forEach((detalle) => {
          if (detalle.producto_id !== 1) { // No restaurar stock de Gasto Externo
            // Restaurar stock según el tipo de movimiento
            const nuevoStock = detalle.tipo === 'entrada' 
              ? detalle.stock_anterior  // Si era entrada, volver al stock anterior
              : detalle.stock_anterior; // Si era salida, volver al stock anterior
              
            db.run(
              `UPDATE productos SET stock_actual = ? WHERE id = ?`,
              [nuevoStock, detalle.producto_id],
              function (updateErr) {
                if (updateErr) {
                  errores.push(updateErr);
                }
                
                procesados++;
                
                if (procesados === detalles.length) {
                  if (errores.length > 0) {
                    db.run('ROLLBACK');
                    reject(new Error(`Errores restaurando stock: ${errores.map(e => e.message).join(', ')}`));
                  } else {
                    // Eliminar el movimiento (CASCADE eliminará los detalles)
                    db.run(`DELETE FROM movimientos WHERE id = ?`, [id], function (delErr) {
                      if (delErr) {
                        db.run('ROLLBACK');
                        reject(delErr);
                      } else {
                        db.run('COMMIT');
                        resolve(true);
                      }
                    });
                  }
                }
              }
            );
          } else {
            procesados++;
            if (procesados === detalles.length) {
              // Eliminar el movimiento
              db.run(`DELETE FROM movimientos WHERE id = ?`, [id], function (delErr) {
                if (delErr) {
                  db.run('ROLLBACK');
                  reject(delErr);
                } else {
                  db.run('COMMIT');
                  resolve(true);
                }
              });
            }
          }
        });
      });
    });
  });
};

// ================================================
// ACTUALIZAR DETALLE DE MOVIMIENTO
// ================================================

const actualizarDetalleMovimiento = (detalleId, nuevaCantidad, nuevoPrecio) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE movimientos_detalle 
       SET cantidad = ?, precio_unitario = ? 
       WHERE id = ?`,
      [nuevaCantidad, nuevoPrecio, detalleId],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error(`No se encontró el detalle de movimiento con ID ${detalleId}`));
          return;
        }
        
        resolve({ 
          success: true, 
          changes: this.changes,
          detalleId: detalleId 
        });
      }
    );
  });
};

// ================================================
// ACTUALIZAR TOTAL DE MOVIMIENTO
// ================================================

const actualizarTotalMovimiento = (movimientoId, nuevoTotal) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE movimientos 
       SET total_movimiento = ? 
       WHERE id = ?`,
      [nuevoTotal, movimientoId],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error(`No se encontró el movimiento con ID ${movimientoId}`));
          return;
        }
        
        resolve({ 
          success: true, 
          changes: this.changes,
          movimientoId: movimientoId,
          nuevoTotal: nuevoTotal 
        });
      }
    );
  });
};

module.exports = {
  registrarMovimiento,
  obtenerMovimientos,
  obtenerDetalleSalida,
  eliminarSalida,
  actualizarDetalleMovimiento,
  actualizarTotalMovimiento
};
