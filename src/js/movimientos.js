/*
 * ========================================
 * KONTROL - GESTIÓN DE MOVIMIENTOS 
 * ========================================
 * Sistema unificado de entradas y salidas grupales
 * ACTUALIZADO - Julio 2025
 * 
 * CAMBIOS IMPLEMENTADOS:
 * ✅ Eliminadas observaciones
 * ✅ Descripción opcional con valores por defecto
 * ✅ Búsqueda de productos por nombre con ID y stock
 * ✅ Precios por movimiento (compra/venta según tipo)
 * ✅ Producto fijo "Gasto Externo" solo para salidas
 * ✅ Total de movimiento en tabla
 * ✅ Botón de edición de movimientos
 */

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

const CONFIG = {
  STOCK_MINIMO: 5,
  MAX_PRODUCTOS_TAG: 3,
  ANIMATION_DELAY: 50,
  GASTO_EXTERNO_ID: 1
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formatearID(id) {
  if (id < 100) {
    return id.toString().padStart(3, '0');
  }
  return id.toString();
}

// ==========================================
// REFERENCIAS DOM
// ==========================================

class DOMManager {
  constructor() {
    // Formulario
    this.formMovimiento = document.getElementById('formMovimiento');
    this.descripcionMovimiento = document.getElementById('descripcionMovimiento');
    this.busquedaProductos = document.getElementById('busquedaProductos');
    this.resultadosBusqueda = document.getElementById('resultadosBusqueda');
    this.productoSalidaSelect = document.getElementById('productoSalidaSelect');
    this.precioUnitario = document.getElementById('precioUnitario');
    this.cantidadSalida = document.getElementById('cantidadSalida');
    this.btnAgregarProducto = document.getElementById('btnAgregarProducto');
    this.listaProductosSalida = document.getElementById('listaProductosSalida');
    
    // Información de stock
    this.stockInfo = document.getElementById('stockInfo');
    this.selectedProductName = document.getElementById('selectedProductName');
    this.selectedProductStock = document.getElementById('selectedProductStock');
    this.projectedStock = document.getElementById('projectedStock');
    
    // Tabla y filtros
    this.tablaMovimientos = document.querySelector('#tablaMovimientos tbody');
    this.movCount = document.getElementById('movCount');
    this.filtroTipo = document.getElementById('filtroTipo');
    this.filtroProducto = document.getElementById('filtroProducto');
    this.fechaDesde = document.getElementById('fechaDesde');
    this.fechaHasta = document.getElementById('fechaHasta');
    
    // Resumen
    this.totalProductos = document.getElementById('totalProductos');
    this.stockTotal = document.getElementById('stockTotal');
    this.stockBajo = document.getElementById('stockBajo');
    
    // Modales
    this.modalOverlay = document.getElementById('modalOverlay');
    this.modalDetalle = document.getElementById('modalDetalle');
    this.modalEdicion = document.getElementById('modalEditar');
    this.modalConfirmacion = document.getElementById('modalConfirmacion');
  }
}

// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================

class AppState {
  constructor() {
    this.productos = [];
    this.movimientos = [];
    this.productosSalidaGrupal = [];
    this.productoSeleccionado = null;
    this.movimientoAEliminar = null;
    this.movimientoEnEdicion = null;
    this.detalleEnEdicion = [];
    this.filtros = {
      tipo: '',
      producto: '',
      fechaDesde: '',
      fechaHasta: ''
    };
  }

  // Getters para acceso seguro a datos
  getProductos() { return [...this.productos]; }
  getMovimientos() { return [...this.movimientos]; }
  getProductosSalida() { return [...this.productosSalidaGrupal]; }
  
  // Métodos para manipular productos en salida
  agregarProductoSalida(producto) {
    const existe = this.productosSalidaGrupal.find(p => p.producto_id === producto.producto_id);
    if (!existe) {
      this.productosSalidaGrupal.push(producto);
      return true;
    }
    return false;
  }
  
  eliminarProductoSalida(index) {
    if (index >= 0 && index < this.productosSalidaGrupal.length) {
      return this.productosSalidaGrupal.splice(index, 1)[0];
    }
    return null;
  }
  
  limpiarProductosSalida() {
    this.productosSalidaGrupal = [];
  }
  
  // Métodos para filtros
  actualizarFiltro(tipo, valor) {
    this.filtros[tipo] = valor;
  }
  
  limpiarFiltros() {
    this.filtros = {
      tipo: '',
      producto: '',
      fechaDesde: '',
      fechaHasta: ''
    };
  }
}

// ==========================================
// SISTEMA DE NOTIFICACIONES
// ==========================================

// Sistema unificado importado desde shared/notifications.js
// Las funciones están disponibles globalmente como:
// - NotificationManager.show(mensaje, tipo)
// - NotificationManager.error(mensaje)
// - NotificationManager.success(mensaje)
// - NotificationManager.warning(mensaje) 
// - NotificationManager.info(mensaje)

// ==========================================
// GESTIÓN DE DATOS
// ==========================================

class DataManager {
  static async cargarProductos() {
    try {
      const productos = await window.api.obtenerProductos();
      return productos || [];
    } catch (error) {
      console.error('Error al cargar productos:', error);
      throw new Error('No se pudieron cargar los productos');
    }
  }
  
  static async cargarMovimientos() {
    try {
      const movimientos = await window.api.obtenerMovimientos();
      return movimientos || [];
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      throw new Error('No se pudieron cargar los movimientos');
    }
  }
  
  static async obtenerDetalleMovimiento(movimientoId) {
    try {
      const detalle = await window.api.obtenerDetalleSalida(movimientoId);
      return detalle || [];
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      throw new Error('No se pudo cargar el detalle del movimiento');
    }
  }
  
  static async registrarMovimiento(movimiento) {
    try {
      const resultado = await window.api.registrarMovimiento(movimiento);
      return resultado;
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      throw error;
    }
  }
  
  static async eliminarMovimiento(id) {
    try {
      const resultado = await window.api.eliminarMovimiento(id);
      return resultado;
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      throw error;
    }
  }
  
  static async actualizarMovimiento(movimientoId, detalleActualizado) {
    try {
      const resultado = await window.api.actualizarMovimiento(movimientoId, detalleActualizado);
      return resultado;
    } catch (error) {
      console.error('Error al actualizar movimiento:', error);
      throw error;
    }
  }
}

// ==========================================
// CONTROLADOR PRINCIPAL
// ==========================================

class MovimientosController {
  constructor() {
    this.dom = new DOMManager();
    this.state = new AppState();
    this.init();
  }

  async init() {
    try {
      await this.cargarDatosIniciales();
      this.configurarEventListeners();
      this.configurarFechas();
    } catch (error) {
      NotificationManager.error('Error al inicializar la aplicación: ' + error.message);
    }
  }

  async cargarDatosIniciales() {
    try {
      // Cargar productos
      this.state.productos = await DataManager.cargarProductos();
      this.actualizarSelectProductos();
      this.actualizarResumen();
      
      // Cargar movimientos
      this.state.movimientos = await DataManager.cargarMovimientos();
      this.mostrarMovimientos(this.state.movimientos);
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      throw error;
    }
  }

  actualizarSelectProductos() {
    // Limpiar selects
    this.dom.productoSalidaSelect.innerHTML = '<option value="">-- Selecciona un producto --</option>';
    this.dom.filtroProducto.innerHTML = '<option value="">Todos los productos</option>';
    
    if (this.state.productos.length === 0) {
      this.dom.productoSalidaSelect.innerHTML = '<option value="">No hay productos disponibles</option>';
      this.dom.productoSalidaSelect.disabled = true;
    } else {
      this.state.productos.forEach(producto => {
        // Para el selector principal (con stock visible)
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = `[${formatearID(producto.id)}] ${producto.nombre} (Stock: ${producto.stock})`;
        option.dataset.stock = producto.stock;
        option.dataset.nombre = producto.nombre;
        option.dataset.precioCompra = producto.precio_compra || 0;
        option.dataset.precioVenta = producto.precio_venta || 0;
        this.dom.productoSalidaSelect.appendChild(option);
        
        // Para el filtro
        const filterOption = document.createElement('option');
        filterOption.value = producto.id;
        filterOption.textContent = producto.nombre;
        this.dom.filtroProducto.appendChild(filterOption);
      });
      
      this.dom.productoSalidaSelect.disabled = false;
    }
  }

  configurarEventListeners() {
    // Búsqueda de productos
    this.dom.busquedaProductos.addEventListener('input', (e) => {
      this.buscarProductos(e.target.value);
    });

    // Formulario principal
    this.dom.formMovimiento.addEventListener('submit', (e) => {
      e.preventDefault();
      this.procesarMovimiento();
    });

    // Agregar producto
    this.dom.btnAgregarProducto.addEventListener('click', () => {
      this.agregarProductoASalida();
    });

    // Cambio en selector de producto
    this.dom.productoSalidaSelect.addEventListener('change', () => {
      this.actualizarInfoStock();
    });

    // Cambio en cantidad o precio
    this.dom.cantidadSalida.addEventListener('input', () => {
      this.actualizarInfoStock();
    });
    this.dom.precioUnitario.addEventListener('input', () => {
      this.actualizarInfoStock();
    });

    // Enter para agregar producto
    this.dom.cantidadSalida.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.agregarProductoASalida();
      }
    });

    // Filtros
    this.dom.filtroTipo.addEventListener('change', () => this.aplicarFiltros());
    this.dom.filtroProducto.addEventListener('change', () => this.aplicarFiltros());
    this.dom.fechaDesde.addEventListener('change', () => this.aplicarFiltros());
    this.dom.fechaHasta.addEventListener('change', () => this.aplicarFiltros());

    // Modal overlay
    this.dom.modalOverlay.addEventListener('click', () => {
      this.cerrarModales();
    });
  }

  buscarProductos(termino) {
    if (!termino.trim()) {
      this.dom.resultadosBusqueda.style.display = 'none';
      return;
    }

    const productosEncontrados = this.state.productos.filter(producto => 
      producto.nombre.toLowerCase().includes(termino.toLowerCase())
    );

    if (productosEncontrados.length > 0) {
      let html = '<div class="busqueda-titulo">Productos encontrados:</div>';
      productosEncontrados.forEach(producto => {
        html += `
          <div class="resultado-producto" onclick="movimientosController.seleccionarProducto(${producto.id})">
            <span class="producto-id">[${formatearID(producto.id)}]</span>
            <span class="producto-nombre">${producto.nombre}</span>
            <span class="producto-stock">Stock: ${producto.stock}</span>
          </div>
        `;
      });
      this.dom.resultadosBusqueda.innerHTML = html;
      this.dom.resultadosBusqueda.style.display = 'block';
    } else {
      this.dom.resultadosBusqueda.innerHTML = '<div class="no-resultados">No se encontraron productos</div>';
      this.dom.resultadosBusqueda.style.display = 'block';
    }
  }

  seleccionarProducto(productoId) {
    this.dom.productoSalidaSelect.value = productoId;
    // Mantener el nombre del producto seleccionado en la búsqueda
    const producto = this.state.productos.find(p => p.id === productoId);
    if (producto) {
      this.dom.busquedaProductos.value = producto.nombre;
    }
    this.dom.resultadosBusqueda.style.display = 'none';
    
    // Establecer precio por defecto según el tipo de movimiento
    const tipoMovimiento = document.querySelector('input[name="tipoMovimiento"]:checked');
    if (tipoMovimiento && productoId !== CONFIG.GASTO_EXTERNO_ID) {
      if (producto) {
        const precio = tipoMovimiento.value === 'entrada' ? producto.precio_compra : producto.precio_venta;
        this.dom.precioUnitario.value = precio || 0;
      }
    }
    
    this.actualizarInfoStock();
  }

  configurarFechas() {
    const hoy = new Date().toISOString().split('T')[0];
    this.dom.fechaDesde.max = hoy;
    this.dom.fechaHasta.max = hoy;
    this.dom.fechaHasta.value = hoy;
  }

  actualizarInfoStock() {
    const productoId = parseInt(this.dom.productoSalidaSelect.value);
    const cantidad = parseInt(this.dom.cantidadSalida.value) || 0;
    const precio = parseFloat(this.dom.precioUnitario.value) || 0;
    
    if (!productoId || cantidad <= 0) {
      this.dom.stockInfo.style.display = 'none';
      return;
    }

    const producto = this.state.productos.find(p => p.id === productoId);
    if (!producto) return;

    const tipoMovimiento = document.querySelector('input[name="tipoMovimiento"]:checked');
    if (!tipoMovimiento) {
      this.dom.stockInfo.style.display = 'none';
      return;
    }

    // Mostrar información
    this.dom.stockInfo.style.display = 'block';
    this.dom.selectedProductName.textContent = producto.nombre;
    this.dom.selectedProductStock.textContent = producto.stock;

    // Calcular stock proyectado
    let stockProyectado;
    let className = 'stock-value';
    
    if (productoId === CONFIG.GASTO_EXTERNO_ID) {
      stockProyectado = 'N/A (Gasto Externo)';
    } else {
      if (tipoMovimiento.value === 'entrada') {
        stockProyectado = producto.stock + cantidad;
      } else {
        stockProyectado = producto.stock - cantidad;
        if (stockProyectado < 0) {
          className = 'stock-value danger';
        } else if (stockProyectado < CONFIG.STOCK_MINIMO) {
          className = 'stock-value warning';
        }
      }
    }

    this.dom.projectedStock.textContent = stockProyectado;
    this.dom.projectedStock.className = className;
    
    // Mostrar subtotal
    const subtotal = cantidad * precio;
    const tipoLabel = tipoMovimiento.value === 'entrada' ? 'Precio Compra' : 'Precio Venta';
    const subtotalDiv = document.getElementById('subtotalInfo') || (() => {
      const div = document.createElement('div');
      div.id = 'subtotalInfo';
      div.className = 'stock-info-item';
      this.dom.stockInfo.querySelector('.stock-info-grid').appendChild(div);
      return div;
    })();
    
    subtotalDiv.innerHTML = `
      <span class="stock-label">${tipoLabel} × ${cantidad}:</span>
      <span class="stock-value">$${subtotal.toLocaleString()}</span>
    `;
  }

  agregarProductoASalida() {
    const productoId = parseInt(this.dom.productoSalidaSelect.value);
    const cantidad = parseInt(this.dom.cantidadSalida.value);
    const precio = parseFloat(this.dom.precioUnitario.value);
    
    if (!productoId || !cantidad || cantidad < 1 || precio < 0) {
      NotificationManager.error('Completa todos los campos correctamente');
      return;
    }

    const selectedOption = this.dom.productoSalidaSelect.selectedOptions[0];
    const stockDisponible = productoId === CONFIG.GASTO_EXTERNO_ID ? 1 : parseInt(selectedOption.dataset.stock);
    const nombreProducto = selectedOption.dataset.nombre || 'Gasto Externo';
    
    // Verificar si el producto ya está en la lista
    if (this.state.productosSalidaGrupal.find(p => p.producto_id === productoId)) {
      NotificationManager.warning('Este producto ya está en la lista');
      return;
    }
    
    // Para salidas, verificar stock suficiente (excepto Gasto Externo)
    const tipoMovimiento = document.querySelector('input[name="tipoMovimiento"]:checked');
    if (tipoMovimiento && tipoMovimiento.value === 'salida' && productoId !== CONFIG.GASTO_EXTERNO_ID && cantidad > stockDisponible) {
      NotificationManager.error(`Stock insuficiente. Disponible: ${stockDisponible}`);
      return;
    }
    
    // Calcular stock resultante
    let stockResultante;
    if (productoId === CONFIG.GASTO_EXTERNO_ID) {
      stockResultante = 1; // Gasto Externo siempre mantiene stock 1
    } else {
      stockResultante = tipoMovimiento && tipoMovimiento.value === 'entrada' 
        ? stockDisponible + cantidad 
        : stockDisponible - cantidad;
    }
    
    const nuevoProducto = {
      producto_id: productoId,
      nombre: nombreProducto,
      cantidad: cantidad,
      precio_unitario: precio,
      stock_disponible: stockDisponible,
      stock_resultante: stockResultante,
      subtotal: cantidad * precio
    };

    if (this.state.agregarProductoSalida(nuevoProducto)) {
      this.actualizarListaProductosSalida();
      
      // Limpiar campos
      this.dom.productoSalidaSelect.value = '';
      this.dom.busquedaProductos.value = ''; // Limpiar búsqueda después de agregar
      this.dom.cantidadSalida.value = '1';
      this.dom.precioUnitario.value = '';
      this.dom.stockInfo.style.display = 'none';
      
      NotificationManager.success(`${nombreProducto} agregado al movimiento`);
    }
  }

  eliminarProductoDeSalida(index) {
    const producto = this.state.eliminarProductoSalida(index);
    if (producto) {
      this.actualizarListaProductosSalida();
      NotificationManager.info(`${producto.nombre} eliminado del movimiento`);
    }
  }

  actualizarListaProductosSalida() {
    const productos = this.state.getProductosSalida();
    
    if (productos.length === 0) {
      this.dom.listaProductosSalida.innerHTML = `
        <div class="empty-products-message">
          <span>🛒 No hay productos agregados</span>
          <small>Usa el selector de arriba para agregar productos a este movimiento</small>
        </div>
      `;
      return;
    }
    
    let html = '';
    let totalMovimiento = 0;
    
    productos.forEach((producto, index) => {
      totalMovimiento += producto.subtotal;
      html += `
        <div class="producto-en-salida">
          <div class="producto-info">
            <span class="producto-nombre">${producto.nombre}</span>
            <span class="producto-detalles">
              $${producto.precio_unitario.toLocaleString()} × ${producto.cantidad} = $${producto.subtotal.toLocaleString()}
            </span>
            ${producto.producto_id !== CONFIG.GASTO_EXTERNO_ID ? 
              `<span class="stock-info">Stock: ${producto.stock_disponible} → ${producto.stock_resultante}</span>` : 
              ''
            }
          </div>
          <button type="button" class="btn-remove-product" onclick="movimientosController.eliminarProductoDeSalida(${index})" title="Eliminar producto">
            ✕
          </button>
        </div>
      `;
    });
    
    html += `
      <div class="total-movimiento">
        <strong>Total del Movimiento: $${totalMovimiento.toLocaleString()}</strong>
      </div>
    `;
    
    this.dom.listaProductosSalida.innerHTML = html;
  }

  async procesarMovimiento() {
    const tipoMovimiento = document.querySelector('input[name="tipoMovimiento"]:checked');
    
    if (!tipoMovimiento) {
      NotificationManager.error('Selecciona el tipo de movimiento');
      return;
    }
    
    if (this.state.productosSalidaGrupal.length === 0) {
      NotificationManager.error('Agrega al menos un producto al movimiento');
      return;
    }
    
    // Generar descripción automática si está vacía
    let descripcion = this.dom.descripcionMovimiento.value.trim();
    if (!descripcion) {
      descripcion = tipoMovimiento.value === 'entrada' ? 'Restock' : 'Venta';
    }
    
    try {
      const movimiento = {
        tipo: tipoMovimiento.value,
        descripcion: descripcion,
        productos: this.state.productosSalidaGrupal.map(p => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario
        }))
      };
      
      const btnSubmit = this.dom.formMovimiento.querySelector('button[type="submit"]');
      const btnText = btnSubmit.querySelector('.btn-text');
      const loading = btnSubmit.querySelector('.loading');
      
      // Mostrar loading
      btnText.style.display = 'none';
      loading.style.display = 'inline-block';
      btnSubmit.disabled = true;
      
      const resultado = await DataManager.registrarMovimiento(movimiento);
      
      NotificationManager.success(`${tipoMovimiento.value.charAt(0).toUpperCase() + tipoMovimiento.value.slice(1)} registrada exitosamente`);
      
      // Recargar datos
      await this.cargarDatosIniciales();
      this.limpiarFormulario();
      
    } catch (error) {
      NotificationManager.error('Error al registrar movimiento: ' + error.message);
    } finally {
      const btnSubmit = this.dom.formMovimiento.querySelector('button[type="submit"]');
      const btnText = btnSubmit.querySelector('.btn-text');
      const loading = btnSubmit.querySelector('.loading');
      
      btnText.style.display = 'inline';
      loading.style.display = 'none';
      btnSubmit.disabled = false;
    }
  }

  limpiarFormulario() {
    this.dom.descripcionMovimiento.value = '';
    this.dom.busquedaProductos.value = '';
    this.dom.precioUnitario.value = '';
    this.dom.stockInfo.style.display = 'none';
    this.dom.resultadosBusqueda.style.display = 'none';
    this.state.limpiarProductosSalida();
    this.actualizarListaProductosSalida();
    
    // Limpiar selección de tipo de movimiento
    document.querySelectorAll('input[name="tipoMovimiento"]').forEach(radio => {
      radio.checked = false;
    });
  }

  actualizarResumen() {
    if (!this.state.productos.length) return;
    
    const total = this.state.productos.length - 1; // Excluir Gasto Externo
    const stockTotalNum = this.state.productos
      .filter(p => p.id !== CONFIG.GASTO_EXTERNO_ID)
      .reduce((sum, p) => sum + p.stock, 0);
    const stockBajoNum = this.state.productos
      .filter(p => p.id !== CONFIG.GASTO_EXTERNO_ID && p.stock < CONFIG.STOCK_MINIMO)
      .length;
    
    this.dom.totalProductos.textContent = total;
    this.dom.stockTotal.textContent = stockTotalNum;
    this.dom.stockBajo.textContent = stockBajoNum;
    
    // Indicador visual para stock bajo
    const stockBajoCard = this.dom.stockBajo.closest('.summary-card');
    if (stockBajoNum > 0) {
      stockBajoCard?.classList.add('warning');
    } else {
      stockBajoCard?.classList.remove('warning');
    }
  }

  mostrarMovimientos(movimientosFiltrados) {
    this.dom.tablaMovimientos.innerHTML = '';
    
    if (movimientosFiltrados.length === 0) {
      this.mostrarTablaVacia();
      return;
    }
    
    movimientosFiltrados.forEach((mov, index) => {
      const fila = this.crearFilaMovimiento(mov, index);
      this.dom.tablaMovimientos.appendChild(fila);
    });
    
    this.dom.movCount.textContent = `${movimientosFiltrados.length} movimiento${movimientosFiltrados.length !== 1 ? 's' : ''}`;
  }

  mostrarTablaVacia() {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 10px;">📝</div>
        <div>No hay movimientos registrados</div>
      </td>
    `;
    this.dom.tablaMovimientos.appendChild(fila);
  }

  crearFilaMovimiento(mov, index) {
    const fila = document.createElement('tr');
    fila.className = 'slide-in-right';
    fila.style.animationDelay = `${index * CONFIG.ANIMATION_DELAY}ms`;
    
    const fecha = new Date(mov.fecha);
    const tipoIcon = mov.tipo === 'entrada' ? '📥' : '📤';
    const tipoClass = mov.tipo === 'entrada' ? 'entrada' : 'salida';
    
    // Procesar productos para mostrar
    const productos = mov.productos_nombres ? mov.productos_nombres.split(', ') : [];
    const productosDisplay = this.crearDisplayProductos(productos);
    
    fila.innerHTML = `
      <td class="col-id">#${formatearID(mov.id)}</td>
      <td>${fecha.toLocaleString('es-ES')}</td>
      <td>
        <span class="movement-badge ${tipoClass}">
          ${tipoIcon} ${mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
        </span>
      </td>
      <td class="col-descripcion">${mov.descripcion}</td>
      <td>${productosDisplay}</td>
      <td class="col-cantidad">${mov.cantidad_total || 0}</td>
      <td class="col-total">$${(mov.total_movimiento || 0).toLocaleString()}</td>
      <td class="col-acciones">
        <div class="action-buttons">
          <button class="btn-edit" onclick="movimientosController.verDetalle(${mov.id})" title="Ver detalle">
            📋 Detalles
          </button>
          <button class="btn-edit" onclick="movimientosController.editarMovimiento(${mov.id})" title="Editar movimiento">
            ✏️ Editar
          </button>
          <button class="btn-delete" onclick="movimientosController.confirmarEliminacion(${mov.id})" title="Eliminar">
            🗑️
          </button>
        </div>
      </td>
    `;
    
    return fila;
  }

  crearDisplayProductos(productos) {
    if (!productos.length) return '-';
    
    if (productos.length <= CONFIG.MAX_PRODUCTOS_TAG) {
      return productos.map(nombre => `<span class="product-tag">${nombre}</span>`).join(' ');
    } else {
      const visible = productos.slice(0, CONFIG.MAX_PRODUCTOS_TAG);
      const resto = productos.length - CONFIG.MAX_PRODUCTOS_TAG;
      return visible.map(nombre => `<span class="product-tag">${nombre}</span>`).join(' ') + 
             ` <span class="product-tag more">+${resto} más</span>`;
    }
  }

  async aplicarFiltros() {
    let movimientosFiltrados = [...this.state.movimientos];
    
    // Filtro por tipo
    if (this.dom.filtroTipo.value) {
      movimientosFiltrados = movimientosFiltrados.filter(mov => mov.tipo === this.dom.filtroTipo.value);
    }
    
    // Filtro por producto
    if (this.dom.filtroProducto.value) {
      const productoId = parseInt(this.dom.filtroProducto.value);
      movimientosFiltrados = movimientosFiltrados.filter(mov => {
        return mov.productos_nombres && mov.productos_nombres.includes(
          this.state.productos.find(p => p.id === productoId)?.nombre || ''
        );
      });
    }
    
    // Filtro por fecha desde
    if (this.dom.fechaDesde.value) {
      const fechaDesde = new Date(this.dom.fechaDesde.value);
      movimientosFiltrados = movimientosFiltrados.filter(mov => 
        new Date(mov.fecha) >= fechaDesde
      );
    }
    
    // Filtro por fecha hasta
    if (this.dom.fechaHasta.value) {
      const fechaHasta = new Date(this.dom.fechaHasta.value + 'T23:59:59');
      movimientosFiltrados = movimientosFiltrados.filter(mov => 
        new Date(mov.fecha) <= fechaHasta
      );
    }
    
    this.mostrarMovimientos(movimientosFiltrados);
  }

  limpiarFiltros() {
    this.dom.filtroTipo.value = '';
    this.dom.filtroProducto.value = '';
    this.dom.fechaDesde.value = '';
    this.dom.fechaHasta.value = '';
    
    this.mostrarMovimientos(this.state.movimientos);
  }

  async verDetalle(movimientoId) {
    try {
      const movimiento = this.state.movimientos.find(m => m.id === movimientoId);
      const detalle = await DataManager.obtenerDetalleMovimiento(movimientoId);
      
      if (movimiento && detalle) {
        this.mostrarModalDetalle(movimiento, detalle);
      }
    } catch (error) {
      NotificationManager.error('Error al cargar el detalle del movimiento');
    }
  }

  mostrarModalDetalle(movimiento, detalle) {
    const fecha = new Date(movimiento.fecha);
    const tipoIcon = movimiento.tipo === 'entrada' ? '📥' : '📤';
    
    let productosHtml = '';
    let totalMovimiento = 0;
    
    detalle.forEach(item => {
      totalMovimiento += item.subtotal || (item.cantidad * item.precio_unitario);
      productosHtml += `
        <div class="detalle-producto">
          <div class="producto-nombre">${item.producto_nombre}</div>
          <div class="producto-datos">
            <span>Cantidad: ${item.cantidad}</span>
            <span>Precio: $${(item.precio_unitario || 0).toLocaleString()}</span>
            <span>Subtotal: $${(item.subtotal || (item.cantidad * item.precio_unitario)).toLocaleString()}</span>
          </div>
          ${item.producto_id !== CONFIG.GASTO_EXTERNO_ID ? 
            `<div class="stock-cambio">Stock: ${item.stock_anterior} → ${item.stock_actual}</div>` : 
            ''
          }
        </div>
      `;
    });

    document.getElementById('detalleContent').innerHTML = `
      <div class="detalle-header">
        <h4>${tipoIcon} ${movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)} #${formatearID(movimiento.id)}</h4>
        <small>${fecha.toLocaleString('es-ES')}</small>
      </div>
      
      <div class="detalle-info">
        <strong>Descripción:</strong> ${movimiento.descripcion}<br>
        <strong>Total de productos:</strong> ${detalle.length}<br>
        <strong>Total del movimiento:</strong> $${totalMovimiento.toLocaleString()}
      </div>
      
      <div class="detalle-productos">
        ${productosHtml}
      </div>
    `;

    this.dom.modalDetalle.classList.add('active');
    this.dom.modalOverlay.style.display = 'block';
    this.dom.modalOverlay.classList.add('active');
  }

  async editarMovimiento(movimientoId) {
    try {
      const movimiento = this.state.movimientos.find(m => m.id === movimientoId);
      const detalle = await DataManager.obtenerDetalleMovimiento(movimientoId);
      
      if (movimiento && detalle) {
        this.state.movimientoEnEdicion = movimiento;
        this.state.detalleEnEdicion = [...detalle];
        this.mostrarModalEdicion(movimiento, detalle);
      }
    } catch (error) {
      NotificationManager.error('Error al cargar el movimiento para editar');
    }
  }

  mostrarModalEdicion(movimiento, detalle) {
    const fecha = new Date(movimiento.fecha);
    const tipoIcon = movimiento.tipo === 'entrada' ? '📥' : '📤';
    
    let productosHtml = '';
    
    detalle.forEach((item, index) => {
      productosHtml += `
        <div class="edicion-producto" data-index="${index}">
          <div class="producto-info-edicion">
            <strong>${item.producto_nombre}</strong>
            <small>ID: ${item.producto_id}</small>
          </div>
          <div class="campos-edicion">
            <div class="campo-edicion">
              <label>Precio:</label>
              <input type="number" 
                     value="${item.precio_unitario || 0}" 
                     step="0.01" 
                     min="0"
                     onchange="movimientosController.actualizarCampoEdicion(${index}, 'precio', this.value)">
            </div>
            <div class="campo-edicion">
              <label>Cantidad:</label>
              <input type="number" 
                     value="${item.cantidad}" 
                     min="1"
                     onchange="movimientosController.actualizarCampoEdicion(${index}, 'cantidad', this.value)">
            </div>
            <div class="campo-readonly">
              <label>Subtotal:</label>
              <span class="subtotal-edicion">$${((item.precio_unitario || 0) * item.cantidad).toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    });

    const totalMovimiento = detalle.reduce((sum, item) => sum + ((item.precio_unitario || 0) * item.cantidad), 0);

    document.getElementById('edicionContent').innerHTML = `
      <div class="edicion-header">
        <h4>${tipoIcon} ${movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)} #${formatearID(movimiento.id)}</h4>
        <small>${fecha.toLocaleString('es-ES')}</small>
      </div>
      
      <div class="edicion-info">
        <p><strong>Descripción:</strong> ${movimiento.descripcion}</p>
        <p><strong>Total actual:</strong> <span id="totalEdicion">$${totalMovimiento.toLocaleString()}</span></p>
        <div class="info-edicion">
          ℹ️ Solo puedes editar precios y cantidades. Los cambios afectarán el stock correspondiente.
        </div>
      </div>
      
      <div class="edicion-productos">
        ${productosHtml}
      </div>
    `;

    this.dom.modalEdicion.classList.add('active');
    this.dom.modalOverlay.style.display = 'block';
    this.dom.modalOverlay.classList.add('active');
  }

  confirmarEliminacion(movimientoId) {
    this.state.movimientoAEliminar = movimientoId;
    this.dom.modalConfirmacion.classList.add('active');
    this.dom.modalOverlay.style.display = 'block';
    this.dom.modalOverlay.classList.add('active');
  }

  async eliminarMovimiento() {
    if (!this.state.movimientoAEliminar) return;

    try {
      await DataManager.eliminarMovimiento(this.state.movimientoAEliminar);
      NotificationManager.success('Movimiento eliminado exitosamente');
      
      // Recargar datos
      await this.cargarDatosIniciales();
      
    } catch (error) {
      NotificationManager.error('Error al eliminar movimiento: ' + error.message);
    } finally {
      this.state.movimientoAEliminar = null;
      this.cerrarModales();
    }
  }

  cerrarModales() {
    this.dom.modalDetalle.classList.remove('active');
    this.dom.modalEdicion.classList.remove('active');
    this.dom.modalConfirmacion.classList.remove('active');
    this.dom.modalOverlay.classList.remove('active');
    
    setTimeout(() => {
      this.dom.modalOverlay.style.display = 'none';
    }, 300);
  }

  // Métodos para exportación y navegación
  exportarMovimientos() {
    NotificationManager.info('Función de exportación en desarrollo');
    // TODO: Implementar exportación a Excel/CSV
  }

  actualizarCampoEdicion(index, campo, valor) {
    if (index >= 0 && index < this.state.detalleEnEdicion.length) {
      const item = this.state.detalleEnEdicion[index];
      
      if (campo === 'precio') {
        item.precio_unitario = parseFloat(valor) || 0;
      } else if (campo === 'cantidad') {
        item.cantidad = parseInt(valor) || 1;
      }
      
      // Actualizar subtotal visual
      const subtotal = item.precio_unitario * item.cantidad;
      const subtotalElement = document.querySelector(`[data-index="${index}"] .subtotal-edicion`);
      if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
      }
      
      // Actualizar total general
      const totalGeneral = this.state.detalleEnEdicion.reduce((sum, item) => 
        sum + (item.precio_unitario * item.cantidad), 0);
      const totalElement = document.getElementById('totalEdicion');
      if (totalElement) {
        totalElement.textContent = `$${totalGeneral.toLocaleString()}`;
      }
    }
  }

  async guardarEdicionMovimiento() {
    try {
      // Validar que todos los campos sean válidos
      const datosValidos = this.state.detalleEnEdicion.every(item => 
        item.cantidad > 0 && item.precio_unitario >= 0
      );
      
      if (!datosValidos) {
        NotificationManager.error('Todos los campos deben tener valores válidos');
        return;
      }

      // Actualizar en la base de datos
      await DataManager.actualizarMovimiento(
        this.state.movimientoEnEdicion.id, 
        this.state.detalleEnEdicion
      );
      
      NotificationManager.success('Cambios guardados correctamente');
      this.cerrarModales();
      await this.cargarDatosIniciales(); // Recargar datos
    } catch (error) {
      console.error('Error al guardar edición:', error);
      NotificationManager.error('Error al guardar los cambios: ' + error.message);
    }
  }

  volverAlMenu() {
    NotificationManager.info('Navegando al menú principal...');
    // TODO: Implementar navegación
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

let movimientosController;

document.addEventListener('DOMContentLoaded', () => {
  movimientosController = new MovimientosController();
});

// ==========================================
// FUNCIONES GLOBALES PARA HTML
// ==========================================

function cerrarModalDetalle() {
  movimientosController.cerrarModales();
}

function cerrarModalEdicion() {
  movimientosController.cerrarModales();
}

function guardarEdicionMovimiento() {
  movimientosController.guardarEdicionMovimiento();
}

function cerrarModalConfirmacion() {
  movimientosController.cerrarModales();
}

function confirmarEliminacion() {
  movimientosController.eliminarMovimiento();
}

function limpiarFiltros() {
  movimientosController.limpiarFiltros();
}

function exportarMovimientos() {
  movimientosController.exportarMovimientos();
}

function volverAlMenu() {
  movimientosController.volverAlMenu();
}
