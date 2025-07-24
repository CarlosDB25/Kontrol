/**
 * ========================================
 * KONTROL - SISTEMA UNIFICADO DE NOTIFICACIONES
 * ========================================
 * Sistema centralizado para mostrar notificaciones
 * Usado por todos los módulos de la aplicación
 */

class NotificationManager {
  static show(mensaje, tipo = 'info') {
    const container = document.getElementById('notificationContainer') || document.body;
    const notification = document.createElement('div');
    
    notification.className = `notification ${tipo}`;
    notification.innerHTML = `
      <span class="notification-icon">${this.getIcon(tipo)}</span>
      <span class="notification-text">${mensaje}</span>
    `;
    
    container.appendChild(notification);
    
    // Animación de entrada
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  static getIcon(tipo) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[tipo] || icons.info;
  }
  
  static error(mensaje) { this.show(mensaje, 'error'); }
  static success(mensaje) { this.show(mensaje, 'success'); }
  static warning(mensaje) { this.show(mensaje, 'warning'); }
  static info(mensaje) { this.show(mensaje, 'info'); }
}

// Funciones legacy para compatibilidad
const mostrarNotificacion = (mensaje, tipo) => NotificationManager.show(mensaje, tipo);
const notificarError = (msg) => NotificationManager.error(msg);
const notificarExito = (msg) => NotificationManager.success(msg);
const notificarInfo = (msg) => NotificationManager.info(msg);

// Exportar para uso global
window.NotificationManager = NotificationManager;
window.mostrarNotificacion = mostrarNotificacion;
window.notificarError = notificarError;
window.notificarExito = notificarExito;
window.notificarInfo = notificarInfo;
