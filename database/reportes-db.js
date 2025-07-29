const { db } = require('./config');

// Obtener reporte diario
async function obtenerReporteDiario(fecha) {
  return new Promise((resolve, reject) => {
    console.log('📅 Obteniendo reporte diario para:', fecha);
    
    // Reporte detallado por producto
    db.all(`
      SELECT 
        p.id,
        p.nombre as producto_nombre,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN md.cantidad ELSE 0 END), 0) as unidades_vendidas,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN md.precio_unitario * md.cantidad ELSE 0 END), 0) as total_ventas,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN md.cantidad ELSE 0 END), 0) as unidades_compradas,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN md.precio_unitario * md.cantidad ELSE 0 END), 0) as total_compras,
        p.stock_actual as stock_actual
      FROM productos p
      LEFT JOIN movimientos_detalle md ON p.id = md.producto_id
      LEFT JOIN movimientos m ON md.movimiento_id = m.id AND DATE(m.fecha) = ?
      WHERE EXISTS (
        SELECT 1 FROM movimientos_detalle md2 
        JOIN movimientos m2 ON md2.movimiento_id = m2.id 
        WHERE md2.producto_id = p.id AND DATE(m2.fecha) = ?
      )
      GROUP BY p.id, p.nombre, p.stock_actual
      ORDER BY total_ventas DESC
    `, [fecha, fecha], (err, rows) => {
      if (err) {
        console.error('❌ Error en obtenerReporteDiario:', err);
        reject(err);
        return;
      }
      
      // Calcular utilidad para cada producto
      const reporteConUtilidad = rows.map(item => ({
        ...item,
        utilidad_dia: item.total_ventas - item.total_compras
      }));
      
      // Resumen del día
      const resumen = {
        totalVentas: reporteConUtilidad.reduce((sum, item) => sum + item.total_ventas, 0),
        totalCompras: reporteConUtilidad.reduce((sum, item) => sum + item.total_compras, 0),
        utilidadTotal: reporteConUtilidad.reduce((sum, item) => sum + item.utilidad_dia, 0),
        productosConActividad: reporteConUtilidad.length
      };
      
      resolve({ reporte: reporteConUtilidad, resumen });
    });
  });
}

// Obtener reporte mensual
async function obtenerReporteMensual(año, mes) {
  return new Promise((resolve, reject) => {
    console.log('📈 Obteniendo reporte mensual para:', año, mes);
    
    const fechaInicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
    const fechaFin = año && mes < 12 ? 
      `${año}-${(mes + 1).toString().padStart(2, '0')}-01` : 
      `${año + 1}-01-01`;
    
    // Reporte mensual por producto
    db.all(`
      SELECT 
        p.id,
        p.nombre as producto_nombre,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN md.cantidad ELSE 0 END), 0) as unidades_vendidas_mes,
        COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN md.precio_unitario * md.cantidad ELSE 0 END), 0) as total_ventas_mes,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN md.cantidad ELSE 0 END), 0) as unidades_compradas_mes,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN md.precio_unitario * md.cantidad ELSE 0 END), 0) as total_compras_mes,
        COUNT(DISTINCT CASE WHEN m.tipo = 'salida' THEN DATE(m.fecha) END) as dias_con_ventas,
        COUNT(DISTINCT CASE WHEN m.tipo = 'entrada' THEN DATE(m.fecha) END) as dias_con_compras,
        p.stock_actual as stock_actual
      FROM productos p
      LEFT JOIN movimientos_detalle md ON p.id = md.producto_id
      LEFT JOIN movimientos m ON md.movimiento_id = m.id 
        AND m.fecha >= ? AND m.fecha < ?
      WHERE EXISTS (
        SELECT 1 FROM movimientos_detalle md2 
        JOIN movimientos m2 ON md2.movimiento_id = m2.id 
        WHERE md2.producto_id = p.id 
        AND m2.fecha >= ? AND m2.fecha < ?
      )
      GROUP BY p.id, p.nombre, p.stock_actual
      ORDER BY total_ventas_mes DESC
    `, [fechaInicio, fechaFin, fechaInicio, fechaFin], (err, rows) => {
      if (err) {
        console.error('❌ Error en obtenerReporteMensual:', err);
        reject(err);
        return;
      }
      
      // Calcular utilidad mensual
      const reporteConUtilidad = rows.map(item => ({
        ...item,
        utilidad_mes: item.total_ventas_mes - item.total_compras_mes
      }));
      
      // Resumen mensual
      const resumen = {
        totalVentas: reporteConUtilidad.reduce((sum, item) => sum + item.total_ventas_mes, 0),
        totalCompras: reporteConUtilidad.reduce((sum, item) => sum + item.total_compras_mes, 0),
        utilidadTotal: reporteConUtilidad.reduce((sum, item) => sum + item.utilidad_mes, 0),
        productosConActividad: reporteConUtilidad.length
      };
      
      // Días con actividad
      db.all(`
        SELECT 
          DATE(m.fecha) as fecha,
          COUNT(DISTINCT md.producto_id) as productos_diferentes,
          COALESCE(SUM(CASE WHEN m.tipo = 'salida' THEN md.precio_unitario * md.cantidad ELSE 0 END), 0) as ventas_dia,
          COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN md.precio_unitario * md.cantidad ELSE 0 END), 0) as compras_dia
        FROM movimientos m
        JOIN movimientos_detalle md ON m.id = md.movimiento_id
        WHERE m.fecha >= ? AND m.fecha < ?
        GROUP BY DATE(m.fecha)
        ORDER BY fecha DESC
      `, [fechaInicio, fechaFin], (err2, diasActividad) => {
        if (err2) {
          console.error('❌ Error obteniendo días actividad:', err2);
          reject(err2);
          return;
        }
        
        // Calcular utilidad por día
        const diasConUtilidad = diasActividad.map(dia => ({
          ...dia,
          utilidad_dia: dia.ventas_dia - dia.compras_dia
        }));
        
        resolve({ 
          reporte: reporteConUtilidad, 
          resumen, 
          diasActividad: diasConUtilidad 
        });
      });
    });
  });
}

// Obtener historial de producto
async function obtenerHistorialProducto(productoId, fechaInicio = null, fechaFin = null) {
  return new Promise((resolve, reject) => {
    console.log('📦 Obteniendo historial para producto:', productoId);
    
    let query = `
      SELECT 
        DATE(m.fecha) as fecha,
        m.tipo,
        md.cantidad,
        md.precio_unitario,
        (md.precio_unitario * md.cantidad) as subtotal,
        m.descripcion,
        md.stock_anterior,
        md.stock_nuevo
      FROM movimientos m
      JOIN movimientos_detalle md ON m.id = md.movimiento_id
      WHERE md.producto_id = ?
    `;
    
    const params = [productoId];
    
    if (fechaInicio) {
      query += ' AND m.fecha >= ?';
      params.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ' AND m.fecha <= ?';
      params.push(fechaFin);
    }
    
    query += ' ORDER BY m.fecha DESC, m.id DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Error en obtenerHistorialProducto:', err);
        reject(err);
        return;
      }
      
      resolve(rows);
    });
  });
}

// Obtener productos para selector
async function obtenerProductos() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, nombre FROM productos WHERE activo = 1 ORDER BY nombre', [], (err, rows) => {
      if (err) {
        console.error('❌ Error obteniendo productos:', err);
        reject(err);
        return;
      }
      
      resolve(rows);
    });
  });
}

module.exports = {
  obtenerReporteDiario,
  obtenerReporteMensual,
  obtenerHistorialProducto,
  obtenerProductos
};