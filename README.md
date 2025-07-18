# 📦 KONTROL - Sistema de Gestión de Inventario

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/user/kontrol)
[![Electron](https://img.shields.io/badge/electron-29.0.0-brightgreen.svg)](https://electronjs.org/)
[![SQLite](https://img.shields.io/badge/database-SQLite-orange.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> Sistema completo de control de productos e inventario desarrollado con Electron, JavaScript y SQLite.

---

## 🎯 Características Principales

### 📊 **Gestión de Productos**
- ✅ Registro y edición de productos
- ✅ Control de precios y miniaturas
- ✅ Seguimiento de stock en tiempo real
- ✅ Alertas de stock bajo

### 📈 **Movimientos de Inventario**
- ✅ Entradas y salidas grupales
- ✅ Información de stock proyectado
- ✅ Filtros avanzados por producto y fecha
- ✅ Historial completo de movimientos

### 🎨 **Interfaz Moderna**
- ✅ Diseño responsive y atractivo
- ✅ Animaciones suaves y feedback visual
- ✅ Sistema de notificaciones integrado
- ✅ Modales informativos

### 🔧 **Arquitectura Robusta**
- ✅ CSS modular (8 archivos especializados)
- ✅ JavaScript con patrones de diseño modernos
- ✅ Base de datos SQLite optimizada
- ✅ Comunicación IPC segura

---

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

- **Node.js** v16 o superior
- **npm** v8 o superior  
- **Sistema operativo**: Windows, macOS, o Linux

### 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/usuario/kontrol-electron-base.git
   cd kontrol-electron-base
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar la aplicación**
   ```bash
   npm start
   ```

### 📁 Estructura del Proyecto

```
kontrol-electron-base/
├── 📁 main/                 # Proceso principal Electron
│   ├── main.js             # Configuración de ventana principal
│   └── preload.js          # Script de preload con APIs seguras
├── 📁 ipc/                 # Comunicación entre procesos
│   ├── productosIPC.js     # Handlers para productos
│   └── movimientosIPC.js   # Handlers para movimientos
├── 📁 database/            # Base de datos SQLite
│   ├── db.js               # Operaciones de base de datos
│   └── kontrol.db          # Archivo de base de datos
├── 📁 src/                 # Frontend de la aplicación
│   ├── 📁 css/             # Estilos modularizados
│   │   ├── estilos.css     # Archivo principal de importación
│   │   ├── variables.css   # Variables y tokens de diseño
│   │   ├── base.css        # Estilos base y layout
│   │   ├── buttons.css     # Botones y controles
│   │   ├── forms.css       # Formularios y inputs
│   │   ├── tables.css      # Tablas y visualización
│   │   ├── modals.css      # Ventanas modales
│   │   ├── movements.css   # Módulo de movimientos
│   │   └── notifications.css # Sistema de notificaciones
│   ├── 📁 html/            # Interfaces de usuario
│   │   ├── menu.html       # Menú principal
│   │   ├── productos.html  # Gestión de productos
│   │   └── movimientos.html # Gestión de movimientos
│   └── 📁 js/              # Lógica del frontend
│       ├── menu.js         # Controlador del menú
│       ├── productos.js    # Controlador de productos
│       └── movimientos.js  # Controlador de movimientos
└── 📁 assets/              # Recursos estáticos
    ├── logo.ico            # Icono de la aplicación
    └── img/                # Imágenes y logos
```

---

## 💻 Tecnologías Utilizadas

### 🖥️ **Frontend**
- **HTML5**: Estructura semántica moderna
- **CSS3**: Sistema modular con variables CSS
- **JavaScript ES6+**: Programación orientada a objetos
- **Electron**: Framework de aplicaciones de escritorio

### 🗄️ **Backend**
- **Node.js**: Runtime de JavaScript
- **SQLite3**: Base de datos embebida
- **IPC**: Comunicación segura entre procesos

### 🛠️ **Herramientas**
- **npm**: Gestión de dependencias
- **VS Code**: Entorno de desarrollo recomendado

---

## 📖 Guía de Uso

### 🏠 **Pantalla Principal**
La aplicación se inicia mostrando el módulo de movimientos con:
- Formulario para registrar entradas/salidas
- Información de stock en tiempo real
- Tabla de movimientos con filtros
- Resumen general del inventario

### 📦 **Gestión de Productos**
Desde el menú principal puedes:
1. **Agregar productos** con nombre, precio y miniatura
2. **Editar información** de productos existentes
3. **Eliminar productos** (con confirmación)
4. **Ver stock actual** de todos los productos

### 📊 **Movimientos de Inventario**
Para registrar movimientos:
1. **Seleccionar tipo** (Entrada o Salida)
2. **Agregar productos** uno por uno con cantidades
3. **Ver información de stock** proyectado en tiempo real
4. **Registrar movimiento** con descripción y observaciones

### 🔍 **Filtros y Búsqueda**
Filtrar movimientos por:
- **Tipo de movimiento** (Entradas/Salidas)
- **Producto específico**
- **Rango de fechas**
- **Combinación de filtros**

---

## 🏗️ Arquitectura del Código

### 🎨 **Sistema CSS Modular**

El CSS está organizado en 8 módulos especializados:

```css
/* estilos.css - Punto de entrada */
@import url('./variables.css');    /* Tokens de diseño */
@import url('./base.css');         /* Fundamentos */
@import url('./buttons.css');      /* Botones */
@import url('./forms.css');        /* Formularios */
@import url('./tables.css');       /* Tablas */
@import url('./modals.css');       /* Modales */
@import url('./movements.css');    /* Movimientos */
@import url('./notifications.css'); /* Notificaciones */
```

**Beneficios**:
- 🔍 **Fácil mantenimiento**: Cada módulo tiene responsabilidad específica
- 🚀 **Escalabilidad**: Agregar nuevos componentes sin conflictos
- 👥 **Colaboración**: Múltiples desarrolladores sin pisarse
- ⚡ **Performance**: Posibilidad de carga condicional

### 💻 **JavaScript Moderno**

Arquitectura basada en clases con separación de responsabilidades:

```javascript
// Gestión de estado centralizada
class AppState {
  constructor() {
    this.productos = [];
    this.movimientos = [];
  }
  // Métodos para manipulación segura
}

// Controlador principal
class MovimientosController {
  constructor() {
    this.dom = new DOMManager();      // Referencias DOM
    this.state = new AppState();      // Estado de aplicación
  }
  // Lógica de negocio organizada
}

// Gestión de datos separada
class DataManager {
  static async cargarProductos() { /* API calls */ }
  static async registrarMovimiento() { /* Database ops */ }
}
```

### 🗄️ **Base de Datos**

Esquema optimizado con relaciones claras:

```sql
-- Tabla principal de productos
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

-- Movimientos grupales (entradas/salidas)
CREATE TABLE salidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,              -- 'entrada' o 'salida'
  descripcion TEXT NOT NULL,
  observaciones TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Detalle de productos por movimiento
CREATE TABLE salidas_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  salida_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_actual INTEGER NOT NULL,
  FOREIGN KEY (salida_id) REFERENCES salidas (id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos (id)
);
```

---

## 🔧 Configuración Avanzada

### ⚙️ **Variables de Configuración**

En `src/js/movimientos.js`:

```javascript
const CONFIG = {
  STOCK_MINIMO: 5,           // Umbral para alertas de stock bajo
  MAX_PRODUCTOS_TAG: 3,      // Productos visibles en tabla antes de "..."
  ANIMATION_DELAY: 50        // Delay entre animaciones (ms)
};
```

### 🎨 **Personalización de Tema**

En `src/css/variables.css`:

```css
:root {
  /* Colores principales */
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --accent-color: #e74c3c;
  
  /* Espaciados */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

### 🔒 **Configuración de Seguridad**

La aplicación implementa:
- **Context Isolation**: APIs expuestas de forma segura
- **Sanitización**: Prevención de XSS en inputs
- **Validación**: Verificación de datos en cliente y servidor

---

## 🐛 Solución de Problemas

### ❌ **Problemas Comunes**

#### Error: "Cannot find module sqlite3"
```bash
# Reinstalar sqlite3 nativo para Electron
npm rebuild sqlite3 --runtime=electron --target=$(electron --version) --disturl=https://electronjs.org/headers
```

#### Error: "Base de datos bloqueada"
```bash
# Cerrar completamente la aplicación antes de reiniciar
```

#### CSS no se actualiza
```bash
# Limpiar caché del navegador en modo desarrollo
Ctrl + F5 (Windows/Linux)
Cmd + Shift + R (macOS)
```

### 📝 **Logs y Debugging**

Los logs se muestran en:
- **Consola del desarrollador**: F12 en la aplicación
- **Terminal**: Mensajes del proceso principal
- **Base de datos**: Errores SQL en consola

---

## 🤝 Contribución

### 🔀 **Cómo Contribuir**

1. **Fork** el repositorio
2. **Crear branch** para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** al branch (`git push origin feature/nueva-funcionalidad`)
5. **Crear Pull Request**

### 📏 **Estándares de Código**

- **JavaScript**: ES6+, clases para organización
- **CSS**: Variables CSS, nomenclatura BEM cuando aplique
- **Commits**: Mensajes descriptivos en español
- **Documentación**: Comentarios para funciones complejas

### 🧪 **Testing**

Antes de hacer commit:
- ✅ Probar todas las funcionalidades principales
- ✅ Verificar responsive design
- ✅ Revisar consola de errores
- ✅ Validar performance

---

## 📋 Changelog

### v1.0.0 (Julio 2025)
- ✅ **MAJOR**: Refactorización completa del sistema CSS
- ✅ **FEATURE**: Información de stock en tiempo real
- ✅ **FEATURE**: Filtros avanzados por múltiples productos
- ✅ **IMPROVEMENT**: Arquitectura JavaScript orientada a objetos
- ✅ **IMPROVEMENT**: Base de datos optimizada con índices
- ✅ **FIX**: Corrección de lógica de filtros
- ✅ **DOCS**: Documentación completa del proyecto

---

## 📞 Soporte

### 🆘 **Obtener Ayuda**

- **Issues**: Reportar bugs en GitHub Issues
- **Documentación**: Consultar archivos README.md en cada módulo
- **Auditoría**: Ver `PROJECT-AUDIT.md` para detalles técnicos

### 🏷️ **Versiones**

- **Actual**: v1.0.0 (Estable)
- **Próxima**: v1.1.0 (Funcionalidades adicionales)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

- **Electron Team**: Por el framework excepcional
- **SQLite**: Por la base de datos confiable
- **VS Code**: Por el excelente entorno de desarrollo
- **Comunidad**: Por las mejores prácticas y patrones

---

**Desarrollado con ❤️ para gestión eficiente de inventarios**

*Última actualización: 17 de julio de 2025*

Productos
  Quitar precio

Entradas y salidas
  precio compra: libre (entradas)
  precio venta: libre (salidas)
  Boton edicion


reportes: utilidades -> utilidad x producto -> utilidad x dia
  Variedades JL
  inversion, gasto -> utilidades 

menu intuitivo
Documento de induccion