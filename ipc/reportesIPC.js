const { ipcMain } = require('electron');
const { obtenerReporteDiario, obtenerReporteMensual, obtenerHistorialProducto, obtenerProductos } = require('../database/reportes-db');

// Reporte diario
ipcMain.handle('obtener-reporte-diario', async (event, fecha) => {
  try {
    console.log('📅 IPC: Obteniendo reporte diario para:', fecha);
    const reporte = await obtenerReporteDiario(fecha);
    return { success: true, data: reporte };
  } catch (error) {
    console.error('❌ Error en reporte diario:', error);
    return { success: false, error: error.message };
  }
});

// Reporte mensual
ipcMain.handle('obtener-reporte-mensual', async (event, año, mes) => {
  try {
    console.log('📈 IPC: Obteniendo reporte mensual para:', año, mes);
    const reporte = await obtenerReporteMensual(año, mes);
    return { success: true, data: reporte };
  } catch (error) {
    console.error('❌ Error en reporte mensual:', error);
    return { success: false, error: error.message };
  }
});

// Historial de producto
ipcMain.handle('obtener-historial-producto', async (event, productoId, fechaInicio, fechaFin) => {
  try {
    console.log('📦 IPC: Obteniendo historial de producto:', productoId);
    const historial = await obtenerHistorialProducto(productoId, fechaInicio, fechaFin);
    return { success: true, data: historial };
  } catch (error) {
    console.error('❌ Error en historial producto:', error);
    return { success: false, error: error.message };
  }
});

// Obtener productos para selector
ipcMain.handle('obtener-productos-selector', async (event) => {
  try {
    console.log('📦 IPC: Obteniendo productos para selector');
    const productos = await obtenerProductos();
    return { success: true, data: productos };
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    return { success: false, error: error.message };
  }
});

console.log('✅ IPC Reportes registrado');