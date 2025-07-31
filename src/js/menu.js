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
  verificarEstadoRespaldos();
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
    document.getElementById('totalProductos').textContent = '-';
    document.getElementById('stockTotal').textContent = '-';
    document.getElementById('movimientosHoy').textContent = '-';
  }
}

// Verificar estado de respaldos
async function verificarEstadoRespaldos() {
  try {
    if (window.electronAPI && window.electronAPI.getBackupStatus) {
      const result = await window.electronAPI.getBackupStatus();
      if (result.success && result.data.lastBackup) {
        const lastBackupDate = new Date(result.data.lastBackup.date);
        const now = new Date();
        const hoursDiff = (now - lastBackupDate) / (1000 * 60 * 60);
        
        // Mostrar notificación si el último respaldo es muy antiguo (más de 48 horas)
        if (hoursDiff > 48) {
          setTimeout(() => {
            if (typeof mostrarNotificacion === 'function') {
              mostrarNotificacion('⚠️ El último respaldo fue hace más de 48 horas', 'warning');
            }
          }, 3000);
        }
      }
    }
  } catch (error) {
    // Error silencioso para no afectar la experiencia del usuario
  }
}

// Crear respaldo manual
async function crearRespaldoManual() {
  try {
    if (window.electronAPI && window.electronAPI.createManualBackup) {
      if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('📦 Creando respaldo...', 'info');
      }
      
      const result = await window.electronAPI.createManualBackup();
      
      if (result.success) {
        if (typeof mostrarNotificacion === 'function') {
          mostrarNotificacion('✅ Respaldo creado exitosamente', 'success');
        }
      } else {
        if (typeof mostrarNotificacion === 'function') {
          mostrarNotificacion('❌ Error creando respaldo: ' + result.error, 'error');
        }
      }
      
      return result;
    }
  } catch (error) {
    console.error('Error creando respaldo manual:', error);
    if (typeof mostrarNotificacion === 'function') {
      mostrarNotificacion('❌ Error creando respaldo', 'error');
    }
  }
}

// Hacer disponible globalmente para uso desde el HTML
window.crearRespaldoManual = crearRespaldoManual;

// ========================================
// GESTIÓN DEL MODAL DE RESPALDOS
// ========================================

let selectedBackup = null;

// Abrir modal de respaldos
async function abrirModalRespaldos() {
  const modal = document.getElementById('backupModal');
  if (modal) {
    modal.classList.add('active');
    await cargarInformacionRespaldos();
    await actualizarListaRespaldos();
  }
}

// Cerrar modal de respaldos
function cerrarModalRespaldos() {
  const modal = document.getElementById('backupModal');
  if (modal) {
    modal.classList.remove('active');
    selectedBackup = null;
  }
}

// Cargar información general de respaldos
async function cargarInformacionRespaldos() {
  try {
    if (window.electronAPI && window.electronAPI.getBackupStatus) {
      const result = await window.electronAPI.getBackupStatus();
      
      if (result.success) {
        const lastBackupEl = document.getElementById('lastBackupInfo');
        if (result.data.lastBackup) {
          const date = new Date(result.data.lastBackup.date);
          const formattedDate = date.toLocaleString('es-ES');
          lastBackupEl.textContent = `${formattedDate} (${result.data.lastBackup.type})`;
        } else {
          lastBackupEl.textContent = 'Sin respaldos previos';
        }
      }
    }
  } catch (error) {
    console.error('Error cargando información de respaldos:', error);
  }
}

// Actualizar lista de respaldos
async function actualizarListaRespaldos() {
  const listContainer = document.getElementById('backupList');
  const totalBackupsEl = document.getElementById('totalBackups');
  
  if (!listContainer) return;
  
  try {
    listContainer.innerHTML = '<div class="backup-loading">Cargando respaldos...</div>';
    
    if (window.electronAPI && window.electronAPI.listAllBackups) {
      const result = await window.electronAPI.listAllBackups();
      
      if (result.success && result.data) {
        const backups = result.data;
        totalBackupsEl.textContent = backups.length;
        
        if (backups.length === 0) {
          listContainer.innerHTML = '<div class="backup-loading">No hay respaldos disponibles</div>';
          return;
        }
        
        listContainer.innerHTML = '';
        
        backups.forEach((backup, index) => {
          const backupItem = crearElementoRespaldo(backup, index);
          listContainer.appendChild(backupItem);
        });
      } else {
        listContainer.innerHTML = '<div class="backup-loading">Error cargando respaldos</div>';
        totalBackupsEl.textContent = '0';
      }
    }
  } catch (error) {
    console.error('Error actualizando lista de respaldos:', error);
    listContainer.innerHTML = '<div class="backup-loading">Error cargando respaldos</div>';
    totalBackupsEl.textContent = '0';
  }
}

// Crear elemento HTML para un respaldo
function crearElementoRespaldo(backup, index) {
  const item = document.createElement('div');
  item.className = 'backup-item';
  item.dataset.backupName = backup.name;
  
  const date = new Date(backup.created);
  const formattedDate = date.toLocaleString('es-ES');
  const size = formatearTamaño(backup.size);
  
  item.innerHTML = `
    <div class="backup-item-header">
      <span class="backup-item-name">${backup.name}</span>
      <span class="backup-item-type backup-type-${backup.type}">${backup.type}</span>
    </div>
    <div class="backup-item-details">
      <span class="backup-item-date">${formattedDate}</span>
      <span class="backup-item-size">${size}</span>
    </div>
    <div class="backup-item-actions">
      <button class="backup-action-btn backup-restore-btn" onclick="confirmarRestauracion('${backup.name}')">
        ⚠️ Restaurar
      </button>
    </div>
  `;
  
  item.addEventListener('click', () => seleccionarRespaldo(item, backup));
  
  return item;
}

// Seleccionar un respaldo
function seleccionarRespaldo(element, backup) {
  // Remover selección anterior
  document.querySelectorAll('.backup-item.selected').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Seleccionar nuevo
  element.classList.add('selected');
  selectedBackup = backup;
}

// Variable global para almacenar el nombre del backup seleccionado
let backupSeleccionado = null;

// Confirmar restauración con modal personalizado
function confirmarRestauracion(backupName) {
  backupSeleccionado = backupName;
  const modal = document.getElementById('backupConfirmModal');
  modal.classList.add('active');
}

// Cancelar restauración
function cancelarRestauracion() {
  backupSeleccionado = null;
  const modal = document.getElementById('backupConfirmModal');
  modal.classList.remove('active');
}

// Confirmar restauración final
function confirmarRestauracionFinal() {
  if (backupSeleccionado) {
    const modal = document.getElementById('backupConfirmModal');
    modal.classList.remove('active');
    restaurarRespaldo(backupSeleccionado);
    backupSeleccionado = null;
  }
}

// Restaurar respaldo seleccionado
async function restaurarRespaldo(backupName) {
  try {
    if (window.electronAPI && window.electronAPI.restoreBackup) {
      if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('🔄 Restaurando respaldo...', 'info');
      }
      
      const result = await window.electronAPI.restoreBackup(backupName);
      
      if (result.success) {
        if (typeof mostrarNotificacion === 'function') {
          mostrarNotificacion('✅ Base de datos restaurada exitosamente', 'success');
        }
        
        // Actualizar información después de restaurar
        setTimeout(() => {
          cargarInformacionRespaldos();
          actualizarListaRespaldos();
          cargarResumenRapido(); // Actualizar resumen del menú
        }, 1000);
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          cerrarModalRespaldos();
        }, 2000);
        
      } else {
        if (typeof mostrarNotificacion === 'function') {
          mostrarNotificacion('❌ Error restaurando respaldo: ' + result.error, 'error');
        }
      }
    }
  } catch (error) {
    console.error('Error restaurando respaldo:', error);
    if (typeof mostrarNotificacion === 'function') {
      mostrarNotificacion('❌ Error restaurando respaldo', 'error');
    }
  }
}

// Crear respaldo desde el modal
async function crearRespaldoDesdeModal() {
  const result = await crearRespaldoManual();
  if (result && result.success) {
    // Actualizar la lista y información
    setTimeout(() => {
      cargarInformacionRespaldos();
      actualizarListaRespaldos();
    }, 500);
  }
}

// Formatear tamaño de archivo
function formatearTamaño(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModalRespaldos();
    cancelarRestauracion();
  }
});

// Hacer funciones disponibles globalmente
window.abrirModalRespaldos = abrirModalRespaldos;
window.cerrarModalRespaldos = cerrarModalRespaldos;
window.actualizarListaRespaldos = actualizarListaRespaldos;
window.crearRespaldoDesdeModal = crearRespaldoDesdeModal;
window.confirmarRestauracion = confirmarRestauracion;
window.cancelarRestauracion = cancelarRestauracion;
window.confirmarRestauracionFinal = confirmarRestauracionFinal;
