"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    getAccounts: () => electron_1.ipcRenderer.invoke('db:get-accounts'),
    addAccount: (account) => electron_1.ipcRenderer.invoke('db:add-account', account),
    updateAccount: (account) => electron_1.ipcRenderer.invoke('db:update-account', account),
    deleteAccount: (id) => electron_1.ipcRenderer.invoke('db:delete-account', id),
    getFolders: (accountId) => electron_1.ipcRenderer.invoke('db:get-folders', accountId),
    getMessages: (folderId, limit, offset) => electron_1.ipcRenderer.invoke('db:get-messages', folderId, limit, offset),
    getMessage: (id) => electron_1.ipcRenderer.invoke('db:get-message', id),
    getMessageByUid: (accountId, uid) => electron_1.ipcRenderer.invoke('db:get-message-by-uid', accountId, uid),
    getMessagesByThreadId: (threadId) => electron_1.ipcRenderer.invoke('db:get-messages-by-thread-id', threadId),
    searchMessages: (query, folderId, limit) => electron_1.ipcRenderer.invoke('db:search-messages', query, folderId, limit),
    updateFolderCounts: (folderId) => electron_1.ipcRenderer.invoke('db:update-folder-counts', folderId),
    // Email operations
    syncFolder: (accountId, folderId) => electron_1.ipcRenderer.invoke('email:sync-folder', accountId, folderId),
    syncAllFolders: (accountId) => electron_1.ipcRenderer.invoke('email:sync-all-folders', accountId),
    refreshFolders: (accountId) => electron_1.ipcRenderer.invoke('email:refresh-folders', accountId),
    sendMessage: (message) => electron_1.ipcRenderer.invoke('email:send-message', message),
    testConnection: (account) => electron_1.ipcRenderer.invoke('email:test-connection', account),
    // OAuth operations
    getAuthUrl: (provider) => electron_1.ipcRenderer.invoke('oauth:get-auth-url', provider),
    handleCallback: (code, provider) => electron_1.ipcRenderer.invoke('oauth:handle-callback', code, provider),
    // Settings operations
    getSettings: () => electron_1.ipcRenderer.invoke('settings:get'),
    updateSettings: (settings) => electron_1.ipcRenderer.invoke('settings:update', settings),
    // AI operations
    sendAIMessage: (request) => electron_1.ipcRenderer.invoke('ai:send-message', request),
    summarizeEmail: (email, model) => electron_1.ipcRenderer.invoke('ai:summarize-email', email, model),
    draftReply: (email, model) => electron_1.ipcRenderer.invoke('ai:draft-reply', email, model),
    extractActionItems: (email, model) => electron_1.ipcRenderer.invoke('ai:extract-action-items', email, model),
    analyzeTone: (email, model) => electron_1.ipcRenderer.invoke('ai:analyze-tone', email, model),
    getAIConfig: () => electron_1.ipcRenderer.invoke('ai:get-config'),
    updateAIConfig: (config) => electron_1.ipcRenderer.invoke('ai:update-config', config),
    getAIFeatures: () => electron_1.ipcRenderer.invoke('ai:get-features'),
    setAIFeatures: (features) => electron_1.ipcRenderer.invoke('ai:set-features', features),
    // File operations
    selectAttachments: () => electron_1.ipcRenderer.invoke('file:select-attachments'),
    // Window operations
    minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
    maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
    close: () => electron_1.ipcRenderer.invoke('window:close'),
    reload: () => electron_1.ipcRenderer.invoke('window:reload'),
    relaunch: () => electron_1.ipcRenderer.invoke('app:relaunch'),
    // External URL operations
    openExternal: (url) => electron_1.ipcRenderer.invoke('app:open-external', url),
    // Update operations
    checkForUpdates: () => electron_1.ipcRenderer.invoke('updates:check'),
    downloadUpdate: () => electron_1.ipcRenderer.invoke('updates:download'),
    quitAndInstall: () => electron_1.ipcRenderer.invoke('updates:quit-and-install'),
    onUpdateEvent: (cb) => {
        electron_1.ipcRenderer.on('updates:event', (_evt, payload) => cb(payload));
    },
    onDataEvent: (cb) => {
        const listener = (_evt, payload) => cb(payload);
        electron_1.ipcRenderer.on('data:event', listener);
        return () => electron_1.ipcRenderer.removeListener('data:event', listener);
    },
});
