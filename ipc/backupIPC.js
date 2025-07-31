/**
 * ========================================
 * KONTROL - IPC RESPALDOS
 * ========================================
 * Manejadores IPC para operaciones de respaldo
 */

const { ipcMain } = require('electron');
const BackupManager = require('../database/backup');

// Instancia global del gestor de respaldos
let backupManager;

// Inicializar el gestor de respaldos
function initializeBackupManager() {
  if (!backupManager) {
    backupManager = new BackupManager();
  }
  return backupManager;
}

// Crear respaldo manual
ipcMain.handle('backup:create-manual', async (event) => {
  try {
    const manager = initializeBackupManager();
    const result = await manager.createBackup(true);
    return result;
  } catch (error) {
    console.error('Error en backup:create-manual:', error);
    return { success: false, error: error.message };
  }
});

// Obtener información del último respaldo
ipcMain.handle('backup:get-last-info', async (event) => {
  try {
    const manager = initializeBackupManager();
    const info = manager.getLastBackupInfo();
    return { success: true, data: info };
  } catch (error) {
    console.error('Error en backup:get-last-info:', error);
    return { success: false, error: error.message };
  }
});

// Listar todos los respaldos
ipcMain.handle('backup:list-all', async (event) => {
  try {
    const manager = initializeBackupManager();
    const backups = manager.listBackups();
    return { success: true, data: backups };
  } catch (error) {
    console.error('Error en backup:list-all:', error);
    return { success: false, error: error.message };
  }
});

// Restaurar respaldo
ipcMain.handle('backup:restore', async (event, fileName) => {
  try {
    const manager = initializeBackupManager();
    const result = await manager.restoreBackup(fileName);
    return result;
  } catch (error) {
    console.error('Error en backup:restore:', error);
    return { success: false, error: error.message };
  }
});

// Obtener estado del sistema de respaldos
ipcMain.handle('backup:get-status', async (event) => {
  try {
    const manager = initializeBackupManager();
    const lastBackup = manager.getLastBackupInfo();
    const shouldBackup = manager.shouldCreateAutoBackup();
    
    return {
      success: true,
      data: {
        enabled: true,
        lastBackup,
        shouldBackup,
        backupFolder: manager.backupFolder,
        maxBackups: manager.maxBackups
      }
    };
  } catch (error) {
    console.error('Error en backup:get-status:', error);
    return { success: false, error: error.message };
  }
});

// Inicializar automáticamente cuando se carga el módulo
setTimeout(() => {
  initializeBackupManager();
}, 1000);

module.exports = { initializeBackupManager };
