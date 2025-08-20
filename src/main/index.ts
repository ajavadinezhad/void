import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'path';
import { DatabaseService } from '@/main/services/DatabaseService';
import { EmailService } from '@/main/services/EmailService';
import { OAuthService } from '@/main/services/OAuthService';
import { SettingsService } from '@/main/services/SettingsService';
import { AIService } from '@/main/services/AIService';

class MainProcess {
  private mainWindow: BrowserWindow | null = null;
  private databaseService: DatabaseService;
  private emailService: EmailService;
  private oauthService: OAuthService;
  private settingsService: SettingsService;
  private aiService: AIService;
  private autoUpdater: any | null = null;

  constructor() {
    console.log('MainProcess constructor - initializing services...');
    this.databaseService = new DatabaseService();
    console.log('MainProcess constructor - creating OAuthService...');
    this.oauthService = new OAuthService();
    console.log('MainProcess constructor - OAuthService created');
    this.emailService = new EmailService(this.databaseService, this.oauthService);
    this.settingsService = new SettingsService();
    this.aiService = new AIService();
    console.log('MainProcess constructor - all services initialized');

    // Lazy-load auto-updater (optional dependency)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { autoUpdater } = require('electron-updater');
      this.autoUpdater = autoUpdater;
      this.autoUpdater.autoDownload = false;
    } catch (err) {
      console.log('Auto updater not available (electron-updater not installed/configured).');
      this.autoUpdater = null;
    }
  }

  async initialize() {
    await this.databaseService.initialize();
    await this.settingsService.initialize();
    this.setupIPC();
    this.createWindow();
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#2f3241',
        symbolColor: '#74b1be',
        height: 30
      },
      show: false,
    });

    const isDev = process.env.IS_DEV === 'true';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      // Ensure menu is removed after window is ready
      this.mainWindow?.setMenu(null);
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links - only open OAuth URLs, block everything else
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Only allow OAuth URLs to open in browser
      if (url.includes('accounts.google.com') || url.includes('login.microsoftonline.com')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      // Block all other external URLs
      return { action: 'deny' };
    });

    // Wire update events to renderer if autoUpdater is available
    if (this.autoUpdater) {
      this.autoUpdater.on('checking-for-update', () => {
        this.mainWindow?.webContents.send('updates:event', { type: 'checking' });
      });
      this.autoUpdater.on('update-available', (info: any) => {
        this.mainWindow?.webContents.send('updates:event', { type: 'available', data: info });
      });
      this.autoUpdater.on('update-not-available', (info: any) => {
        this.mainWindow?.webContents.send('updates:event', { type: 'not-available', data: info });
      });
      this.autoUpdater.on('error', (err: any) => {
        this.mainWindow?.webContents.send('updates:event', { type: 'error', data: String(err?.message || err) });
      });
      this.autoUpdater.on('download-progress', (progress: any) => {
        this.mainWindow?.webContents.send('updates:event', { type: 'download-progress', data: progress });
      });
      this.autoUpdater.on('update-downloaded', (info: any) => {
        this.mainWindow?.webContents.send('updates:event', { type: 'downloaded', data: info });
      });
    }
  }

  private setupIPC() {
    // Database operations
    ipcMain.handle('db:get-accounts', async () => {
      console.log('MainProcess: getAccounts called');
      const accounts = await this.databaseService.getAccounts();
      console.log('MainProcess: getAccounts result:', accounts);
      return accounts;
    });
    ipcMain.handle('db:add-account', (_, account) => this.databaseService.addAccount(account));
    ipcMain.handle('db:update-account', (_, account) => this.databaseService.updateAccount(account));
    ipcMain.handle('db:delete-account', async (_, id) => {
      const result = await this.databaseService.deleteAccount(id);
      this.mainWindow?.webContents.send('data:event', { type: 'account:deleted', accountId: id });
      return result;
    });

    ipcMain.handle('db:get-folders', async (_, accountId) => {
      console.log('MainProcess: getFolders called for accountId:', accountId);
      const folders = await this.databaseService.getFolders(accountId);
      console.log('MainProcess: getFolders result:', folders);
      return folders;
    });
    ipcMain.handle('db:get-messages', (_, folderId, limit, offset) => 
      this.databaseService.getMessages(folderId, limit, offset));
    ipcMain.handle('db:get-message', (_, id) => this.databaseService.getMessage(id));
      ipcMain.handle('db:get-message-by-uid', (_, accountId, uid) => this.databaseService.getMessageByUid(accountId, uid));
  ipcMain.handle('db:get-messages-by-thread-id', (_, threadId) => this.databaseService.getMessagesByThreadId(threadId));
  ipcMain.handle('db:search-messages', (_, query, folderId, limit) => 
      this.databaseService.searchMessages(query, folderId, limit));
    ipcMain.handle('db:update-folder-counts', (_, folderId) => this.databaseService.updateFolderCounts(folderId));
    ipcMain.handle('db:update-all-folder-counts', (_, accountId) => this.databaseService.updateAllFolderCounts(accountId));
    ipcMain.handle('db:clear-messages-for-account', (_, accountId) => this.databaseService.clearMessagesForAccount(accountId));

    // Email operations
    ipcMain.handle('email:sync-folder', async (_, accountId, folderId) => {
      await this.emailService.syncFolder(accountId, folderId);
      this.mainWindow?.webContents.send('data:event', { type: 'emails:synced', accountId, folderId });
      return true;
    });
    ipcMain.handle('email:sync-all-folders', async (_, accountId) => {
      console.log('MainProcess: syncAllFolders called for accountId:', accountId);
      await this.emailService.syncAllFolders(accountId);
      console.log('MainProcess: syncAllFolders completed, sending data event');
      this.mainWindow?.webContents.send('data:event', { type: 'emails:all-synced', accountId });
      console.log('MainProcess: data event sent for emails:all-synced');
      return true;
    });
    ipcMain.handle('email:refresh-folders', async (_, accountId) => {
      console.log('MainProcess: refreshFolders called for accountId:', accountId);
      await this.emailService.refreshFolders(accountId);
      console.log('MainProcess: refreshFolders completed, sending data event');
      this.mainWindow?.webContents.send('data:event', { type: 'folders:refreshed', accountId });
      console.log('MainProcess: data event sent for folders:refreshed');
      return true;
    });
    ipcMain.handle('email:send-message', (_, message) => this.emailService.sendMessage(message));
    ipcMain.handle('email:test-connection', (_, account) => this.emailService.testConnection(account));

    // OAuth operations
    ipcMain.handle('oauth:get-auth-url', (_, provider) => this.oauthService.getAuthUrl(provider));
    ipcMain.handle('oauth:handle-callback', (_, code, provider) => 
      this.oauthService.handleCallback(code, provider));

    // Settings operations
    ipcMain.handle('settings:get', () => this.settingsService.getSettings());
    ipcMain.handle('settings:update', (_, settings) => this.settingsService.updateSettings(settings));

    // AI operations
    ipcMain.handle('ai:send-message', (_, request) => this.aiService.sendMessage(request));
    ipcMain.handle('ai:summarize-email', (_, email, model) => this.aiService.summarizeEmail(email, model));
    ipcMain.handle('ai:draft-reply', (_, email, model) => this.aiService.draftReply(email, model));
    ipcMain.handle('ai:extract-action-items', (_, email, model) => this.aiService.extractActionItems(email, model));
    ipcMain.handle('ai:analyze-tone', (_, email, model) => this.aiService.analyzeTone(email, model));
    ipcMain.handle('ai:get-config', () => this.aiService.getConfig());
    ipcMain.handle('ai:update-config', (_, config) => this.aiService.updateConfig(config));

    // File operations
    ipcMain.handle('file:select-attachments', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result.filePaths;
    });

    // Window operations
    ipcMain.handle('window:minimize', () => this.mainWindow?.minimize());
    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });
    ipcMain.handle('window:close', () => this.mainWindow?.close());
    ipcMain.handle('window:reload', () => this.mainWindow?.reload());
    
    // App operations
    ipcMain.handle('app:relaunch', () => {
      app.relaunch();
      app.exit(0);
    });

    // Update operations
    ipcMain.handle('updates:check', async () => {
      if (!this.autoUpdater) {
        return { supported: false };
      }
      try {
        const result = await this.autoUpdater.checkForUpdates();
        return { supported: true, result };
      } catch (e: any) {
        return { supported: true, error: String(e?.message || e) };
      }
    });
    ipcMain.handle('updates:download', async () => {
      if (!this.autoUpdater) return { supported: false };
      try {
        await this.autoUpdater.downloadUpdate();
        return { supported: true };
      } catch (e: any) {
        return { supported: true, error: String(e?.message || e) };
      }
    });
    ipcMain.handle('updates:quit-and-install', () => {
      if (!this.autoUpdater) return { supported: false };
      this.autoUpdater.quitAndInstall();
      return { supported: true };
    });
    
    // External URL operations - only for OAuth
    ipcMain.handle('app:open-external', (_, url: string) => {
      // Only allow OAuth URLs to open in browser
      if (url.includes('accounts.google.com') || url.includes('login.microsoftonline.com')) {
        shell.openExternal(url);
      }
      // Block all other external URLs
    });
  }
}

// App lifecycle
app.whenReady().then(async () => {
  // Remove menu globally
  Menu.setApplicationMenu(null);
  
  const mainProcess = new MainProcess();
  await mainProcess.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const mainProcess = new MainProcess();
    mainProcess.initialize();
  }
});

// Security: Prevent new window creation and external navigation
app.on('web-contents-created', (event, contents) => {
  // Prevent new window creation - this blocks window.open() calls
  contents.setWindowOpenHandler(({ url }) => {
    // Only allow OAuth URLs to open in browser
    if (url.includes('accounts.google.com') || url.includes('login.microsoftonline.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    // Block all other external URLs
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  contents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl.startsWith('http://') || navigationUrl.startsWith('https://')) {
      event.preventDefault();
      // Only allow OAuth URLs to open in browser
      if (navigationUrl.includes('accounts.google.com') || navigationUrl.includes('login.microsoftonline.com')) {
        shell.openExternal(navigationUrl);
      }
      // Block all other external URLs
    }
  });
});
