// ================================================
// MÓDULO PRINCIPAL DE BASE DE DATOS REFACTORIZADO
// ================================================

// Importar módulos especializados
const { inicializarBaseDatos } = require('./init');
const productos = require('./productos-db');
const movimientos = require('./movimientos-db');
const reportes = require('./reportes-db');

// ================================================
// EXPORTACIONES UNIFICADAS
// ================================================

module.exports = {
  // Funciones de inicialización
  inicializarBaseDatos,
  
  // Funciones de productos
  insertarProducto: productos.insertarProducto,
  obtenerProductos: productos.obtenerProductos,
  obtenerProductoPorId: productos.obtenerProductoPorId,
  eliminarProducto: productos.eliminarProducto,
  actualizarProducto: productos.actualizarProducto,
  actualizarStock: productos.actualizarStock,
  obtenerResumenRapido: productos.obtenerResumenRapido,
  
  // Funciones de movimientos
  registrarMovimiento: movimientos.registrarMovimiento,
  obtenerMovimientos: movimientos.obtenerMovimientos,
  obtenerDetalleSalida: movimientos.obtenerDetalleSalida,
  eliminarSalida: movimientos.eliminarSalida,
  actualizarDetalleMovimiento: movimientos.actualizarDetalleMovimiento,
  actualizarTotalMovimiento: movimientos.actualizarTotalMovimiento,
  
  // Funciones de reportes
  obtenerReporteDiario: reportes.obtenerReporteDiario,
  obtenerReporteMensual: reportes.obtenerReporteMensual,
  obtenerHistorialProducto: reportes.obtenerHistorialProducto,
  obtenerProductosReportes: reportes.obtenerProductos,
  
  // Funciones de compatibilidad (mantenidas para transición)
  obtenerProductosConPrecios: productos.obtenerProductos
};
