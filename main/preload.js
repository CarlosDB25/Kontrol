const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Funciones de productos
  obtenerProductos: () => ipcRenderer.invoke('productos:obtener'),
  agregarProducto: (producto) => ipcRenderer.invoke('productos:agregar', producto),
  eliminarProducto: (id) => ipcRenderer.invoke('productos:eliminar', id),
  editarProducto: (producto) => ipcRenderer.invoke('productos:editar', producto),
  
  // Funciones de movimientos unificados
  registrarMovimiento: (movimiento) => ipcRenderer.invoke('movimientos:registrar', movimiento),
  obtenerMovimientos: () => ipcRenderer.invoke('movimientos:obtener'),
  eliminarMovimiento: (id) => ipcRenderer.invoke('movimientos:eliminar', id),
  actualizarMovimiento: (movimientoId, detalle) => ipcRenderer.invoke('movimientos:actualizar', movimientoId, detalle),
  obtenerDetalleSalida: (movimientoId) => ipcRenderer.invoke('movimientos:obtenerDetalle', movimientoId),
  obtenerMovimientosPorProducto: (productoId) => ipcRenderer.invoke('movimientos:obtenerPorProducto', productoId)
});

// API adicional para navegación
contextBridge.exposeInMainWorld('electronAPI', {
  loadPage: (page) => ipcRenderer.invoke('navigate-to', page),
  obtenerResumenRapido: () => ipcRenderer.invoke('obtener-resumen-rapido'),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
