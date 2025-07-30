const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let splashWindow;

// ⚡ SPLASH ULTRA-RÁPIDO - Optimizado para hardware limitado
function createUltraFastSplash() {
  console.log('⚡ Splash ultra-rápido...');
  
  splashWindow = new BrowserWindow({
    width: 400,        // Más pequeño para menos procesamiento
    height: 300,       // Más pequeño para menos procesamiento
    frame: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      offscreen: false,
      enableRemoteModule: false,
      experimentalFeatures: false
    }
  });

  splashWindow.loadFile(path.join(__dirname, '../src/html/simple-splash.html'));
  
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
    console.log('✨ Splash visible - Cargando módulos...');
    
    // Delay más corto para hardware limitado
    setTimeout(() => {
      loadAppModules();
    }, 50);
  });
}

// 📦 Cargar módulos pesados con delay
async function loadAppModules() {
  console.log('📦 Cargando módulos...');
  
  try {
    const { inicializarBaseDatos } = require('../database/db');
    
    require('../ipc/productosIPC.js');
    require('../ipc/movimientosIPC.js');
    require('../ipc/reportesIPC.js');
    
    await inicializarBaseDatos();
    console.log('✅ Módulos listos');
    
    createMainWindow();
  } catch (error) {
    console.error('❌ Error:', error);
    createMainWindow();
  }
}

function createMainWindow() {
  console.log('🚀 Creando ventana principal...');
  
  mainWindow = new BrowserWindow({
    width: 1000,       // Tamaño inicial antes de maximizar
    height: 700,       // Tamaño inicial antes de maximizar
    icon: path.join(__dirname, '..', 'assets', 'logo.ico'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      offscreen: false,
      enableRemoteModule: false,
      experimentalFeatures: false,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/html/menu.html'));
  
  mainWindow.once('ready-to-show', () => {
    console.log('✅ App lista, maximizando y cerrando splash');
    
    // Maximizar DESPUÉS de que esté lista para mejor rendimiento
    mainWindow.maximize();
    mainWindow.show();
    
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      console.log('✨ Splash cerrado');
    }
  });
}

// Handler de navegación (SOLO UNO)
ipcMain.handle('navigate-to', async (event, page) => {
  const pages = {
    'menu': '../src/html/menu.html',
    'productos': '../src/html/productos.html',
    'movimientos': '../src/html/movimientos.html',
    'reportes': '../src/html/reportes.html'
  };
  
  if (pages[page] && mainWindow) {
    mainWindow.loadFile(path.join(__dirname, pages[page]));
  }
});

// ⚡ ARRANQUE ULTRA-RÁPIDO
app.whenReady().then(() => {
  console.log('🚀 Electron listo - Splash ultra-rápido');
  createUltraFastSplash();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createUltraFastSplash();
  }
});
