declare global {
  interface Window {
    electronAPI: {
      // Database operations
      getAccounts: () => Promise<any[]>;
      addAccount: (account: any) => Promise<any>;
      updateAccount: (account: any) => Promise<any>;
      deleteAccount: (id: number) => Promise<any>;
      
      getFolders: (accountId: number) => Promise<any[]>;
      getMessages: (folderId: number, limit?: number, offset?: number) => Promise<{ messages: any[], total: number }>;
      getMessage: (id: number) => Promise<any>;
      getMessageByUid: (accountId: number, uid: string) => Promise<any>;
      getMessagesByThreadId: (threadId: string) => Promise<any[]>;
      searchMessages: (query: string, folderId?: number, limit?: number) => Promise<any[]>;
      updateFolderCounts: (folderId: number) => Promise<any>;
      updateAllFolderCounts: (accountId: number) => Promise<any>;
      clearMessagesForAccount: (accountId: number) => Promise<any>;

      // Email operations
      syncFolder: (accountId: number, folderId: number) => Promise<any>;
      syncAllFolders: (accountId: number) => Promise<any>;
      refreshFolders: (accountId: number) => Promise<any>;
      sendMessage: (message: any) => Promise<any>;
      testConnection: (account: any) => Promise<any>;

      // OAuth operations
      getAuthUrl: (provider: string) => Promise<string>;
      handleCallback: (code: string, provider: string) => Promise<any>;

      // Settings operations
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<any>;

      // File operations
      selectAttachments: () => Promise<string[]>;

      // Window operations
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      relaunch: () => Promise<void>;
      openExternal: (url: string) => Promise<void>;

      // Updates
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<any>;
      quitAndInstall: () => Promise<any>;
      onUpdateEvent: (cb: (payload: any) => void) => void;
    };
  }
}

export {};
