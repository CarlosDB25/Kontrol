/**
 * ========================================
 * KONTROL - SISTEMA DE RESPALDOS AUTOMÁTICOS
 * ========================================
 * Maneja respaldos automáticos diarios y manuales
 * de la base de datos SQLite
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { dbPath } = require('./config');

class BackupManager {
  constructor() {
    this.backupFolder = this.getBackupFolder();
    this.maxBackups = 30; // Mantener 30 respaldos (1 mes)
    this.lastBackupFile = path.join(this.backupFolder, 'last_backup.json');
    
    this.initializeBackupFolder();
    this.scheduleAutoBackup();
  }

  /**
   * Obtiene la carpeta de respaldos
   */
  getBackupFolder() {
    const userDataPath = process.env.NODE_ENV === 'production' || process.resourcesPath
      ? path.join(os.homedir(), 'AppData', 'Roaming', 'Kontrol', 'backups')
      : path.join(__dirname, 'backups');
    
    return userDataPath;
  }

  /**
   * Inicializa la carpeta de respaldos
   */
  initializeBackupFolder() {
    if (!fs.existsSync(this.backupFolder)) {
      fs.mkdirSync(this.backupFolder, { recursive: true });
    }
  }

  /**
   * Genera nombre de archivo de respaldo
   */
  generateBackupName(manual = false) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    const prefix = manual ? 'manual' : 'auto';
    return `kontrol_${prefix}_${year}${month}${day}_${hour}${minute}.db`;
  }

  /**
   * Realiza un respaldo de la base de datos
   */
  async createBackup(manual = false) {
    try {
      // Verificar que existe la base de datos principal
      if (!fs.existsSync(dbPath)) {
        throw new Error('Base de datos principal no encontrada');
      }

      const backupName = this.generateBackupName(manual);
      const backupPath = path.join(this.backupFolder, backupName);

      // Copiar archivo de base de datos
      fs.copyFileSync(dbPath, backupPath);

      // Actualizar registro de último respaldo
      const backupInfo = {
        date: new Date().toISOString(),
        file: backupName,
        size: fs.statSync(backupPath).size,
        type: manual ? 'manual' : 'automatic'
      };

      fs.writeFileSync(this.lastBackupFile, JSON.stringify(backupInfo, null, 2));

      // Limpiar respaldos antiguos
      this.cleanOldBackups();

      return {
        success: true,
        file: backupName,
        path: backupPath,
        info: backupInfo
      };

    } catch (error) {
      console.error('❌ Error creando respaldo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Limpia respaldos antiguos manteniendo solo los más recientes
   */
  cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupFolder)
        .filter(file => file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupFolder, file),
          time: fs.statSync(path.join(this.backupFolder, file)).mtime
        }))
        .sort((a, b) => b.time - a.time);

      // Eliminar respaldos que excedan el límite
      if (files.length > this.maxBackups) {
        const filesToDelete = files.slice(this.maxBackups);
        
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('Error eliminando respaldo antiguo:', error);
          }
        });
      }

    } catch (error) {
      console.error('Error limpiando respaldos antiguos:', error);
    }
  }

  /**
   * Obtiene información del último respaldo
   */
  getLastBackupInfo() {
    try {
      if (fs.existsSync(this.lastBackupFile)) {
        const data = fs.readFileSync(this.lastBackupFile, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error leyendo información de respaldo:', error);
      return null;
    }
  }

  /**
   * Verifica si necesita crear un respaldo automático
   */
  shouldCreateAutoBackup() {
    const lastBackup = this.getLastBackupInfo();
    
    if (!lastBackup) return true;

    const lastBackupDate = new Date(lastBackup.date);
    const now = new Date();
    const hoursDiff = (now - lastBackupDate) / (1000 * 60 * 60);

    // Crear respaldo si han pasado más de 24 horas
    return hoursDiff >= 24;
  }

  /**
   * Programa respaldos automáticos
   */
  scheduleAutoBackup() {
    // Verificar cada hora si necesita respaldo
    setInterval(() => {
      if (this.shouldCreateAutoBackup()) {
        this.createBackup(false);
      }
    }, 60 * 60 * 1000); // Cada hora

    // Crear respaldo inicial si es necesario
    setTimeout(() => {
      if (this.shouldCreateAutoBackup()) {
        this.createBackup(false);
      }
    }, 5000); // 5 segundos después del inicio
  }

  /**
   * Lista todos los respaldos disponibles
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupFolder)
        .filter(file => file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupFolder, file);
          const stats = fs.statSync(filePath);
          
          // Extraer fecha del nombre del archivo
          let extractedDate = stats.mtime;
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
          if (dateMatch) {
            const [, datePart, timePart] = dateMatch;
            const formattedDateTime = `${datePart}T${timePart.replace(/-/g, ':')}`;
            extractedDate = new Date(formattedDateTime);
          }
          
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: extractedDate,
            type: file.includes('manual') ? 'manual' : 'automatic'
          };
        })
        .sort((a, b) => b.created - a.created);

      return files;
    } catch (error) {
      console.error('Error listando respaldos:', error);
      return [];
    }
  }

  /**
   * Restaura un respaldo específico
   */
  async restoreBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupFolder, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Archivo de respaldo no encontrado');
      }

      // Crear respaldo de seguridad antes de restaurar
      const currentBackupName = `pre_restore_${this.generateBackupName(true)}`;
      const currentBackupPath = path.join(this.backupFolder, currentBackupName);
      fs.copyFileSync(dbPath, currentBackupPath);

      // Restaurar el respaldo
      fs.copyFileSync(backupPath, dbPath);

      return {
        success: true,
        restored: backupFileName,
        previousBackup: currentBackupName
      };

    } catch (error) {
      console.error('❌ Error restaurando respaldo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BackupManager;
