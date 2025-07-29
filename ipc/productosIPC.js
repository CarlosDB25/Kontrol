const { ipcMain } = require('electron');
const db = require('../database/db.js');

ipcMain.handle('productos:obtener', async () => {
  return await db.obtenerProductos();
});

ipcMain.handle('productos:agregar', async (event, producto) => {
  const { nombre, miniatura } = producto;
  return await db.insertarProducto(nombre, miniatura);
});

ipcMain.handle('productos:eliminar', async (event, id) => {
  return await db.eliminarProducto(id);
});

ipcMain.handle('productos:editar', async (event, producto) => {
  const { id, nombre, miniatura } = producto;
  return await db.actualizarProducto(id, nombre, miniatura);
});

// Resumen rápido para el menú principal
ipcMain.handle('obtener-resumen-rapido', async () => {
  return await db.obtenerResumenRapido();
});
