const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// 👉 IMPORTAMOS los handlers
require('../ipc/productosIPC.js');
require('../ipc/movimientosIPC.js');
require('../ipc/reportesIPC.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'assets', 'logo.ico'), // Usando PNG en lugar de ICO
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  // 👇 Crear menú de desarrollo
  const template = [
    {
      label: 'Desarrollo',
      submenu: [
        {
          label: 'Herramientas de Desarrollador',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.openDevTools();
          }
        },
        {
          label: 'Recargar',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload();
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  mainWindow.maximize(); // ✅ Esta línea abre la ventana maximizada
  mainWindow.loadFile(path.join(__dirname, '../src/html/menu.html'));
  
  // 👇 Abrir DevTools automáticamente en desarrollo
  // mainWindow.webContents.openDevTools();
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
