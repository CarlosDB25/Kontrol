// ================================================
// FUNCIONALIDAD DE REPORTES Y ANÁLISIS
// ================================================

// Estado global
let currentTab = 'daily';
let currentReportData = null;

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  inicializarReportes();
  configurarEventListeners();
  configurarFechaActual();
});

function inicializarReportes() {
  cargarProductosSelector();
  configurarSelectoresAnuales();
  mostrarEstadoInicial();
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
    
  } catch (error) {
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
    
    currentReportData = { tipo: 'diario', fecha, reporte, resumen };
    mostrarNotificacion(`Reporte diario generado para ${formatearFecha(fecha, true)}`, 'success');
    
  } catch (error) {
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
    
    currentReportData = { tipo: 'mensual', año, mes, reporte, resumen, diasActividad };
    
    const nombreMes = document.querySelector(`#monthlyMonth option[value="${mes}"]`).textContent;
    mostrarNotificacion(`Reporte mensual generado para ${nombreMes} ${año}`, 'success');
    
  } catch (error) {
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
    
    currentReportData = { tipo: 'historial', productoId, fechaInicio, fechaFin, reporte: historial };
    
    const nombreProducto = document.querySelector(`#productSelect option[value="${productoId}"]`).textContent;
    mostrarNotificacion(`Historial generado para ${nombreProducto}`, 'success');
    
  } catch (error) {
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
  
  const filas = datos.map(item => {
    return `
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
  `}).join('');
  
  document.getElementById('reportTableBody').innerHTML = filas;
  
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
// EXPORTACIÓN PDF CON LOGO
// ================================================

function exportarReporte() {
  if (!currentReportData) {
    mostrarNotificacion('No hay datos para exportar', 'warning');
    return;
  }

  try {
    mostrarNotificacion('Generando PDF...', 'info');
    
    switch (currentReportData.tipo) {
      case 'diario':
        generarPDFDiario(currentReportData);
        break;
      case 'mensual':
        generarPDFMensual(currentReportData);
        break;
      case 'historial':
        generarPDFHistorial(currentReportData);
        break;
    }
  } catch (error) {
    mostrarNotificacion('Error al exportar el reporte', 'error');
  }
}

// Función para cargar imagen como base64
function loadImageAsBase64(imagePath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = this.width;
      canvas.height = this.height;
      ctx.drawImage(this, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = imagePath;
  });
}

// Función para crear el encabezado con logo
async function crearEncabezadoPDF(doc, titulo, fecha = null) {
  try {
    // Cargar logo
    const logoBase64 = await loadImageAsBase64('../../assets/img/variedades/variedades_jl.png');
    
    // Agregar logo (esquina superior izquierda)
    doc.addImage(logoBase64, 'PNG', 20, 15, 40, 25);
    
    // Título principal
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 105, 25, { align: 'center' });
    
    // Fecha si se proporciona
    if (fecha) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(fecha, 105, 35, { align: 'center' });
    }
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
    
    return 60; // Retorna la posición Y donde termina el encabezado
  } catch (error) {
    // Crear encabezado sin logo
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 105, 30, { align: 'center' });
    
    if (fecha) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(fecha, 105, 40, { align: 'center' });
    }
    
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
    
    return 60;
  }
}

async function generarPDFDiario(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const fechaFormateada = formatearFecha(data.fecha, true);
  const yInicial = await crearEncabezadoPDF(doc, 'Reporte Diario de Ventas', fechaFormateada);
  
  // Resumen del día
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del Día', 20, yInicial + 10);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Ventas: $${formatearNumero(data.resumen.totalVentas || 0)}`, 20, yInicial + 25);
  doc.text(`Total Compras: $${formatearNumero(data.resumen.totalCompras || 0)}`, 20, yInicial + 35);
  doc.text(`Utilidad Total: $${formatearNumero(data.resumen.utilidadTotal || 0)}`, 20, yInicial + 45);
  
  // Título para tabla de productos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle por Producto', 20, yInicial + 65);
  
  // Tabla de productos del día
  if (data.reporte && data.reporte.length > 0) {
    const columnas = ['Producto', 'U. Vendidas', 'Total Ventas', 'U. Compradas', 'Total Compras', 'Utilidad'];
    const filas = data.reporte.map(item => [
      item.producto_nombre || 'N/A',
      item.unidades_vendidas || 0,
      `$${formatearNumero(item.total_ventas || 0)}`,
      item.unidades_compradas || 0,
      `$${formatearNumero(item.total_compras || 0)}`,
      `$${formatearNumero(item.utilidad_dia || 0)}`
    ]);
    
    doc.autoTable({
      head: [columnas],
      body: filas,
      startY: yInicial + 80,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 152, 219] }
    });
  }
  
  const filename = `reporte_diario_${data.fecha}.pdf`;
  doc.save(filename);
  mostrarNotificacion('PDF generado exitosamente', 'success');
}

async function generarPDFMensual(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const nombreMes = document.querySelector(`#monthlyMonth option[value="${data.mes}"]`)?.textContent || data.mes;
  const fechaFormateada = `${nombreMes} ${data.año}`;
  const yInicial = await crearEncabezadoPDF(doc, 'Reporte Mensual de Ventas', fechaFormateada);
  
  // Resumen mensual
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del Mes', 20, yInicial + 10);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Ventas: $${formatearNumero(data.resumen.totalVentas || 0)}`, 20, yInicial + 25);
  doc.text(`Total Compras: $${formatearNumero(data.resumen.totalCompras || 0)}`, 20, yInicial + 35);
  doc.text(`Utilidad Total: $${formatearNumero(data.resumen.utilidadTotal || 0)}`, 20, yInicial + 45);
  
  // Título para tabla principal
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen por Producto', 20, yInicial + 65);
  
  // Tabla principal por productos
  let yActual = yInicial + 80;
  if (data.reporte && data.reporte.length > 0) {
    const columnas = ['Producto', 'U. Vendidas', 'Ventas', 'U. Compradas', 'Compras', 'Utilidad'];
    const filas = data.reporte.map(item => [
      item.producto_nombre || 'N/A',
      item.unidades_vendidas_mes || 0,
      `$${formatearNumero(item.total_ventas_mes || 0)}`,
      item.unidades_compradas_mes || 0,
      `$${formatearNumero(item.total_compras_mes || 0)}`,
      `$${formatearNumero(item.utilidad_mes || 0)}`
    ]);
    
    const tabla1 = doc.autoTable({
      head: [columnas],
      body: filas,
      startY: yActual,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] },
      didDrawPage: function (data) {
        yActual = data.cursor.y;
      }
    });
  }

  // Espaciado entre tablas y título para la segunda tabla
  yActual += 25;
  
  // Verificar si necesitamos nueva página
  if (yActual > 250) {
    doc.addPage();
    yActual = 30;
  }

  // Tabla de días con actividad
  if (data.diasActividad && data.diasActividad.length > 0) {
    // Título para la segunda tabla
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Días con Actividad', 20, yActual);
    
    yActual += 15;
    
    const columnasDias = ['Fecha', 'Productos Diferentes', 'Ventas', 'Compras', 'Utilidad'];
    const filasDias = data.diasActividad.map(dia => [
      formatearFecha(dia.fecha, true),
      dia.productos_diferentes || 0,
      `$${formatearNumero(dia.ventas_dia || 0)}`,
      `$${formatearNumero(dia.compras_dia || 0)}`,
      `$${formatearNumero(dia.utilidad_dia || 0)}`
    ]);
    
    doc.autoTable({
      head: [columnasDias],
      body: filasDias,
      startY: yActual,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 152, 219] }
    });
  }
  
  const filename = `reporte_mensual_${data.año}_${data.mes}.pdf`;
  doc.save(filename);
  mostrarNotificacion('PDF generado exitosamente', 'success');
}

async function generarPDFHistorial(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const yInicial = await crearEncabezadoPDF(doc, 'Historial de Producto', `Producto ID: ${data.productoId}`);
  
  // Tabla de historial
  if (data.reporte && data.reporte.length > 0) {
    const columnas = ['Fecha', 'Tipo', 'Cantidad', 'Precio Unit.', 'Subtotal'];
    const filas = data.reporte.map(mov => [
      formatearFecha(mov.fecha, true),
      mov.tipo || 'N/A',  // Corregido: era tipo_movimiento
      mov.cantidad || 0,
      `$${formatearNumero(mov.precio_unitario || 0)}`,
      `$${formatearNumero(mov.subtotal || 0)}`
    ]);
    
    doc.autoTable({
      head: [columnas],
      body: filas,
      startY: yInicial + 20,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 152, 219] }
    });
  }
  
  const filename = `historial_producto_${data.productoId}.pdf`;
  doc.save(filename);
  mostrarNotificacion('PDF generado exitosamente', 'success');
}

// ================================================
// NAVEGACIÓN
// ================================================

function mostrarNotificacionLocal(mensaje, tipo = 'info') {
  if (typeof NotificationManager !== 'undefined') {
    NotificationManager.show(mensaje, tipo);
  } else if (typeof window.mostrarNotificacion === 'function') {
    window.mostrarNotificacion(mensaje, tipo);
  }
}

// Registrar funciones globalmente
window.cargarReporteDiario = cargarReporteDiario;
window.cargarReporteMensual = cargarReporteMensual;
window.cargarHistorialProducto = cargarHistorialProducto;
window.exportarReporte = exportarReporte;
window.inicializarReportes = inicializarReportes;