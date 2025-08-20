// Email Account Types
export interface EmailAccount {
  id: number;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'imap';
  oauthToken?: string;
  oauthRefreshToken?: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Email Folder Types
export interface EmailFolder {
  id: number;
  accountId: number;
  name: string;
  path: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'custom';
  unreadCount: number;
  totalCount: number;
}

// Email Message Types
export interface EmailMessage {
  id: number;
  accountId: number;
  folderId: number;
  uid: string;
  threadId: string;
  subject?: string;
  sender: string;
  recipients?: string;
  cc?: string;
  bcc?: string;
  body?: string;
  htmlBody?: string;
  date: Date;
  isRead: boolean;
  isFlagged: boolean;
  isAnswered: boolean;
  isForwarded: boolean;
  size?: number;
  createdAt: Date;
  attachments?: EmailAttachment[];
}

// Email Attachment Types
export interface EmailAttachment {
  id: number;
  messageId: number;
  filename: string;
  contentType: string;
  size?: number;
  contentId?: string;
  filePath?: string;
}

// UI State Types
export interface UIState {
  sidebarCollapsed: boolean;
  selectedAccountId?: number;
  selectedFolderId?: number;
  selectedMessageId?: number;
  theme: 'light' | 'dark' | 'system';
  windowSize: { width: number; height: number };
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSync: boolean;
  syncInterval: number; // minutes
  notifications: boolean;
  soundEnabled: boolean;
  aiFeatures: {
    writingEnabled: boolean;
    searchEnabled: boolean;
    summarizationEnabled: boolean;
    privacyRedactionEnabled: boolean;
  };
}

// OAuth2 Types
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

// IMAP Connection Types
export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass?: string;
    oauth2?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

// SMTP Connection Types
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass?: string;
    oauth2?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Event Types
export interface EmailEvent {
  type: 'new' | 'read' | 'deleted' | 'moved';
  accountId: number;
  folderId: number;
  messageId?: number;
  data?: any;
}

// Search Types
export interface SearchQuery {
  query: string;
  folderId?: number;
  accountId?: number;
  filters?: {
    isRead?: boolean;
    isFlagged?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  };
  sortBy?: 'date' | 'subject' | 'sender';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Compose Email Types
export interface ComposeEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: File[];
  replyTo?: EmailMessage;
  forwardFrom?: EmailMessage;
}
