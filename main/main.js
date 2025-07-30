const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// 👉 IMPORTAMOS los handlers
require('../ipc/productosIPC.js');
require('../ipc/movimientosIPC.js');
require('../ipc/reportesIPC.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: path.join(__dirname, '..', 'assets', 'logo.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, '../src/html/menu.html'));
}

// Handler para navegación entre páginas
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

app.whenReady().then(createWindow);
