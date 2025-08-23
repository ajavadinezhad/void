import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getAccounts: () => ipcRenderer.invoke('db:get-accounts'),
  addAccount: (account: any) => ipcRenderer.invoke('db:add-account', account),
  updateAccount: (account: any) => ipcRenderer.invoke('db:update-account', account),
  deleteAccount: (id: number) => ipcRenderer.invoke('db:delete-account', id),
  
  getFolders: (accountId: number) => ipcRenderer.invoke('db:get-folders', accountId),
  getMessages: (folderId: number, limit?: number, offset?: number) => 
    ipcRenderer.invoke('db:get-messages', folderId, limit, offset),
  getMessage: (id: number) => ipcRenderer.invoke('db:get-message', id),
  getMessageByUid: (accountId: number, uid: string) => ipcRenderer.invoke('db:get-message-by-uid', accountId, uid),
  getMessagesByThreadId: (threadId: string) => ipcRenderer.invoke('db:get-messages-by-thread-id', threadId),
  searchMessages: (query: string, folderId?: number, limit?: number) => 
    ipcRenderer.invoke('db:search-messages', query, folderId, limit),
  updateFolderCounts: (folderId: number) => ipcRenderer.invoke('db:update-folder-counts', folderId),

  // Email operations
  syncFolder: (accountId: number, folderId: number) => 
    ipcRenderer.invoke('email:sync-folder', accountId, folderId),
  syncAllFolders: (accountId: number) => 
    ipcRenderer.invoke('email:sync-all-folders', accountId),
  refreshFolders: (accountId: number) => 
    ipcRenderer.invoke('email:refresh-folders', accountId),
  sendMessage: (message: any) => ipcRenderer.invoke('email:send-message', message),
  testConnection: (account: any) => ipcRenderer.invoke('email:test-connection', account),

  // OAuth operations
  getAuthUrl: (provider: string) => ipcRenderer.invoke('oauth:get-auth-url', provider),
  handleCallback: (code: string, provider: string) => 
    ipcRenderer.invoke('oauth:handle-callback', code, provider),

  // Settings operations
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),

  // AI operations
  sendAIMessage: (request: any) => ipcRenderer.invoke('ai:send-message', request),
  summarizeEmail: (email: any, model: any) => ipcRenderer.invoke('ai:summarize-email', email, model),
  draftReply: (email: any, model: any) => ipcRenderer.invoke('ai:draft-reply', email, model),
  extractActionItems: (email: any, model: any) => ipcRenderer.invoke('ai:extract-action-items', email, model),
  analyzeTone: (email: any, model: any) => ipcRenderer.invoke('ai:analyze-tone', email, model),
  getAIConfig: () => ipcRenderer.invoke('ai:get-config'),
  updateAIConfig: (config: any) => ipcRenderer.invoke('ai:update-config', config),
  getAIFeatures: () => ipcRenderer.invoke('ai:get-features'),
  setAIFeatures: (features: any) => ipcRenderer.invoke('ai:set-features', features),

  // File operations
  selectAttachments: () => ipcRenderer.invoke('file:select-attachments'),

  // Window operations
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  reload: () => ipcRenderer.invoke('window:reload'),
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  
  // External URL operations
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),

  // Update operations
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  quitAndInstall: () => ipcRenderer.invoke('updates:quit-and-install'),
  onUpdateEvent: (cb: (payload: any) => void) => {
    ipcRenderer.on('updates:event', (_evt, payload) => cb(payload));
  },
  onDataEvent: (cb: (payload: any) => void) => {
    const listener = (_evt: Electron.IpcRendererEvent, payload: any) => cb(payload);
    ipcRenderer.on('data:event', listener);
    return () => ipcRenderer.removeListener('data:event', listener);
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // Database operations
      getAccounts: () => Promise<any[]>;
      addAccount: (account: any) => Promise<any>;
      updateAccount: (account: any) => Promise<any>;
      deleteAccount: (id: number) => Promise<boolean>;
      
      getFolders: (accountId: number) => Promise<any[]>;
      getMessages: (folderId: number, limit?: number, offset?: number) => Promise<{ messages: any[], total: number }>;
      getMessage: (id: number) => Promise<any>;
      getMessageByUid: (accountId: number, uid: string) => Promise<any>;
      searchMessages: (query: string, folderId?: number, limit?: number) => Promise<any[]>;
      updateFolderCounts: (folderId: number) => Promise<void>;

      // Email operations
      syncFolder: (accountId: number, folderId: number) => Promise<any>;
      syncAllFolders: (accountId: number) => Promise<any>;
      refreshFolders: (accountId: number) => Promise<any>;
      sendMessage: (message: any) => Promise<any>;
      testConnection: (account: any) => Promise<boolean>;

      // OAuth operations
      getAuthUrl: (provider: string) => Promise<string>;
      handleCallback: (code: string, provider: string) => Promise<any>;

      // Settings operations
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<any>;

      // AI operations
      sendAIMessage: (request: any) => Promise<any>;
      summarizeEmail: (email: any, model: string) => Promise<string>;
      draftReply: (email: any, model: string) => Promise<string>;
      extractActionItems: (email: any, model: string) => Promise<string>;
      analyzeTone: (email: any, model: string) => Promise<string>;
      getAIConfig: () => Promise<any>;
      updateAIConfig: (config: any) => Promise<void>;
      getAIFeatures: () => Promise<any>;
      setAIFeatures: (features: any) => Promise<void>;

      // File operations
      selectAttachments: () => Promise<string[]>;

      // Window operations
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      relaunch: () => void;
      
      // External URL operations
      openExternal: (url: string) => Promise<void>;

      // Update operations
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<any>;
      quitAndInstall: () => Promise<any>;
      onUpdateEvent: (cb: (payload: any) => void) => void;
      onDataEvent: (cb: (payload: any) => void) => () => void;
    };
  }
}
