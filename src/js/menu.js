/**
 * KONTROL - MÓDULO MENÚ PRINCIPAL
 * 
 * Funcionalidad específica para la interfaz del menú principal
 * incluyendo navegación y carga de resumen rápido
 */

// Navegación entre módulos
function navegarA(modulo) {
  if (window.electronAPI) {
    window.electronAPI.loadPage(modulo);
  } else {
    window.location.href = `${modulo}.html`;
  }
}

// Cargar resumen rápido al inicializar
document.addEventListener('DOMContentLoaded', () => {
  cargarResumenRapido();
});

async function cargarResumenRapido() {
  try {
    if (window.electronAPI && window.electronAPI.obtenerResumenRapido) {
      const resumen = await window.electronAPI.obtenerResumenRapido();
      
      document.getElementById('totalProductos').textContent = resumen.totalProductos - 1 || '0';
      document.getElementById('stockTotal').textContent = resumen.stockTotal - 1 || '0';
      document.getElementById('movimientosHoy').textContent = resumen.movimientosHoy || '0';
    } else {
      // Valores por defecto si no hay API disponible
      document.getElementById('totalProductos').textContent = '...';
      document.getElementById('stockTotal').textContent = '...';
      document.getElementById('movimientosHoy').textContent = '...';
    }
  } catch (error) {
    console.error('Error cargando resumen:', error);
    document.getElementById('totalProductos').textContent = '-';
    document.getElementById('stockTotal').textContent = '-';
    document.getElementById('movimientosHoy').textContent = '-';
  }
}
