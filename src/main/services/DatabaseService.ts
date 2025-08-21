import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { EmailAccount, EmailFolder, EmailMessage, EmailAttachment } from '@/shared/types';

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = this.getUserDataPath();
    this.dbPath = path.join(userDataPath, 'void.db');
  }

  private getUserDataPath(): string {
    const { app } = require('electron');
    return app.getPath('userData');
  }

  async initialize(): Promise<void> {
    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create accounts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        provider TEXT NOT NULL,
        oauth_token TEXT,
        oauth_refresh_token TEXT,
        imap_host TEXT,
        imap_port INTEGER,
        smtp_host TEXT,
        smtp_port INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create folders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        unread_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        UNIQUE(account_id, path)
      )
    `);

    // Create messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        folder_id INTEGER NOT NULL,
        uid TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        subject TEXT,
        sender TEXT NOT NULL,
        recipients TEXT,
        cc TEXT,
        bcc TEXT,
        body TEXT,
        html_body TEXT,
        date DATETIME NOT NULL,
        is_read INTEGER DEFAULT 0,
        is_flagged INTEGER DEFAULT 0,
        is_answered INTEGER DEFAULT 0,
        is_forwarded INTEGER DEFAULT 0,
        size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (folder_id) REFERENCES folders(id),
        UNIQUE(account_id, uid)
      )
    `);

    // Create attachments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size INTEGER,
        content_id TEXT,
        file_path TEXT,
        FOREIGN KEY (message_id) REFERENCES messages(id)
      )
    `);

    // Create full-text search index
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        subject, sender, body, content='messages', content_rowid='id'
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_account_folder ON messages(account_id, folder_id);
      CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(date);
      CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
      CREATE INDEX IF NOT EXISTS idx_folders_account ON folders(account_id);
    `);
  }

  // Account operations
  async getAccounts(): Promise<EmailAccount[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        email,
        provider,
        oauth_token as oauthToken,
        oauth_refresh_token as oauthRefreshToken,
        imap_host as imapHost,
        imap_port as imapPort,
        smtp_host as smtpHost,
        smtp_port as smtpPort,
        created_at as createdAt,
        updated_at as updatedAt
      FROM accounts 
      ORDER BY created_at DESC
    `);
    return stmt.all() as EmailAccount[];
  }

  async addAccount(account: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailAccount> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO accounts (name, email, provider, oauth_token, oauth_refresh_token, imap_host, imap_port, smtp_host, smtp_port)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      account.name,
      account.email,
      account.provider,
      account.oauthToken,
      account.oauthRefreshToken,
      account.imapHost,
      account.imapPort,
      account.smtpHost,
      account.smtpPort
    );
    
    return this.getAccount(result.lastInsertRowid as number);
  }

  async updateAccount(account: EmailAccount): Promise<EmailAccount> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      UPDATE accounts 
      SET name = ?, email = ?, provider = ?, oauth_token = ?, oauth_refresh_token = ?, 
          imap_host = ?, imap_port = ?, smtp_host = ?, smtp_port = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      account.name,
      account.email,
      account.provider,
      account.oauthToken,
      account.oauthRefreshToken,
      account.imapHost,
      account.imapPort,
      account.smtpHost,
      account.smtpPort,
      account.id
    );
    
    return this.getAccount(account.id);
  }

  async deleteAccount(id: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(() => {
      // Delete messages first
      const messagesStmt = this.db!.prepare('DELETE FROM messages WHERE account_id = ?');
      const messagesDeleted = messagesStmt.run(id).changes;
      
      // Delete folders
      const foldersStmt = this.db!.prepare('DELETE FROM folders WHERE account_id = ?');
      const foldersDeleted = foldersStmt.run(id).changes;
      
      // Delete attachments
      const attachmentsStmt = this.db!.prepare('DELETE FROM attachments WHERE account_id = ?');
      const attachmentsDeleted = attachmentsStmt.run(id).changes;
      
      // Finally delete the account
      const accountStmt = this.db!.prepare('DELETE FROM accounts WHERE id = ?');
      const accountDeleted = accountStmt.run(id).changes;
      
      return {
        messagesDeleted,
        foldersDeleted,
        attachmentsDeleted,
        accountDeleted: accountDeleted > 0
      };
    });
    
    const result = transaction();
    return result.accountDeleted;
  }

  private async getAccount(id: number): Promise<EmailAccount> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        email,
        provider,
        oauth_token as oauthToken,
        oauth_refresh_token as oauthRefreshToken,
        imap_host as imapHost,
        imap_port as imapPort,
        smtp_host as smtpHost,
        smtp_port as smtpPort,
        created_at as createdAt,
        updated_at as updatedAt
      FROM accounts 
      WHERE id = ?
    `);
    const account = stmt.get(id) as EmailAccount;
    if (!account) throw new Error('Account not found');
    return account;
  }

  // Folder operations
  async getFolders(accountId: number): Promise<EmailFolder[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM folders WHERE account_id = ? ORDER BY id');
    const rawResult = stmt.all(accountId) as any[];
    
    // Convert field names to match the interface
    return rawResult.map(row => ({
      ...row,
      accountId: row.account_id,
      unreadCount: row.unread_count,
      totalCount: row.total_count
    })) as EmailFolder[];
  }

  async addFolder(folder: Omit<EmailFolder, 'id'>): Promise<EmailFolder> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO folders (account_id, name, path, type, unread_count, total_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      folder.accountId,
      folder.name,
      folder.path,
      folder.type,
      folder.unreadCount,
      folder.totalCount
    );
    
    return this.getFolder(result.lastInsertRowid as number);
  }

  async updateFolder(folder: EmailFolder): Promise<EmailFolder> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      UPDATE folders 
      SET name = ?, path = ?, type = ?, unread_count = ?, total_count = ?
      WHERE id = ?
    `);
    
    stmt.run(
      folder.name,
      folder.path,
      folder.type,
      folder.unreadCount,
      folder.totalCount,
      folder.id
    );
    
    return this.getFolder(folder.id);
  }

  private async getFolder(id: number): Promise<EmailFolder> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM folders WHERE id = ?');
    const rawResult = stmt.get(id) as any;
    if (!rawResult) throw new Error('Folder not found');
    
    // Convert field names to match the interface
    return {
      ...rawResult,
      accountId: rawResult.account_id,
      unreadCount: rawResult.unread_count,
      totalCount: rawResult.total_count
    } as EmailFolder;
  }

    async updateFolderCounts(folderId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Get total count of messages in this folder
    const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM messages WHERE folder_id = ?');
    const totalResult = totalStmt.get(folderId) as { total: number };
    
    // Get unread count of messages in this folder
    const unreadStmt = this.db.prepare('SELECT COUNT(*) as unread FROM messages WHERE folder_id = ? AND is_read = 0');
    const unreadResult = unreadStmt.get(folderId) as { unread: number };
    
    // Update the folder with the new counts
    const updateStmt = this.db.prepare('UPDATE folders SET total_count = ?, unread_count = ? WHERE id = ?');
    updateStmt.run(totalResult.total, unreadResult.unread, folderId);
    
  }

  async updateAllFolderCounts(accountId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Get all folders for this account
    const folders = await this.getFolders(accountId);
    
    // Update counts for each folder
    for (const folder of folders) {
      await this.updateFolderCounts(folder.id);
    }
    
  }

  async clearMessagesForAccount(accountId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('DELETE FROM messages WHERE account_id = ?');
    stmt.run(accountId);
    
  }

  // Message operations
  async getMessages(folderId: number, limit: number = 50, offset: number = 0): Promise<{ messages: EmailMessage[], total: number }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE folder_id = ? 
      ORDER BY date DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rawResult = stmt.all(folderId, limit, offset) as any[];
    
    // Convert date strings to Date objects and boolean fields
    const result = rawResult.map(row => ({
      ...row,
      date: new Date(row.date),
      isRead: Boolean(row.is_read),
      isFlagged: Boolean(row.is_flagged),
      isAnswered: Boolean(row.is_answered),
      isForwarded: Boolean(row.is_forwarded),
      accountId: row.account_id,
      folderId: row.folder_id,
      threadId: row.thread_id,
      htmlBody: row.html_body,
      createdAt: new Date(row.created_at)
    })) as EmailMessage[];
    
    return { messages: result, total: rawResult.length };
  }

  async getMessage(id: number): Promise<EmailMessage | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    const rawResult = stmt.get(id) as any;
    
    if (!rawResult) return null;
    
    // Convert date strings to Date objects and boolean fields
    return {
      ...rawResult,
      date: new Date(rawResult.date),
      isRead: Boolean(rawResult.is_read),
      isFlagged: Boolean(rawResult.is_flagged),
      isAnswered: Boolean(rawResult.is_answered),
      isForwarded: Boolean(rawResult.is_forwarded),
      accountId: rawResult.account_id,
      folderId: rawResult.folder_id,
      threadId: rawResult.thread_id,
      htmlBody: rawResult.html_body,
      createdAt: new Date(rawResult.created_at)
    } as EmailMessage;
  }

  async getMessageByUid(accountId: number, uid: string): Promise<EmailMessage | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM messages WHERE account_id = ? AND uid = ?');
    const rawResult = stmt.get(accountId, uid) as any;
    
    if (!rawResult) return null;
    
    // Convert date strings to Date objects and boolean fields
    return {
      ...rawResult,
      date: new Date(rawResult.date),
      isRead: Boolean(rawResult.is_read),
      isFlagged: Boolean(rawResult.is_flagged),
      isAnswered: Boolean(rawResult.is_answered),
      isForwarded: Boolean(rawResult.is_forwarded),
      accountId: rawResult.account_id,
      folderId: rawResult.folder_id,
      threadId: rawResult.thread_id,
      htmlBody: rawResult.html_body,
      createdAt: new Date(rawResult.created_at)
    } as EmailMessage;
  }

  async getMessagesByThreadId(threadId: string): Promise<EmailMessage[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE thread_id = ? 
      ORDER BY date ASC
    `);
    
    const rawResult = stmt.all(threadId) as any[];
    
    // Convert date strings to Date objects and boolean fields
    const result = rawResult.map(row => ({
      ...row,
      date: new Date(row.date),
      isRead: Boolean(row.is_read),
      isFlagged: Boolean(row.is_flagged),
      isAnswered: Boolean(row.is_answered),
      isForwarded: Boolean(row.is_forwarded),
      accountId: row.account_id,
      folderId: row.folder_id,
      threadId: row.thread_id,
      htmlBody: row.html_body,
      createdAt: new Date(row.created_at)
    })) as EmailMessage[];
    
    return result;
  }

  async addMessage(message: Omit<EmailMessage, 'id' | 'createdAt'>): Promise<EmailMessage> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Check if message already exists
    const existingMessage = await this.getMessageByUid(message.accountId, message.uid);
    if (existingMessage) {
      return existingMessage;
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO messages (account_id, folder_id, uid, thread_id, subject, sender, recipients, cc, bcc, body, html_body, date, is_read, is_flagged, is_answered, is_forwarded, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Convert boolean fields to numbers
    const isRead = message.isRead ? 1 : 0;
    const isFlagged = message.isFlagged ? 1 : 0;
    const isAnswered = message.isAnswered ? 1 : 0;
    const isForwarded = message.isForwarded ? 1 : 0;
    
    const params = [
      message.accountId,
      message.folderId,
      message.uid,
      message.threadId,
      message.subject,
      message.sender,
      message.recipients,
      message.cc,
      message.bcc,
      message.body,
      message.htmlBody,
      message.date.toISOString(),
      isRead,
      isFlagged,
      isAnswered,
      isForwarded,
      message.size
    ];
    
    const result = stmt.run(...params);
    
    // Get the inserted message
    const insertedMessage = await this.getMessage(result.lastInsertRowid as number);
    if (!insertedMessage) {
      throw new Error('Failed to retrieve inserted message');
    }
    
    return insertedMessage;
  }

  async updateMessage(message: EmailMessage): Promise<EmailMessage> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      UPDATE messages 
      SET subject = ?, sender = ?, recipients = ?, cc = ?, bcc = ?, body = ?, html_body = ?, 
          date = ?, is_read = ?, is_flagged = ?, is_answered = ?, is_forwarded = ?, size = ?
      WHERE id = ?
    `);
    
    stmt.run(
      message.subject,
      message.sender,
      message.recipients,
      message.cc,
      message.bcc,
      message.body,
      message.htmlBody,
      message.date.toISOString(),
      message.isRead,
      message.isFlagged,
      message.isAnswered,
      message.isForwarded,
      message.size,
      message.id
    );
    
    return this.getMessage(message.id) as Promise<EmailMessage>;
  }

  // Search operations
  async searchMessages(query: string, folderId?: number, limit: number = 50): Promise<EmailMessage[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Parse advanced search query
    const searchConditions = this.parseSearchQuery(query);
    
    if (searchConditions.length === 0 && !query.trim()) {
      return [];
    }
    
    let sql = 'SELECT * FROM messages WHERE 1=1';
    const params: any[] = [];
    
    // Add search conditions
    if (searchConditions.length > 0) {
      for (const condition of searchConditions) {
        sql += ` AND ${condition.sql}`;
        params.push(...condition.params);
      }
    } else {
      // Fallback to basic search
      const cleanQuery = query.trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanQuery) {
        const searchTerm = `%${cleanQuery}%`;
        sql += ' AND (subject LIKE ? OR sender LIKE ? OR body LIKE ? OR recipients LIKE ?)';
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
    }
    
    if (folderId) {
      sql += ' AND folder_id = ?';
      params.push(folderId);
    }
    
    sql += ' ORDER BY date DESC LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    const results = stmt.all(...params) as EmailMessage[];
    
    return results;
  }

  private parseSearchQuery(query: string): Array<{sql: string, params: any[]}> {
    const conditions: Array<{sql: string, params: any[]}> = [];
    
    // Parse subject filter
    const subjectMatch = query.match(/subject:"([^"]+)"/);
    if (subjectMatch) {
      conditions.push({
        sql: 'subject LIKE ?',
        params: [`%${subjectMatch[1]}%`]
      });
    }
    
    // Parse from filter
    const fromMatch = query.match(/from:"([^"]+)"/);
    if (fromMatch) {
      conditions.push({
        sql: 'sender LIKE ?',
        params: [`%${fromMatch[1]}%`]
      });
    }
    
    // Parse read status
    if (query.includes('is:read')) {
      conditions.push({
        sql: 'is_read = 1',
        params: []
      });
    } else if (query.includes('is:unread')) {
      conditions.push({
        sql: 'is_read = 0',
        params: []
      });
    }
    
    // Parse flagged status
    if (query.includes('is:flagged')) {
      conditions.push({
        sql: 'is_flagged = 1',
        params: []
      });
    }
    
    // Parse attachment filter
    if (query.includes('has:attachment')) {
      conditions.push({
        sql: 'has_attachments = 1',
        params: []
      });
    }
    
    // Parse date filters
    const afterMatch = query.match(/after:(\d{4}-\d{2}-\d{2})/);
    if (afterMatch) {
      conditions.push({
        sql: 'date >= ?',
        params: [afterMatch[1]]
      });
    }
    
    const beforeMatch = query.match(/before:(\d{4}-\d{2}-\d{2})/);
    if (beforeMatch) {
      conditions.push({
        sql: 'date <= ?',
        params: [beforeMatch[1]]
      });
    }
    
    return conditions;
  }

  // Cleanup
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
