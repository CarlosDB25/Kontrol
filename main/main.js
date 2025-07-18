const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// 👉 IMPORTAMOS los handlers
require('../ipc/productosIPC.js');
require('../ipc/movimientosIPC.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'assets', 'img', 'icono.png'), // Usando PNG en lugar de ICO
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  // 👇 Oculta el menú por completo
  Menu.setApplicationMenu(null);
  
  win.maximize(); // ✅ Esta línea abre la ventana maximizada
  win.loadFile(path.join(__dirname, '../src/html/movimientos.html'));
}

app.whenReady().then(createWindow);
