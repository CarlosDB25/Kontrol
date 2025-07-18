# Sistema de Estilos CSS Modular - Kontrol App

## 📁 Estructura Modular

El CSS ha sido reorganizado en módulos específicos para mejorar la mantenibilidad, escalabilidad y rendimiento del proyecto.

### 📂 Arquitectura de Archivos

```
src/css/
├── estilos.css         # Archivo principal que importa todos los módulos
├── variables.css       # Variables CSS y sistema de diseño
├── base.css           # Estilos base, layout general y animaciones
├── buttons.css        # Botones y elementos de navegación
├── forms.css          # Formularios y controles de entrada
├── tables.css         # Tablas y visualización de datos
├── modals.css         # Modales y overlays
├── movements.css      # Componentes específicos del módulo movimientos
└── notifications.css  # Notificaciones, estados y tooltips
```

## 🎨 Sistema de Diseño

### Variables CSS Centralizadas

Todas las variables del sistema de diseño están centralizadas en `variables.css`:

- **Colores**: Paleta consistente con tokens semánticos
- **Espaciado**: Escala armoniosa de espaciados
- **Tipografía**: Familias de fuentes y escalas tipográficas
- **Sombras**: Sistema unificado de elevaciones
- **Transiciones**: Duraciones y curvas consistentes
- **Z-index**: Escala organizada para capas

### Beneficios de la Modularización

#### ✅ Mantenibilidad
- **Separación de responsabilidades**: Cada archivo tiene un propósito específico
- **Fácil localización**: Los estilos están organizados lógicamente
- **Edición segura**: Cambios aislados reducen el riesgo de efectos secundarios

#### ✅ Escalabilidad
- **Crecimiento organizado**: Nuevos componentes pueden añadirse en módulos específicos
- **Reutilización**: Variables y patrones compartidos entre módulos
- **Flexibilidad**: Fácil adición o eliminación de módulos completos

#### ✅ Rendimiento
- **Carga optimizada**: Posibilidad de cargar solo los módulos necesarios
- **Caché granular**: Cada módulo puede cachéarse independientemente
- **Compresión eficiente**: Mejor compresión por similitud de contenido

#### ✅ Colaboración
- **Conflictos reducidos**: Múltiples desarrolladores pueden trabajar en paralelo
- **Revisiones focalizadas**: Cambios más específicos y revisables
- **Documentación clara**: Cada módulo es autodocumentado

## 📋 Guía de Módulos

### `variables.css`
Sistema de tokens de diseño incluyendo:
- Paleta de colores (fondos, textos, acentos)
- Espaciados responsivos
- Tipografía (familias, tamaños, pesos)
- Sombras y elevaciones
- Sistema de z-index

### `base.css`
Fundamentos de la aplicación:
- Reset CSS básico
- Estilos del body y contenedores
- Títulos y tipografía base
- Scrollbars personalizadas
- Animaciones keyframes
- Utilidades generales

### `buttons.css`
Todos los tipos de botones:
- Botón home/navegación
- Botones primarios y secundarios
- Botones de acción (editar, eliminar)
- Estados hover, active, disabled
- Responsive design

### `forms.css`
Controles de formulario:
- Contenedores de formulario
- Inputs, textareas, selects
- Labels y grupos de input
- Estados focus y validación
- Selectores de producto específicos
- Archivos y controles especiales

### `tables.css`
Visualización de datos:
- Contenedores de tabla
- Headers y acciones
- Filas y columnas
- Estados hover y selección
- Miniaturas de productos
- Badges y indicadores
- Responsive tables

### `modals.css`
Overlays y ventanas modales:
- Modal overlay y backdrop
- Contenedores de modal
- Formularios en modal
- Botones de acción
- Animaciones de entrada/salida
- Responsive modals

### `movements.css`
Componentes específicos del módulo movimientos:
- Resumen de stock
- Selectores de tipo de movimiento
- Listas de productos para salida grupal
- Filtros avanzados
- Controles de cantidad
- Estados específicos del módulo

### `notifications.css`
Sistema de feedback:
- Notificaciones toast
- Estados de carga y error
- Badges de estado
- Skeleton loaders
- Tooltips
- Barras de progreso

## 🚀 Uso e Implementación

### Carga de Estilos
El archivo principal `estilos.css` importa todos los módulos automáticamente:

```css
@import url('./variables.css');
@import url('./base.css');
@import url('./buttons.css');
/* ... resto de imports */
```

### Adición de Nuevos Estilos
1. **Para estilos específicos de un módulo existente**: Añadir al archivo correspondiente
2. **Para nuevos componentes**: Considerar crear un nuevo módulo si es suficientemente grande
3. **Para variables nuevas**: Añadir a `variables.css` para mantener consistencia

### Mejores Prácticas
- Usar variables CSS para valores reutilizables
- Mantener especificidad baja usando clases
- Documentar componentes complejos
- Probar responsive design en cada módulo
- Seguir la convención de nomenclatura establecida

## 🔧 Futuras Mejoras

### Optimizaciones Pendientes
- [ ] Implementar CSS crítico para carga inicial más rápida
- [ ] Añadir sistema de temas (claro/oscuro)
- [ ] Crear componentes CSS con @layer para mejor cascada
- [ ] Implementar CSS Grid layouts más avanzados
- [ ] Añadir más animaciones y micro-interacciones

### Mantenimiento
- Revisar variables CSS periódicamente para eliminar las no utilizadas
- Optimizar consultas de medios para mejor responsive
- Actualizar documentación con nuevos componentes
- Realizar auditorías de rendimiento CSS regulares

---

**Nota**: Esta modularización reduce significativamente la complejidad del CSS y mejora la experiencia de desarrollo manteniendo toda la funcionalidad visual existente.
