"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const DatabaseService_1 = require("../main/services/DatabaseService");
const EmailService_1 = require("../main/services/EmailService");
const OAuthService_1 = require("../main/services/OAuthService");
const SettingsService_1 = require("../main/services/SettingsService");
const AIService_1 = require("../main/services/AIService");
class MainProcess {
    constructor() {
        this.mainWindow = null;
        this.autoUpdater = null;
        console.log('MainProcess constructor - initializing services...');
        this.databaseService = new DatabaseService_1.DatabaseService();
        console.log('MainProcess constructor - creating OAuthService...');
        this.oauthService = new OAuthService_1.OAuthService();
        console.log('MainProcess constructor - OAuthService created');
        this.emailService = new EmailService_1.EmailService(this.databaseService, this.oauthService);
        this.settingsService = new SettingsService_1.SettingsService();
        this.aiService = new AIService_1.AIService();
        console.log('MainProcess constructor - all services initialized');
        // Lazy-load auto-updater (optional dependency)
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { autoUpdater } = require('electron-updater');
            this.autoUpdater = autoUpdater;
            this.autoUpdater.autoDownload = false;
        }
        catch (err) {
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
    createWindow() {
        this.mainWindow = new electron_1.BrowserWindow({
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
        }
        else {
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
                electron_1.shell.openExternal(url);
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
            this.autoUpdater.on('update-available', (info) => {
                this.mainWindow?.webContents.send('updates:event', { type: 'available', data: info });
            });
            this.autoUpdater.on('update-not-available', (info) => {
                this.mainWindow?.webContents.send('updates:event', { type: 'not-available', data: info });
            });
            this.autoUpdater.on('error', (err) => {
                this.mainWindow?.webContents.send('updates:event', { type: 'error', data: String(err?.message || err) });
            });
            this.autoUpdater.on('download-progress', (progress) => {
                this.mainWindow?.webContents.send('updates:event', { type: 'download-progress', data: progress });
            });
            this.autoUpdater.on('update-downloaded', (info) => {
                this.mainWindow?.webContents.send('updates:event', { type: 'downloaded', data: info });
            });
        }
    }
    setupIPC() {
        // Database operations
        electron_1.ipcMain.handle('db:get-accounts', async () => {
            console.log('MainProcess: getAccounts called');
            const accounts = await this.databaseService.getAccounts();
            console.log('MainProcess: getAccounts result:', accounts);
            return accounts;
        });
        electron_1.ipcMain.handle('db:add-account', (_, account) => this.databaseService.addAccount(account));
        electron_1.ipcMain.handle('db:update-account', (_, account) => this.databaseService.updateAccount(account));
        electron_1.ipcMain.handle('db:delete-account', async (_, id) => {
            const result = await this.databaseService.deleteAccount(id);
            this.mainWindow?.webContents.send('data:event', { type: 'account:deleted', accountId: id });
            return result;
        });
        electron_1.ipcMain.handle('db:get-folders', async (_, accountId) => {
            console.log('MainProcess: getFolders called for accountId:', accountId);
            const folders = await this.databaseService.getFolders(accountId);
            console.log('MainProcess: getFolders result:', folders);
            return folders;
        });
        electron_1.ipcMain.handle('db:get-messages', (_, folderId, limit, offset) => this.databaseService.getMessages(folderId, limit, offset));
        electron_1.ipcMain.handle('db:get-message', (_, id) => this.databaseService.getMessage(id));
        electron_1.ipcMain.handle('db:get-message-by-uid', (_, accountId, uid) => this.databaseService.getMessageByUid(accountId, uid));
        electron_1.ipcMain.handle('db:get-messages-by-thread-id', (_, threadId) => this.databaseService.getMessagesByThreadId(threadId));
        electron_1.ipcMain.handle('db:search-messages', (_, query, folderId, limit) => this.databaseService.searchMessages(query, folderId, limit));
        electron_1.ipcMain.handle('db:update-folder-counts', (_, folderId) => this.databaseService.updateFolderCounts(folderId));
        electron_1.ipcMain.handle('db:update-all-folder-counts', (_, accountId) => this.databaseService.updateAllFolderCounts(accountId));
        electron_1.ipcMain.handle('db:clear-messages-for-account', (_, accountId) => this.databaseService.clearMessagesForAccount(accountId));
        // Email operations
        electron_1.ipcMain.handle('email:sync-folder', async (_, accountId, folderId) => {
            await this.emailService.syncFolder(accountId, folderId);
            this.mainWindow?.webContents.send('data:event', { type: 'emails:synced', accountId, folderId });
            return true;
        });
        electron_1.ipcMain.handle('email:sync-all-folders', async (_, accountId) => {
            console.log('MainProcess: syncAllFolders called for accountId:', accountId);
            await this.emailService.syncAllFolders(accountId);
            console.log('MainProcess: syncAllFolders completed, sending data event');
            this.mainWindow?.webContents.send('data:event', { type: 'emails:all-synced', accountId });
            console.log('MainProcess: data event sent for emails:all-synced');
            return true;
        });
        electron_1.ipcMain.handle('email:refresh-folders', async (_, accountId) => {
            console.log('MainProcess: refreshFolders called for accountId:', accountId);
            await this.emailService.refreshFolders(accountId);
            console.log('MainProcess: refreshFolders completed, sending data event');
            this.mainWindow?.webContents.send('data:event', { type: 'folders:refreshed', accountId });
            console.log('MainProcess: data event sent for folders:refreshed');
            return true;
        });
        electron_1.ipcMain.handle('email:send-message', (_, message) => this.emailService.sendMessage(message));
        electron_1.ipcMain.handle('email:test-connection', (_, account) => this.emailService.testConnection(account));
        // OAuth operations
        electron_1.ipcMain.handle('oauth:get-auth-url', (_, provider) => this.oauthService.getAuthUrl(provider));
        electron_1.ipcMain.handle('oauth:handle-callback', (_, code, provider) => this.oauthService.handleCallback(code, provider));
        // Settings operations
        electron_1.ipcMain.handle('settings:get', () => this.settingsService.getSettings());
        electron_1.ipcMain.handle('settings:update', (_, settings) => this.settingsService.updateSettings(settings));
        // AI operations
        electron_1.ipcMain.handle('ai:send-message', (_, request) => this.aiService.sendMessage(request));
        electron_1.ipcMain.handle('ai:summarize-email', (_, email, model) => this.aiService.summarizeEmail(email, model));
        electron_1.ipcMain.handle('ai:draft-reply', (_, email, model) => this.aiService.draftReply(email, model));
        electron_1.ipcMain.handle('ai:extract-action-items', (_, email, model) => this.aiService.extractActionItems(email, model));
        electron_1.ipcMain.handle('ai:analyze-tone', (_, email, model) => this.aiService.analyzeTone(email, model));
        electron_1.ipcMain.handle('ai:get-config', () => this.aiService.getConfig());
        electron_1.ipcMain.handle('ai:update-config', (_, config) => this.aiService.updateConfig(config));
        // File operations
        electron_1.ipcMain.handle('file:select-attachments', async () => {
            const result = await electron_1.dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            return result.filePaths;
        });
        // Window operations
        electron_1.ipcMain.handle('window:minimize', () => this.mainWindow?.minimize());
        electron_1.ipcMain.handle('window:maximize', () => {
            if (this.mainWindow?.isMaximized()) {
                this.mainWindow.unmaximize();
            }
            else {
                this.mainWindow?.maximize();
            }
        });
        electron_1.ipcMain.handle('window:close', () => this.mainWindow?.close());
        electron_1.ipcMain.handle('window:reload', () => this.mainWindow?.reload());
        // App operations
        electron_1.ipcMain.handle('app:relaunch', () => {
            electron_1.app.relaunch();
            electron_1.app.exit(0);
        });
        // Update operations
        electron_1.ipcMain.handle('updates:check', async () => {
            if (!this.autoUpdater) {
                return { supported: false };
            }
            try {
                const result = await this.autoUpdater.checkForUpdates();
                return { supported: true, result };
            }
            catch (e) {
                return { supported: true, error: String(e?.message || e) };
            }
        });
        electron_1.ipcMain.handle('updates:download', async () => {
            if (!this.autoUpdater)
                return { supported: false };
            try {
                await this.autoUpdater.downloadUpdate();
                return { supported: true };
            }
            catch (e) {
                return { supported: true, error: String(e?.message || e) };
            }
        });
        electron_1.ipcMain.handle('updates:quit-and-install', () => {
            if (!this.autoUpdater)
                return { supported: false };
            this.autoUpdater.quitAndInstall();
            return { supported: true };
        });
        // External URL operations - only for OAuth
        electron_1.ipcMain.handle('app:open-external', (_, url) => {
            // Only allow OAuth URLs to open in browser
            if (url.includes('accounts.google.com') || url.includes('login.microsoftonline.com')) {
                electron_1.shell.openExternal(url);
            }
            // Block all other external URLs
        });
    }
}
// App lifecycle
electron_1.app.whenReady().then(async () => {
    // Remove menu globally
    electron_1.Menu.setApplicationMenu(null);
    const mainProcess = new MainProcess();
    await mainProcess.initialize();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        const mainProcess = new MainProcess();
        mainProcess.initialize();
    }
});
// Security: Prevent new window creation and external navigation
electron_1.app.on('web-contents-created', (event, contents) => {
    // Prevent new window creation - this blocks window.open() calls
    contents.setWindowOpenHandler(({ url }) => {
        // Only allow OAuth URLs to open in browser
        if (url.includes('accounts.google.com') || url.includes('login.microsoftonline.com')) {
            electron_1.shell.openExternal(url);
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
                electron_1.shell.openExternal(navigationUrl);
            }
            // Block all other external URLs
        }
    });
});
