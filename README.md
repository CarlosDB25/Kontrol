# 📊 KONTROL - Sistema de Gestión de Inventario

![Kontrol Logo](assets/img/Kontrol%20logo.png)

**Kontrol** es una aplicación de escritorio desarrollada con **Electron** para la gestión completa de inventarios, movimientos de productos y generación de reportes empresariales. Diseñada para pequeñas y medianas empresas que necesitan un control eficiente de su stock.

## 🚀 Características Principales

### 📦 **Gestión de Productos**
- ✅ Registro completo de productos con miniaturas
- ✅ Control de stock en tiempo real  
- ✅ Edición y eliminación de productos
- ✅ Sistema de productos activos/inactivos
- ✅ Búsqueda y filtrado avanzado

### 📈 **Control de Movimientos**
- ✅ Registro de entradas (compras/reposición)
- ✅ Registro de salidas (ventas/gastos)
- ✅ Salidas grupales para múltiples productos
- ✅ Historial completo de movimientos
- ✅ Actualización automática de stock
- ✅ Manejo de precios por movimiento

### 📊 **Reportes y Análisis**
- ✅ **Reportes Diarios**: Ventas, compras y utilidades del día
- ✅ **Reportes Mensuales**: Análisis mensual completo con días de actividad
- ✅ **Historial de Productos**: Seguimiento detallado por producto
- ✅ **Indicadores Clave**: Métricas empresariales en tiempo real
- ✅ **Exportación a CSV**: Descarga de todos los reportes

### 🎨 **Interfaz y UX**
- ✅ Diseño moderno y responsivo
- ✅ Sistema de notificaciones integrado
- ✅ Navegación fluida entre módulos
- ✅ Estados de carga y feedback visual
- ✅ Tema consistente con variables CSS

## 🛠️ Tecnologías Utilizadas

| Tecnología | Propósito | Versión |
|------------|-----------|---------|
| **Electron** | Framework de aplicación de escritorio | ^Latest |
| **Node.js** | Runtime de JavaScript | ^Latest |
| **SQLite3** | Base de datos local | ^Latest |
| **HTML5 + CSS3** | Frontend y estilos | ^Latest |
| **JavaScript ES6+** | Lógica de negocio | ^Latest |

## 📁 Estructura del Proyecto

```
Kontrol-Base/
├── 📁 assets/                 # Recursos gráficos
│   ├── logo.ico              # Icono de la aplicación
│   └── img/                  # Imágenes y logos
├── 📁 database/              # Módulo de base de datos
│   ├── config.js             # Configuración de SQLite
│   ├── db.js                 # Módulo principal unificado
│   ├── init.js               # Inicialización y migraciones
│   ├── productos-db.js       # Funciones de productos
│   ├── movimientos-db.js     # Funciones de movimientos
│   ├── reportes-db.js        # Funciones de reportes
│   └── kontrol.db            # Base de datos SQLite
├── 📁 ipc/                   # Comunicación IPC
│   ├── productosIPC.js       # IPC para productos
│   ├── movimientosIPC.js     # IPC para movimientos
│   └── reportesIPC.js        # IPC para reportes
├── 📁 main/                  # Proceso principal
│   ├── main.js               # Punto de entrada de Electron
│   └── preload.js            # Script de precarga
├── 📁 src/                   # Código fuente frontend
│   ├── 📁 css/               # Hojas de estilo
│   │   ├── variables.css     # Variables CSS globales
│   │   ├── base.css          # Estilos base
│   │   ├── buttons.css       # Estilos de botones
│   │   ├── forms.css         # Estilos de formularios
│   │   ├── tables.css        # Estilos de tablas
│   │   ├── modals.css        # Estilos de modales
│   │   ├── menu.css          # Estilos del menú
│   │   ├── movements.css     # Estilos de movimientos
│   │   ├── reportes.css      # Estilos de reportes
│   │   ├── notifications.css # Sistema de notificaciones
│   │   └── estilos.css       # CSS principal
│   ├── 📁 html/              # Páginas HTML
│   │   ├── menu.html         # Menú principal
│   │   ├── productos.html    # Gestión de productos
│   │   ├── movimientos.html  # Gestión de movimientos
│   │   └── reportes.html     # Módulo de reportes
│   └── 📁 js/                # Scripts JavaScript
│       ├── menu.js           # Lógica del menú
│       ├── productos.js      # Lógica de productos
│       ├── movimientos.js    # Lógica de movimientos
│       ├── reportes.js       # Lógica de reportes
│       └── 📁 shared/        # Módulos compartidos
│           └── notifications.js # Sistema de notificaciones
├── package.json              # Dependencias y scripts
└── README.md                 # Documentación del proyecto
```

## 🗄️ Estructura de Base de Datos

### **Tabla: productos**
```sql
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  miniatura TEXT,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Tabla: movimientos**
```sql
CREATE TABLE movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  descripcion TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Tabla: movimientos_detalle**
```sql
CREATE TABLE movimientos_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movimiento_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  FOREIGN KEY (movimiento_id) REFERENCES movimientos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js (versión 16 o superior)
- npm o yarn
- Git

### **Pasos de instalación**

1. **Clonar el repositorio**
```bash
git clone https://github.com/CarlosDB25/Kontrol.git
cd Kontrol-Base
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Inicializar la base de datos**
```bash
# La base de datos se inicializa automáticamente al ejecutar la aplicación
```

4. **Ejecutar la aplicación**
```bash
npm start
```

### **Scripts disponibles**
```json
{
  "start": "electron .",
  "dev": "electron . --dev",
  "build": "electron-builder",
  "pack": "electron-builder --dir"
}
```

## 📖 Guía de Uso

### **1. Gestión de Productos**

#### **Agregar Producto**
1. Navegue a **Productos** desde el menú principal
2. Haga clic en **"Agregar Producto"**
3. Complete el formulario:
   - **Nombre**: Nombre del producto (obligatorio)
   - **Miniatura**: URL de imagen (opcional)
4. Haga clic en **"Guardar"**

#### **Editar Producto**
1. Localice el producto en la tabla
2. Haga clic en el botón **"Editar"** (✏️)
3. Modifique los campos necesarios
4. Guarde los cambios

#### **Eliminar Producto**
1. Localice el producto en la tabla
2. Haga clic en el botón **"Eliminar"** (🗑️)
3. Confirme la acción

### **2. Registro de Movimientos**

#### **Entrada de Productos (Compras/Reposición)**
1. Navegue a **Movimientos**
2. Seleccione **"Entrada"**
3. Complete el formulario:
   - **Producto**: Seleccione de la lista o busque
   - **Cantidad**: Unidades a agregar
   - **Precio Unitario**: Costo por unidad
   - **Descripción**: Motivo de la entrada
4. Haga clic en **"Registrar Entrada"**

#### **Salida de Productos (Ventas/Gastos)**
1. Seleccione **"Salida"**
2. Complete el formulario similar a entrada
3. Para **salidas grupales**:
   - Agregue múltiples productos
   - Configure cantidades individuales
   - Registre todo en una sola transacción

### **3. Generación de Reportes**

#### **Reporte Diario**
1. Navegue a **Reportes**
2. En la pestaña **"Reporte Diario"**
3. Seleccione la fecha deseada
4. Haga clic en **"Generar Reporte"**
5. Visualice métricas y tabla detallada

#### **Reporte Mensual**
1. Seleccione la pestaña **"Reporte Mensual"**
2. Elija año y mes
3. Genere el reporte para ver:
   - Resumen mensual por producto
   - Días con actividad
   - Indicadores de rendimiento

#### **Historial de Producto**
1. Seleccione **"Historial Producto"**
2. Elija el producto específico
3. Opcionalmente configure rango de fechas
4. Visualice todos los movimientos del producto

## 🔧 Arquitectura del Sistema

### **Patrón de Arquitectura**
Kontrol utiliza una arquitectura **MVC (Model-View-Controller)** adaptada para Electron:

- **Model**: Módulos de base de datos (`database/`)
- **View**: Páginas HTML y CSS (`src/html/`, `src/css/`)
- **Controller**: Scripts JavaScript y IPC (`src/js/`, `ipc/`)

### **Comunicación IPC**
La comunicación entre el proceso principal y los procesos renderer se maneja mediante:

```javascript
// Renderer Process (Frontend)
const resultado = await window.electronAPI.invoke('productos:obtener');

// Main Process (Backend)
ipcMain.handle('productos:obtener', async () => {
  return await obtenerProductos();
});
```

### **Sistema de Notificaciones**
Sistema centralizado para feedback al usuario:

```javascript
NotificationManager.success('Operación exitosa');
NotificationManager.error('Error en la operación');
NotificationManager.warning('Advertencia importante');
NotificationManager.info('Información relevante');
```

## 🎨 Sistema de Estilos

### **Variables CSS**
El sistema utiliza variables CSS para mantener consistencia:

```css
:root {
  /* Colores principales */
  --accent-primary: #2196f3;
  --accent-success: #4caf50;
  --accent-warning: #ff9800;
  --accent-danger: #f44336;
  
  /* Espaciado */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Tipografía */
  --font-family-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}
```

### **Componentes Reutilizables**
- **Botones**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Formularios**: `.form-group`, `.form-input`, `.form-select`
- **Tablas**: `.data-table`, `.table-container`, `.table-actions`
- **Modales**: `.modal`, `.modal-content`, `.modal-header`

## 🔒 Seguridad y Mejores Prácticas

### **Seguridad Electron**
- ✅ **Context Isolation**: Habilitado para aislar contextos
- ✅ **Node Integration**: Deshabilitado en renderer
- ✅ **Preload Scripts**: Para exposición segura de APIs
- ✅ **CSP**: Content Security Policy implementado

### **Validación de Datos**
- ✅ Validación en frontend y backend
- ✅ Sanitización de inputs de usuario
- ✅ Manejo de errores robusto
- ✅ Transacciones de base de datos

### **Gestión de Errores**
```javascript
try {
  const resultado = await operacionBaseDatos();
  NotificationManager.success('Operación exitosa');
} catch (error) {
  console.error('Error:', error);
  NotificationManager.error(`Error: ${error.message}`);
}
```

## 📊 Indicadores y Métricas

### **Métricas Empresariales**
- **Ventas Totales**: Ingresos por período
- **Compras Totales**: Egresos por período  
- **Utilidad Total**: Ganancia neta calculada
- **Productos Activos**: Productos con movimientos
- **Rotación de Inventory**: Frecuencia de movimientos

### **Análisis de Rendimiento**
- **Días con Actividad**: Días operativos del negocio
- **Productos Más Vendidos**: Ranking por volumen
- **Tendencias Temporales**: Patrones de venta/compra
- **Stock Crítico**: Productos con bajo inventario

## 🚀 Roadmap y Mejoras Futuras

### **Versión 2.0 (Planificada)**
- [ ] **Dashboard Analítico**: Gráficos y visualizaciones
- [ ] **Códigos de Barras**: Integración con lectores
- [ ] **Múltiples Almacenes**: Gestión multi-ubicación
- [ ] **Usuarios y Permisos**: Sistema de roles
- [ ] **Sincronización Cloud**: Backup en la nube
- [ ] **API REST**: Integración con sistemas externos

### **Mejoras Técnicas**
- [ ] **TypeScript**: Migración para mejor tipado
- [ ] **Testing**: Suite de pruebas automatizadas
- [ ] **CI/CD**: Pipeline de integración continua
- [ ] **Docker**: Contenarización para despliegue
- [ ] **Logging**: Sistema de logs avanzado

## 🐛 Resolución de Problemas

### **Problemas Comunes**

#### **"Error de base de datos"**
```bash
# Solución: Eliminar y reinicializar BD
rm database/kontrol.db
npm start
```

#### **"Electron no inicia"**
```bash
# Solución: Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### **"Reportes no cargan"**
- Verificar que existan datos en la base de datos
- Revisar logs en consola de desarrollador (F12)
- Confirmar que los IPCs estén registrados

### **Logs y Depuración**
```javascript
// Activar modo desarrollo
npm run dev

// Ver logs en consola
console.log('Debug info:', data);

// Abrir DevTools
Ctrl + Shift + I
```

## 🤝 Contribución

### **Cómo Contribuir**
1. **Fork** el repositorio
2. **Clone** tu fork localmente
3. **Crea** una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
4. **Commit** tus cambios: `git commit -m 'Agregar nueva funcionalidad'`
5. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
6. **Crea** un Pull Request

### **Estándares de Código**
- **Nomenclatura**: camelCase para variables, PascalCase para clases
- **Comentarios**: JSDoc para funciones importantes
- **Estructura**: Mantener organización de carpetas
- **Estilos**: Seguir convenciones CSS establecidas

### **Reportar Bugs**
Utiliza el sistema de Issues de GitHub con:
- **Título descriptivo**
- **Pasos para reproducir**
- **Comportamiento esperado vs actual**
- **Capturas de pantalla** (si aplica)
- **Información del sistema**

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Consulta el archivo `LICENSE` para más detalles.

```
MIT License

Copyright (c) 2025 Carlos DB

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👨‍💻 Autor

**Carlos DB** - [@CarlosDB25](https://github.com/CarlosDB25)

- **GitHub**: [https://github.com/CarlosDB25](https://github.com/CarlosDB25)
- **Email**: carlosdiazmaerio@gmail.com


<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

![Kontrol](assets/img/icono.png)

**Kontrol - Control Total de tu Inventario** 📊

</div>
