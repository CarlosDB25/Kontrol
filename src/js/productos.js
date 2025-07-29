/*
 * ========================================
 * KONTROL - GESTIÓN DE PRODUCTOS 
 * ========================================
 * 
 * CAMBIOS REALIZADOS - Julio 2025:
 * ✅ Interfaz simplificada: solo nombre y miniatura en el formulario
 * ✅ La tabla productos SÍ incluye precios en BD:
 *    - precio_compra (default: 0)
 *    - precio_venta (default: 0)  
 *    - utilidad (calculada automáticamente)
 * ✅ Los precios se gestionarán en otro módulo separado
 * ✅ Vista productos.html no muestra ni permite editar precios
 * ✅ Migración automática de estructura de base de datos
 * 
 * Estructura actual de productos:
 * - id, nombre, miniatura, precio_compra, precio_venta, utilidad, stock
 * - Solo nombre y miniatura son editables desde esta interfaz
 * 
 * Mejoras previas mantenidas:
 * ✅ Protección contra XSS con sanitización
 * ✅ Mejoras de accesibilidad (aria-label, title)
 * ✅ Animaciones de salida para modales
 * ✅ Sistema de notificaciones
 * 
 * Autor: Sistema de gestión de inventario
 * Última actualización: Julio 2025
 */

const form = document.getElementById('formProducto');
const tabla = document.querySelector('#tablaProductos tbody');
const productCount = document.getElementById('productCount');

// Referencias al modal de edición
const modal = document.getElementById('modalEditar');
const modalOverlay = document.getElementById('modalOverlay');
const formEditar = document.getElementById('formEditar');

const editId = document.getElementById('editId');
const editNombre = document.getElementById('editNombre');
const editMiniatura = document.getElementById('editMiniatura');

// Variable para almacenar la miniatura actual del producto siendo editado
let miniaturaActual = null;

// Sistema de notificaciones - Importado desde shared/notifications.js
// Las funciones están disponibles globalmente

// Función para sanitizar texto y prevenir XSS
function sanitizarTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Cargar productos desde la base de datos y mostrarlos en la tabla
async function cargarProductos() {
  try {
    const productos = await window.api.obtenerProductos();
    tabla.innerHTML = '';
    
    // Actualizar contador de productos
    productCount.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''}`;

    productos.forEach((prod, index) => {
      const fila = document.createElement('tr');
      fila.className = 'slide-in-right';
      fila.style.animationDelay = `${index * 0.1}s`;
      
      fila.innerHTML = `
        <td class="col-id">#${prod.id.toString().padStart(3, '0')}</td>
        <td class="col-miniatura">
          ${prod.miniatura ? 
            `<img src="${prod.miniatura}" alt="${sanitizarTexto(prod.nombre)}" class="miniatura-producto" />` : 
            '<div class="miniatura-placeholder">📦</div>'
          }
        </td>
        <td class="col-nombre">${sanitizarTexto(prod.nombre)}</td>
        <td class="col-acciones">
          <div class="action-buttons">
            <button class="btn-edit" 
                    onclick="actualizarProducto(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}', '${prod.miniatura || ''}')" 
                    data-tooltip="Editar producto"
                    aria-label="Editar producto ${sanitizarTexto(prod.nombre)}"
                    title="Editar producto">
              ✏️Editar
            </button>
            <button class="btn-delete" 
                    onclick="eliminar(${prod.id})" 
                    data-tooltip="Eliminar producto"
                    aria-label="Eliminar producto ${sanitizarTexto(prod.nombre)}"
                    title="Eliminar producto">
              🗑️Eliminar
            </button>
          </div>
        </td>
      `;
      tabla.appendChild(fila);
    });
    
    if (productos.length === 0) {
      const filaVacia = document.createElement('tr');
      filaVacia.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 16px;">📦</div>
          <div style="font-size: 1.1rem; margin-bottom: 8px;">No hay productos registrados</div>
          <div style="font-size: 0.9rem;">Agrega tu primer producto usando el formulario de arriba</div>
        </td>
      `;
      tabla.appendChild(filaVacia);
    }
    
  } catch (error) {
    notificarError('Error al cargar productos: ' + error.message);
  }
}

// Agregar nuevo producto
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const loading = submitBtn.querySelector('.loading');
  
  // Mostrar loading
  btnText.style.display = 'none';
  loading.style.display = 'inline-block';
  submitBtn.disabled = true;
  
  try {
    // Obtener la miniatura si se seleccionó un archivo
    let miniatura = null;
    const miniaturaFile = form.miniatura.files[0];
    if (miniaturaFile) {
      if (miniaturaFile.size > 5 * 1024 * 1024) { // 5MB límite
        throw new Error('La imagen es demasiado grande. Máximo 5MB.');
      }
      miniatura = await convertirArchivoABase64(miniaturaFile);
    }

    const producto = {
      nombre: form.nombre.value.trim(),
      miniatura: miniatura
    };
    
    // Validaciones adicionales
    if (producto.nombre.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    
    await window.api.agregarProducto(producto);
    form.reset();
    cargarProductos();
    notificarExito(`Producto "${producto.nombre}" agregado exitosamente`);
    
  } catch (error) {
    notificarError('Error al agregar producto: ' + error.message);
  } finally {
    // Ocultar loading
    btnText.style.display = 'inline';
    loading.style.display = 'none';
    submitBtn.disabled = false;
  }
});

// Eliminar producto con confirmación mejorada
async function eliminar(id) {
  // Obtener información del producto para mostrar en confirmación
  const productos = await window.api.obtenerProductos();
  const producto = productos.find(p => p.id === id);
  
  if (!producto) {
    notificarError('Producto no encontrado');
    return;
  }
  
  const confirmado = confirm(
    `¿Estás seguro de que deseas eliminar este producto?\n\n` +
    `Producto: ${producto.nombre}\n\n` +
    `Esta acción no se puede deshacer.`
  );
  
  if (!confirmado) return;

  try {
    await window.api.eliminarProducto(id);
    cargarProductos();
    notificarExito(`Producto "${producto.nombre}" eliminado exitosamente`);
  } catch (error) {
    notificarError('Error al eliminar producto: ' + error.message);
  }
}

// Función para mostrar preview de la imagen actual en el modal
function mostrarPreviewImagenActual(miniatura) {
  // Buscar o crear el contenedor de preview
  let previewContainer = document.getElementById('previewImagenActual');
  if (!previewContainer) {
    previewContainer = document.createElement('div');
    previewContainer.id = 'previewImagenActual';
    previewContainer.className = 'preview-imagen-actual';
    
    // Insertar después del input de miniatura
    editMiniatura.parentNode.insertBefore(previewContainer, editMiniatura.nextSibling);
  }
  
  if (miniatura && miniatura.trim() !== '') {
    previewContainer.innerHTML = `
      <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--surface-color); border-radius: 8px; border: 1px solid var(--border-color);">
        <img src="${miniatura}" alt="Imagen actual" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" />
        <div style="flex: 1;">
          <div style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 4px;">📷 Imagen actual</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Elimina para reemplazarla.</div>
        </div>
        <button type="button" onclick="eliminarImagenActual()" style="padding: 6px 12px; background: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" title="Eliminar imagen actual">
          🗑️ Eliminar
        </button>
      </div>
    `;
  } else {
    previewContainer.innerHTML = `
      <div style="margin-top: 10px; padding: 12px; background: var(--surface-color); border-radius: 8px; border: 1px solid var(--border-color); text-align: center; color: var(--text-muted);">
        📷 No hay imagen actual
      </div>
    `;
  }
}

// Función para eliminar la imagen actual
function eliminarImagenActual() {
  const confirmado = confirm('¿Estás seguro de que quieres eliminar la imagen actual del producto?');
  if (confirmado) {
    miniaturaActual = null;
    mostrarPreviewImagenActual(null);
    notificarInfo('Imagen marcada para eliminar. Guarda los cambios para confirmar.');
  }
}

// Función para cancelar la selección de nueva imagen
function cancelarNuevaImagen() {
  editMiniatura.value = '';
  mostrarPreviewImagenActual(miniaturaActual);
}

// Mostrar el modal de edición con datos actuales
function actualizarProducto(id, nombre, miniatura = '') {
  editId.value = id;
  editNombre.value = nombre;
  
  // Almacenar la miniatura actual
  miniaturaActual = miniatura;
  
  // Mostrar preview de la imagen actual
  mostrarPreviewImagenActual(miniatura);
  
  // Limpiar el input de archivo
  editMiniatura.value = '';
  
  // Mostrar overlay y modal con transición
  modalOverlay.classList.add('active');
  modal.classList.add('active');
}

// Cerrar modal sin guardar con animación mejorada
function cerrarModal() {
  // Agregar clase de salida para animación
  modal.classList.add('closing');
  modalOverlay.classList.add('closing');
  
  // Después de la animación, ocultar completamente
  setTimeout(() => {
    modal.classList.remove('active', 'closing');
    modalOverlay.classList.remove('active', 'closing');
    formEditar.reset();
    
    // Limpiar preview de imagen y variables
    const previewContainer = document.getElementById('previewImagenActual');
    if (previewContainer) {
      previewContainer.innerHTML = '';
    }
    miniaturaActual = null;
  }, 300);
}

// Guardar cambios desde el modal con validaciones
formEditar.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = formEditar.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Guardando...';
  submitBtn.disabled = true;
  
  try {
    const id = Number(editId.value);
    const nombre = editNombre.value.trim();
    
    // Determinar qué miniatura usar
    let miniatura = miniaturaActual; // Por defecto, mantener la actual
    
    // Si se seleccionó un nuevo archivo, usarlo
    const miniaturaFile = editMiniatura.files[0];
    if (miniaturaFile) {
      if (miniaturaFile.size > 5 * 1024 * 1024) { // 5MB límite
        throw new Error('La imagen es demasiado grande. Máximo 5MB.');
      }
      miniatura = await convertirArchivoABase64(miniaturaFile);
    }
    
    // Si miniaturaActual es null, significa que se eliminó intencionalmente
    if (miniaturaActual === null) {
      miniatura = null;
    }

    // Validaciones
    if (nombre.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    await window.api.editarProducto({ id, nombre, miniatura });
    cerrarModal();
    cargarProductos();
    notificarExito(`Producto "${nombre}" actualizado exitosamente`);
    
  } catch (error) {
    notificarError('Error al actualizar producto: ' + error.message);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Efectos adicionales y funcionalidades
document.addEventListener('DOMContentLoaded', () => {
  // Preview de imagen nueva seleccionada en el modal de edición
  editMiniatura.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notificarError('La imagen es demasiado grande. Máximo 5MB.');
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Actualizar el preview para mostrar la nueva imagen
        let previewContainer = document.getElementById('previewImagenActual');
        if (previewContainer) {
          previewContainer.innerHTML = `
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--surface-color); border-radius: 8px; border: 1px solid var(--primary-color);">
              <img src="${e.target.result}" alt="Nueva imagen" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--primary-color);" />
              <div style="flex: 1;">
                <div style="font-size: 0.9rem; color: var(--primary-color); margin-bottom: 4px;">📷 Nueva imagen seleccionada</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Esta imagen reemplazará a la actual al guardar</div>
              </div>
              <button type="button" onclick="cancelarNuevaImagen()" style="padding: 6px 12px; background: var(--secondary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" title="Cancelar selección">
                ❌ Cancelar
              </button>
            </div>
          `;
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Agregar efectos de hover a las filas de la tabla
  const observer = new MutationObserver(() => {
    const filas = tabla.querySelectorAll('tr');
    filas.forEach(fila => {
      if (!fila.hasAttribute('data-hover-added')) {
        fila.setAttribute('data-hover-added', 'true');
        fila.addEventListener('mouseenter', () => {
          fila.style.transform = 'translateX(4px)';
        });
        fila.addEventListener('mouseleave', () => {
          fila.style.transform = 'translateX(0)';
        });
      }
    });
  });
  
  observer.observe(tabla, { childList: true });
  
  // Auto-focus en el primer campo del formulario
  const primerInput = form.querySelector('input');
  if (primerInput) primerInput.focus();
});

// Función para actualizar el contador en tiempo real
function actualizarContador() {
  const filas = tabla.querySelectorAll('tr');
  const count = filas.length === 1 && filas[0].querySelector('td[colspan]') ? 0 : filas.length;
  productCount.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
}

// Cerrar modal con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    cerrarModal();
  }
});

// Prevenir envío accidental del formulario con Enter en campos numéricos
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.querySelector('button[type="submit"]').click();
    }
  });
});

// Inicialización
cargarProductos();

// Función para convertir archivo a base64
function convertirArchivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}

// Hacemos accesibles funciones al HTML globalmente
window.eliminar = eliminar;
window.actualizarProducto = actualizarProducto;
window.cerrarModal = cerrarModal;
window.eliminarImagenActual = eliminarImagenActual;
window.cancelarNuevaImagen = cancelarNuevaImagen;
