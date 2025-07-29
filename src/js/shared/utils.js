// ================================================
// UTILIDADES COMPARTIDAS
// ================================================

/**
 * Vuelve al menú principal
 */
function volverAlMenu() {
  console.log('🏠 Navegando al menú principal...');
  
  if (window.electronAPI && window.electronAPI.loadPage) {
    console.log('✅ Usando electronAPI.loadPage');
    window.electronAPI.loadPage('menu');
  } else {
    console.log('⚠️ electronAPI no disponible, usando fallback');
    window.location.href = 'menu.html';
  }
}

/**
 * Formatea un número con separadores de miles y decimales
 * @param {number} numero - El número a formatear
 * @returns {string} - Número formateado como string
 */
function formatearNumero(numero) {
  if (typeof numero !== 'number') return '0.00';
  return numero.toLocaleString('es-ES', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

/**
 * Formatea una fecha al formato DD/MM/YYYY
 * @param {string} fecha - Fecha en formato ISO
 * @param {boolean} formato_completo - Si mostrar formato completo con día de semana
 * @returns {string} - Fecha formateada
 */
function formatearFecha(fecha, formato_completo = false) {
  if (!fecha) return '-';
  
  try {
    const date = new Date(fecha + (fecha.includes('T') ? '' : 'T00:00:00'));
    
    if (formato_completo) {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const año = date.getFullYear();
      return `${dia}/${mes}/${año}`;
    }
  } catch {
    return fecha || '-';
  }
}

/**
 * Valida que una fecha esté en formato válido
 * @param {string} fecha - Fecha a validar
 * @returns {boolean} - True si la fecha es válida
 */
function validarFecha(fecha) {
  if (!fecha) return false;
  const date = new Date(fecha);
  return !isNaN(date.getTime());
}

/**
 * Valida que un número sea positivo
 * @param {number|string} numero - Número a validar
 * @returns {boolean} - True si es un número positivo válido
 */
function validarNumeroPositivo(numero) {
  const num = parseFloat(numero);
  return !isNaN(num) && num > 0;
}

/**
 * Muestra una notificación de éxito
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarExito(mensaje) {
  if (typeof mostrarNotificacion === 'function') {
    mostrarNotificacion(mensaje, 'success');
  } else {
    console.log('ÉXITO:', mensaje);
  }
}

/**
 * Muestra una notificación de error
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarError(mensaje) {
  if (typeof mostrarNotificacion === 'function') {
    mostrarNotificacion(mensaje, 'error');
  } else {
    console.error('ERROR:', mensaje);
  }
}

/**
 * Limpia los campos de un formulario
 * @param {string|HTMLFormElement} formulario - Selector o elemento del formulario
 */
function limpiarFormulario(formulario) {
  const form = typeof formulario === 'string' ? document.querySelector(formulario) : formulario;
  if (form) {
    form.reset();
  }
}

/**
 * Capitaliza la primera letra de una cadena
 * @param {string} texto - Texto a capitalizar
 * @returns {string} - Texto con primera letra mayúscula
 */
function capitalizarTexto(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// ================================================
// EXPOSICIÓN GLOBAL DE FUNCIONES
// ================================================

// Hacer que las funciones estén disponibles globalmente para los HTML
window.volverAlMenu = volverAlMenu;
window.formatearNumero = formatearNumero;
window.formatearFecha = formatearFecha;
window.validarFecha = validarFecha;
window.validarNumeroPositivo = validarNumeroPositivo;
window.mostrarExito = mostrarExito;
window.mostrarError = mostrarError;
window.limpiarFormulario = limpiarFormulario;
window.capitalizarTexto = capitalizarTexto;

// Debug: Verificar que las funciones se registren correctamente
console.log('✅ Utilidades compartidas cargadas correctamente');
console.log('🔧 volverAlMenu disponible:', typeof window.volverAlMenu);
