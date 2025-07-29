// ================================================
// FUNCIONALIDAD DE REPORTES Y ANÁLISIS - CORREGIDO
// ================================================

console.log('📁 Archivo reportes.js cargado');

// Estado global
let currentTab = 'daily';
let currentReportData = null;

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando módulo de reportes...');
  
  inicializarReportes();
  configurarEventListeners();
  configurarFechaActual();
  
  console.log('✅ Módulo de reportes inicializado correctamente');
});

function inicializarReportes() {
  cargarProductosSelector();
  configurarSelectoresAnuales();
  mostrarEstadoInicial();
  console.log('✅ Reportes inicializados correctamente');
}

function configurarEventListeners() {
  // Tabs de reportes
  document.querySelectorAll('.tab-button').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.closest('.tab-button').dataset.tab;
      cambiarTab(tabName);
    });
  });
  
  // Tecla Enter en inputs
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const activeTab = document.querySelector('.tab-button.active')?.dataset.tab;
      if (activeTab === 'daily') cargarReporteDiario();
      else if (activeTab === 'monthly') cargarReporteMensual();
      else if (activeTab === 'history') cargarHistorialProducto();
    }
  });
}

function configurarFechaActual() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dailyDate').value = today;
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  document.getElementById('monthlyMonth').value = currentMonth;
  document.getElementById('monthlyYear').value = currentYear;
}

function configurarSelectoresAnuales() {
  const yearSelect = document.getElementById('monthlyYear');
  const currentYear = new Date().getFullYear();
  
  yearSelect.innerHTML = '';
  for (let year = 2020; year <= currentYear + 2; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === currentYear) option.selected = true;
    yearSelect.appendChild(option);
  }
}

// ================================================
// GESTIÓN DE TABS
// ================================================

function cambiarTab(tabName) {
  // Actualizar botones de tab
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Mostrar panel correspondiente
  document.querySelectorAll('.date-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById(`${tabName}Controls`).classList.add('active');
  
  // Limpiar resultados anteriores
  limpiarResultados();
  currentTab = tabName;
}

// ================================================
// CARGAR DATOS REALES
// ================================================

async function cargarProductosSelector() {
  try {
    console.log('🔄 Cargando productos desde base de datos...');
    
    const resultado = await window.electronAPI.invoke('obtener-productos-selector');
    
    if (!resultado.success) {
      throw new Error(resultado.error);
    }
    
    const productos = resultado.data;
    const select = document.getElementById('productSelect');
    
    select.innerHTML = '<option value="">Seleccione un producto...</option>';
    
    productos.forEach(producto => {
      const option = document.createElement('option');
      option.value = producto.id;
      option.textContent = producto.nombre;
      select.appendChild(option);
    });
    
    console.log('✅ Productos cargados:', productos.length);
    
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    mostrarNotificacionLocal('Error al cargar productos: ' + error.message, 'error');
  }
}

// ================================================
// REPORTES DIARIOS - DATOS REALES
// ================================================

async function cargarReporteDiario() {
  try {
    let fecha = document.getElementById('dailyDate').value;
    if (!fecha) {
      fecha = new Date().toISOString().split('T')[0];
      document.getElementById('dailyDate').value = fecha;
    }
    
    console.log('🔍 Cargando reporte diario para:', fecha);
    mostrarEstadoCarga();
    
    const resultado = await window.electronAPI.invoke('obtener-reporte-diario', fecha);
    
    if (!resultado.success) {
      throw new Error(resultado.error);
    }
    
    const { reporte, resumen } = resultado.data;
    
    if (!reporte || reporte.length === 0) {
      mostrarEstadoVacio();
      mostrarNotificacionLocal('No hay datos para esta fecha', 'info');
      return;
    }
    
    mostrarIndicadoresDiarios(resumen);
    mostrarTablaDiaria(reporte, fecha);
    
    currentReportData = { tipo: 'diario', fecha, datos: reporte, resumen };
    mostrarNotificacion(`Reporte diario generado para ${formatearFecha(fecha, true)}`, 'success');
    
  } catch (error) {
    console.error('❌ Error cargando reporte diario:', error);
    mostrarNotificacion('Error al cargar el reporte diario: ' + error.message, 'error');
    mostrarEstadoVacio();
  }
}

// ================================================
// REPORTES MENSUALES - DATOS REALES  
// ================================================

async function cargarReporteMensual() {
  try {
    const año = parseInt(document.getElementById('monthlyYear').value);
    const mes = parseInt(document.getElementById('monthlyMonth').value);
    
    if (!año || !mes) {
      mostrarNotificacion('Seleccione año y mes', 'warning');
      return;
    }
    
    console.log('📈 Cargando reporte mensual para:', año, mes);
    mostrarEstadoCarga();
    
    const resultado = await window.electronAPI.invoke('obtener-reporte-mensual', año, mes);
    
    if (!resultado.success) {
      throw new Error(resultado.error);
    }
    
    const { reporte, resumen, diasActividad } = resultado.data;
    
    if (!reporte || reporte.length === 0) {
      mostrarEstadoVacio();
      mostrarNotificacion('No hay datos para este mes', 'info');
      return;
    }
    
    mostrarIndicadoresMensuales(resumen);
    mostrarTablaMensual(reporte, año, mes);
    if (diasActividad && diasActividad.length > 0) {
      mostrarTablaDiasActividad(diasActividad);
    }
    
    currentReportData = { tipo: 'mensual', año, mes, datos: reporte, resumen, diasActividad };
    
    const nombreMes = document.querySelector(`#monthlyMonth option[value="${mes}"]`).textContent;
    mostrarNotificacion(`Reporte mensual generado para ${nombreMes} ${año}`, 'success');
    
  } catch (error) {
    console.error('❌ Error cargando reporte mensual:', error);
    mostrarNotificacion('Error al cargar el reporte mensual: ' + error.message, 'error');
    mostrarEstadoVacio();
  }
}

// ================================================
// HISTORIAL DE PRODUCTOS - DATOS REALES
// ================================================

async function cargarHistorialProducto() {
  try {
    const productoId = document.getElementById('productSelect').value;
    const fechaInicio = document.getElementById('historyFrom').value;
    const fechaFin = document.getElementById('historyTo').value;
    
    if (!productoId) {
      mostrarNotificacion('Seleccione un producto', 'warning');
      return;
    }
    
    console.log('📦 Cargando historial de producto:', productoId);
    mostrarEstadoCarga();
    
    const resultado = await window.electronAPI.invoke('obtener-historial-producto', productoId, fechaInicio, fechaFin);
    
    if (!resultado.success) {
      throw new Error(resultado.error);
    }
    
    const historial = resultado.data;
    
    if (!historial || historial.length === 0) {
      mostrarEstadoVacio();
      mostrarNotificacion('No hay historial para este producto', 'info');
      return;
    }
    
    const indicadores = calcularIndicadoresHistorial(historial);
    mostrarIndicadoresHistorial(indicadores);
    mostrarTablaHistorial(historial, productoId);
    
    currentReportData = { tipo: 'historial', productoId, fechaInicio, fechaFin, datos: historial };
    
    const nombreProducto = document.querySelector(`#productSelect option[value="${productoId}"]`).textContent;
    mostrarNotificacion(`Historial generado para ${nombreProducto}`, 'success');
    
  } catch (error) {
    console.error('❌ Error cargando historial:', error);
    mostrarNotificacion('Error al cargar el historial: ' + error.message, 'error');
    mostrarEstadoVacio();
  }
}

// ================================================
// FUNCIONES DE MOSTRAR DATOS
// ================================================

function mostrarIndicadoresDiarios(resumen) {
  const totalVentasEl = document.getElementById('totalVentas');
  const totalComprasEl = document.getElementById('totalCompras');
  const utilidadTotalEl = document.getElementById('utilidadTotal');
  const productosActividadEl = document.getElementById('productosActividad');
  
  if (totalVentasEl) totalVentasEl.textContent = `$${formatearNumero(resumen.totalVentas || 0)}`;
  if (totalComprasEl) totalComprasEl.textContent = `$${formatearNumero(resumen.totalCompras || 0)}`;
  if (utilidadTotalEl) {
    utilidadTotalEl.textContent = `$${formatearNumero(resumen.utilidadTotal || 0)}`;
    utilidadTotalEl.className = (resumen.utilidadTotal || 0) >= 0 ? 'indicator-value text-success' : 'indicator-value text-danger';
  }
  if (productosActividadEl) productosActividadEl.textContent = resumen.productosConActividad || 0;
  
  document.getElementById('indicatorsSummary').style.display = 'block';
}

function mostrarIndicadoresMensuales(resumen) {
  mostrarIndicadoresDiarios(resumen); // Misma estructura
}

function mostrarIndicadoresHistorial(indicadores) {
  const totalVentasEl = document.getElementById('totalVentas');
  const totalComprasEl = document.getElementById('totalCompras');
  const utilidadTotalEl = document.getElementById('utilidadTotal');
  const productosActividadEl = document.getElementById('productosActividad');
  
  if (totalVentasEl) totalVentasEl.textContent = `$${formatearNumero(indicadores.totalVentas || 0)}`;
  if (totalComprasEl) totalComprasEl.textContent = `$${formatearNumero(indicadores.totalCompras || 0)}`;
  if (utilidadTotalEl) {
    utilidadTotalEl.textContent = `$${formatearNumero(indicadores.utilidadTotal || 0)}`;
    utilidadTotalEl.className = (indicadores.utilidadTotal || 0) >= 0 ? 'indicator-value text-success' : 'indicator-value text-danger';
  }
  if (productosActividadEl) productosActividadEl.textContent = indicadores.totalMovimientos || 0;
  
  document.getElementById('indicatorsSummary').style.display = 'block';
}

function mostrarTablaDiaria(datos, fecha) {
  document.getElementById('tableTitle').innerHTML = `
    <span class="table-icon">📅</span>
    Reporte Diario - ${formatearFecha(fecha, true)}
  `;
  
  document.getElementById('reportTableHead').innerHTML = `
    <tr>
      <th>Producto</th>
      <th>Unidades Vendidas</th>
      <th>Total Ventas</th>
      <th>Unidades Compradas</th>
      <th>Total Compras</th>
      <th>Utilidad del Día</th>
      <th>Stock Actual</th>
    </tr>
  `;
  
  document.getElementById('reportTableBody').innerHTML = datos.map(item => `
    <tr class="report-table-row">
      <td><strong>${item.producto_nombre || 'Sin nombre'}</strong></td>
      <td class="text-center">${item.unidades_vendidas || 0}</td>
      <td class="text-right cell-currency">${formatearNumero(item.total_ventas || 0)}</td>
      <td class="text-center">${item.unidades_compradas || 0}</td>
      <td class="text-right cell-currency">${formatearNumero(item.total_compras || 0)}</td>
      <td class="text-right cell-currency ${(item.utilidad_dia || 0) >= 0 ? 'cell-positive' : 'cell-negative'}">
        ${formatearNumero(item.utilidad_dia || 0)}
      </td>
      <td class="text-center">${item.stock_actual || 0}</td>
    </tr>
  `).join('');
  
  document.getElementById('reportTable').style.display = 'block';
  document.getElementById('activityTable').style.display = 'none';
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function mostrarTablaMensual(datos, año, mes) {
  const nombreMes = document.querySelector(`#monthlyMonth option[value="${mes}"]`).textContent;
  
  document.getElementById('tableTitle').innerHTML = `
    <span class="table-icon">📈</span>
    Reporte Mensual - ${nombreMes} ${año}
  `;
  
  document.getElementById('reportTableHead').innerHTML = `
    <tr>
      <th>Producto</th>
      <th>Unidades Vendidas</th>
      <th>Total Ventas</th>
      <th>Unidades Compradas</th>
      <th>Total Compras</th>
      <th>Utilidad Mensual</th>
      <th>Días con Ventas</th>
      <th>Stock Actual</th>
    </tr>
  `;
  
  document.getElementById('reportTableBody').innerHTML = datos.map(item => `
    <tr class="report-table-row">
      <td><strong>${item.producto_nombre || 'Sin nombre'}</strong></td>
      <td class="text-center">${item.unidades_vendidas_mes || 0}</td>
      <td class="text-right cell-currency">${formatearNumero(item.total_ventas_mes || 0)}</td>
      <td class="text-center">${item.unidades_compradas_mes || 0}</td>
      <td class="text-right cell-currency">${formatearNumero(item.total_compras_mes || 0)}</td>
      <td class="text-right cell-currency ${(item.utilidad_mes || 0) >= 0 ? 'cell-positive' : 'cell-negative'}">
        ${formatearNumero(item.utilidad_mes || 0)}
      </td>
      <td class="text-center">${item.dias_con_ventas || 0}</td>
      <td class="text-center">${item.stock_actual || 0}</td>
    </tr>
  `).join('');
  
  document.getElementById('reportTable').style.display = 'block';
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function mostrarTablaDiasActividad(datos) {
  document.getElementById('activityTableHead').innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>Productos Diferentes</th>
      <th>Ventas del Día</th>
      <th>Compras del Día</th>
      <th>Utilidad del Día</th>
    </tr>
  `;
  
  document.getElementById('activityTableBody').innerHTML = datos.map(dia => `
    <tr class="report-table-row">
      <td><strong>${formatearFecha(dia.fecha, true)}</strong></td>
      <td class="text-center">${dia.productos_diferentes || 0}</td>
      <td class="text-right cell-currency">${formatearNumero(dia.ventas_dia || 0)}</td>
      <td class="text-right cell-currency">${formatearNumero(dia.compras_dia || 0)}</td>
      <td class="text-right cell-currency ${(dia.utilidad_dia || 0) >= 0 ? 'cell-positive' : 'cell-negative'}">
        ${formatearNumero(dia.utilidad_dia || 0)}
      </td>
    </tr>
  `).join('');
  
  document.getElementById('activityTable').style.display = 'block';
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function mostrarTablaHistorial(datos, productoId) {
  const nombreProducto = document.querySelector(`#productSelect option[value="${productoId}"]`).textContent;
  
  document.getElementById('tableTitle').innerHTML = `
    <span class="table-icon">📦</span>
    Historial de ${nombreProducto}
  `;
  
  document.getElementById('reportTableHead').innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>Tipo</th>
      <th>Cantidad</th>
      <th>Precio Unitario</th>
      <th>Subtotal</th>
      <th>Stock Anterior</th>
      <th>Stock Nuevo</th>
      <th>Descripción</th>
    </tr>
  `;
  
  document.getElementById('reportTableBody').innerHTML = datos.map(mov => `
    <tr class="report-table-row">
      <td><strong>${formatearFecha(mov.fecha, true)}</strong></td>
      <td>
        <span class="badge ${mov.tipo === 'entrada' ? 'badge-success' : 'badge-warning'}">
          ${mov.tipo === 'entrada' ? '⬆️ Entrada' : '⬇️ Salida'}
        </span>
      </td>
      <td class="text-center">${mov.cantidad || 0}</td>
      <td class="text-right cell-currency">${formatearNumero(mov.precio_unitario || 0)}</td>
      <td class="text-right cell-currency">${formatearNumero(mov.subtotal || 0)}</td>
      <td class="text-center">${mov.stock_anterior || 0}</td>
      <td class="text-center">${mov.stock_nuevo || 0}</td>
      <td>${mov.descripcion || '-'}</td>
    </tr>
  `).join('');
  
  document.getElementById('reportTable').style.display = 'block';
  document.getElementById('activityTable').style.display = 'none';
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function calcularIndicadoresHistorial(historial) {
  const totalVentas = historial
    .filter(mov => mov.tipo === 'salida')
    .reduce((sum, mov) => sum + (mov.subtotal || 0), 0);
  
  const totalCompras = historial
    .filter(mov => mov.tipo === 'entrada')
    .reduce((sum, mov) => sum + (mov.subtotal || 0), 0);
  
  return {
    totalVentas,
    totalCompras,
    utilidadTotal: totalVentas - totalCompras,
    totalMovimientos: historial.length
  };
}

// ================================================
// UTILIDADES Y HELPERS
// ================================================

function mostrarEstadoCarga() {
  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('reportTable').style.display = 'none';
  document.getElementById('activityTable').style.display = 'none';
  document.getElementById('indicatorsSummary').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function mostrarEstadoVacio() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('reportTable').style.display = 'none';
  document.getElementById('activityTable').style.display = 'none';
  document.getElementById('indicatorsSummary').style.display = 'none';
  document.getElementById('emptyState').style.display = 'block';
}

function mostrarEstadoInicial() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('reportTable').style.display = 'none';
  document.getElementById('activityTable').style.display = 'none';
  document.getElementById('indicatorsSummary').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
}

function limpiarResultados() {
  mostrarEstadoInicial();
  currentReportData = null;
}

// ================================================
// EXPORTACIÓN
// ================================================

function exportarReporte() {
  if (!currentReportData) {
    mostrarNotificacion('No hay datos para exportar', 'warning');
    return;
  }

  try {
    let csvContent = '';
    let filename = '';

    switch (currentReportData.tipo) {
      case 'diario':
        csvContent = generarCSVDiario(currentReportData);
        filename = `reporte_diario_${currentReportData.fecha}.csv`;
        break;
      case 'mensual':
        csvContent = generarCSVMensual(currentReportData);
        filename = `reporte_mensual_${currentReportData.año}_${currentReportData.mes}.csv`;
        break;
      case 'historial':
        csvContent = generarCSVHistorial(currentReportData);
        filename = `historial_producto_${currentReportData.productoId}.csv`;
        break;
    }

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarNotificacion('Reporte exportado exitosamente', 'success');
  } catch (error) {
    console.error('Error exportando reporte:', error);
    mostrarNotificacion('Error al exportar el reporte', 'error');
  }
}

function generarCSVDiario(data) {
  const headers = 'Producto,Unidades Vendidas,Total Ventas,Unidades Compradas,Total Compras,Utilidad del Día,Stock Actual\n';
  const rows = data.datos.map(item => 
    `"${item.producto_nombre}",${item.unidades_vendidas},${item.total_ventas},${item.unidades_compradas},${item.total_compras},${item.utilidad_dia},${item.stock_actual}`
  ).join('\n');
  return headers + rows;
}

function generarCSVMensual(data) {
  const headers = 'Producto,Unidades Vendidas,Total Ventas,Unidades Compradas,Total Compras,Utilidad Mensual,Días con Ventas,Stock Actual\n';
  const rows = data.datos.map(item => 
    `"${item.producto_nombre}",${item.unidades_vendidas_mes},${item.total_ventas_mes},${item.unidades_compradas_mes},${item.total_compras_mes},${item.utilidad_mes},${item.dias_con_ventas},${item.stock_actual}`
  ).join('\n');
  return headers + rows;
}

function generarCSVHistorial(data) {
  const headers = 'Fecha,Tipo,Cantidad,Precio Unitario,Subtotal,Stock Anterior,Stock Nuevo,Descripción\n';
  const rows = data.datos.map(mov => 
    `"${mov.fecha}","${mov.tipo}",${mov.cantidad},${mov.precio_unitario},${mov.subtotal},${mov.stock_anterior},${mov.stock_nuevo},"${mov.descripcion || ''}"`
  ).join('\n');
  return headers + rows;
}

// ================================================
// NAVEGACIÓN
// ================================================

function mostrarNotificacionLocal(mensaje, tipo = 'info') {
  if (typeof NotificationManager !== 'undefined') {
    NotificationManager.show(mensaje, tipo);
  } else if (typeof window.mostrarNotificacion === 'function') {
    window.mostrarNotificacion(mensaje, tipo);
  } else {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }
}

// Registrar funciones globalmente
window.cargarReporteDiario = cargarReporteDiario;
window.cargarReporteMensual = cargarReporteMensual;
window.cargarHistorialProducto = cargarHistorialProducto;
window.exportarReporte = exportarReporte;
window.inicializarReportes = inicializarReportes;