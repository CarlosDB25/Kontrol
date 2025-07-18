const { ipcMain } = require('electron');
const db = require('../database/db.js');

// ==========================================
// HANDLERS DE MOVIMIENTOS GRUPALES UNIFICADOS
// ==========================================

ipcMain.handle('movimientos:registrar', async (event, movimiento) => {
  const { tipo, descripcion, productos } = movimiento;
  
  try {
    // Validar que todos los productos tengan stock suficiente (para salidas)
    const productosDB = await db.obtenerProductos();
    const productosConStock = [];
    
    for (const item of productos) {
      const producto = productosDB.find(p => p.id === item.producto_id);
      
      // Verificar que el producto existe (excepto Gasto Externo que siempre está disponible)
      if (!producto && item.producto_id !== 1) {
        throw new Error(`Producto con ID ${item.producto_id} no encontrado`);
      }
      
      let stockAnterior = producto ? producto.stock : 1; // Gasto Externo siempre tiene stock 1
      let stockActual;
      
      if (tipo === 'entrada') {
        stockActual = stockAnterior + item.cantidad;
      } else if (tipo === 'salida') {
        if (item.producto_id !== 1 && stockAnterior < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto.nombre}. Stock actual: ${stockAnterior}, solicitado: ${item.cantidad}`);
        }
        stockActual = item.producto_id === 1 ? 1 : stockAnterior - item.cantidad;
      } else {
        throw new Error('Tipo de movimiento no válido. Debe ser "entrada" o "salida"');
      }
      
      productosConStock.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        stock_anterior: stockAnterior,
        stock_actual: stockActual
      });
    }
    
    // Registrar el movimiento grupal usando la función unificada
    const movimientoId = await db.registrarMovimiento(
      tipo,
      descripcion, 
      productosConStock
    );
    
    return {
      id: movimientoId,
      tipo: tipo,
      productos: productosConStock,
      success: true
    };
    
  } catch (error) {
    console.error(`Error al registrar ${tipo}:`, error);
    throw error;
  }
});

ipcMain.handle('movimientos:obtener', async () => {
  try {
    return await db.obtenerMovimientos();
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    throw error;
  }
});

ipcMain.handle('movimientos:obtenerPorProducto', async (event, productoId) => {
  try {
    return await db.obtenerMovimientosPorProducto(productoId);
  } catch (error) {
    console.error('Error al obtener movimientos por producto:', error);
    throw error;
  }
});

ipcMain.handle('movimientos:obtenerDetalle', async (event, movimientoId) => {
  try {
    return await db.obtenerDetalleSalida(movimientoId);
  } catch (error) {
    console.error('Error al obtener detalle de movimiento:', error);
    throw error;
  }
});

ipcMain.handle('movimientos:eliminar', async (event, id) => {
  try {
    return await db.eliminarSalida(id);
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    throw error;
  }
});

ipcMain.handle('movimientos:actualizar', async (event, movimientoId, detalleActualizado) => {
  try {
    // Obtener el detalle original y el movimiento para calcular diferencias de stock
    const detalleOriginal = await db.obtenerDetalleSalida(movimientoId);
    const movimientos = await db.obtenerMovimientos();
    const movimiento = movimientos.find(m => m.id === movimientoId);
    
    if (!movimiento) {
      throw new Error(`No se encontró el movimiento con ID ${movimientoId}`);
    }
    
    // Actualizar cada item del detalle y ajustar stocks si es necesario
    for (const itemActualizado of detalleActualizado) {
      const itemOriginal = detalleOriginal.find(item => item.id === itemActualizado.id);
      
      if (!itemOriginal) {
        throw new Error(`No se encontró el item con ID ${itemActualizado.id}`);
      }
      
      // Actualizar el detalle
      await db.actualizarDetalleMovimiento(itemActualizado.id, itemActualizado.cantidad, itemActualizado.precio_unitario);
      
      // Ajustar stock solo si cambió la cantidad y no es Gasto Externo (ID = 1)
      if (itemActualizado.cantidad !== itemOriginal.cantidad && itemActualizado.producto_id !== 1) {
        const diferenciaCantidad = itemActualizado.cantidad - itemOriginal.cantidad;
        
        // Para salidas: diferencia positiva reduce stock, diferencia negativa aumenta stock
        // Para entradas: diferencia positiva aumenta stock, diferencia negativa reduce stock
        let ajusteStock;
        if (movimiento.tipo === 'salida') {
          ajusteStock = -diferenciaCantidad; // Si aumenta cantidad en salida, reduce stock
        } else {
          ajusteStock = diferenciaCantidad; // Si aumenta cantidad en entrada, aumenta stock
        }
        
        // Obtener stock actual y aplicar ajuste
        const productos = await db.obtenerProductos();
        const producto = productos.find(p => p.id === itemActualizado.producto_id);
        
        if (producto) {
          const nuevoStock = producto.stock + ajusteStock;
          await db.actualizarStock(itemActualizado.producto_id, nuevoStock);
        }
      }
    }
    
    // Calcular nuevo total del movimiento
    const nuevoTotal = detalleActualizado.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
    await db.actualizarTotalMovimiento(movimientoId, nuevoTotal);
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar movimiento:', error);
    throw error;
  }
});
