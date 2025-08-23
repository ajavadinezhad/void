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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class DatabaseService {
    constructor() {
        this.db = null;
        const userDataPath = this.getUserDataPath();
        this.dbPath = path.join(userDataPath, 'void.db');
    }
    getUserDataPath() {
        const { app } = require('electron');
        return app.getPath('userData');
    }
    async initialize() {
        // Ensure directory exists
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        this.db = new better_sqlite3_1.default(this.dbPath);
        await this.createTables();
    }
    async createTables() {
        if (!this.db)
            throw new Error('Database not initialized');
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
    async getAccounts() {
        if (!this.db)
            throw new Error('Database not initialized');
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
        return stmt.all();
    }
    async addAccount(account) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      INSERT INTO accounts (name, email, provider, oauth_token, oauth_refresh_token, imap_host, imap_port, smtp_host, smtp_port)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(account.name, account.email, account.provider, account.oauthToken, account.oauthRefreshToken, account.imapHost, account.imapPort, account.smtpHost, account.smtpPort);
        return this.getAccount(result.lastInsertRowid);
    }
    async updateAccount(account) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      UPDATE accounts 
      SET name = ?, email = ?, provider = ?, oauth_token = ?, oauth_refresh_token = ?, 
          imap_host = ?, imap_port = ?, smtp_host = ?, smtp_port = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        stmt.run(account.name, account.email, account.provider, account.oauthToken, account.oauthRefreshToken, account.imapHost, account.imapPort, account.smtpHost, account.smtpPort, account.id);
        return this.getAccount(account.id);
    }
    async deleteAccount(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const transaction = this.db.transaction(() => {
            // Delete messages first
            const messagesStmt = this.db.prepare('DELETE FROM messages WHERE account_id = ?');
            const messagesDeleted = messagesStmt.run(id).changes;
            // Delete folders
            const foldersStmt = this.db.prepare('DELETE FROM folders WHERE account_id = ?');
            const foldersDeleted = foldersStmt.run(id).changes;
            // Delete attachments
            const attachmentsStmt = this.db.prepare('DELETE FROM attachments WHERE account_id = ?');
            const attachmentsDeleted = attachmentsStmt.run(id).changes;
            // Finally delete the account
            const accountStmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
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
    async getAccount(id) {
        if (!this.db)
            throw new Error('Database not initialized');
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
        const account = stmt.get(id);
        if (!account)
            throw new Error('Account not found');
        return account;
    }
    // Folder operations
    async getFolders(accountId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM folders WHERE account_id = ? ORDER BY id');
        const rawResult = stmt.all(accountId);
        // Convert field names to match the interface
        return rawResult.map(row => ({
            ...row,
            accountId: row.account_id,
            unreadCount: row.unread_count,
            totalCount: row.total_count
        }));
    }
    async addFolder(folder) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      INSERT INTO folders (account_id, name, path, type, unread_count, total_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(folder.accountId, folder.name, folder.path, folder.type, folder.unreadCount, folder.totalCount);
        return this.getFolder(result.lastInsertRowid);
    }
    async updateFolder(folder) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      UPDATE folders 
      SET name = ?, path = ?, type = ?, unread_count = ?, total_count = ?
      WHERE id = ?
    `);
        stmt.run(folder.name, folder.path, folder.type, folder.unreadCount, folder.totalCount, folder.id);
        return this.getFolder(folder.id);
    }
    async getFolder(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM folders WHERE id = ?');
        const rawResult = stmt.get(id);
        if (!rawResult)
            throw new Error('Folder not found');
        // Convert field names to match the interface
        return {
            ...rawResult,
            accountId: rawResult.account_id,
            unreadCount: rawResult.unread_count,
            totalCount: rawResult.total_count
        };
    }
    async updateFolderCounts(folderId) {
        if (!this.db)
            throw new Error('Database not initialized');
        // Get total count of messages in this folder
        const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM messages WHERE folder_id = ?');
        const totalResult = totalStmt.get(folderId);
        // Get unread count of messages in this folder
        const unreadStmt = this.db.prepare('SELECT COUNT(*) as unread FROM messages WHERE folder_id = ? AND is_read = 0');
        const unreadResult = unreadStmt.get(folderId);
        // Update the folder with the new counts
        const updateStmt = this.db.prepare('UPDATE folders SET total_count = ?, unread_count = ? WHERE id = ?');
        updateStmt.run(totalResult.total, unreadResult.unread, folderId);
    }
    async updateAllFolderCounts(accountId) {
        if (!this.db)
            throw new Error('Database not initialized');
        // Get all folders for this account
        const folders = await this.getFolders(accountId);
        // Update counts for each folder
        for (const folder of folders) {
            await this.updateFolderCounts(folder.id);
        }
    }
    async clearMessagesForAccount(accountId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('DELETE FROM messages WHERE account_id = ?');
        stmt.run(accountId);
    }
    // Message operations
    async getMessages(folderId, limit = 50, offset = 0) {
        if (!this.db)
            throw new Error('Database not initialized');
        // First, get the total count of messages in this folder
        const countStmt = this.db.prepare('SELECT COUNT(*) as total FROM messages WHERE folder_id = ?');
        const countResult = countStmt.get(folderId);
        const total = countResult.total;
        // Then, get the paginated messages
        const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE folder_id = ? 
      ORDER BY date DESC 
      LIMIT ? OFFSET ?
    `);
        const rawResult = stmt.all(folderId, limit, offset);
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
        }));
        return { messages: result, total };
    }
    async getMessage(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
        const rawResult = stmt.get(id);
        if (!rawResult)
            return null;
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
        };
    }
    async getMessageByUid(accountId, uid) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare('SELECT * FROM messages WHERE account_id = ? AND uid = ?');
        const rawResult = stmt.get(accountId, uid);
        if (!rawResult)
            return null;
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
        };
    }
    async getMessagesByThreadId(threadId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE thread_id = ? 
      ORDER BY date ASC
    `);
        const rawResult = stmt.all(threadId);
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
        }));
        return result;
    }
    async addMessage(message) {
        if (!this.db)
            throw new Error('Database not initialized');
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
        const insertedMessage = await this.getMessage(result.lastInsertRowid);
        if (!insertedMessage) {
            throw new Error('Failed to retrieve inserted message');
        }
        return insertedMessage;
    }
    async updateMessage(message) {
        if (!this.db)
            throw new Error('Database not initialized');
        const stmt = this.db.prepare(`
      UPDATE messages 
      SET subject = ?, sender = ?, recipients = ?, cc = ?, bcc = ?, body = ?, html_body = ?, 
          date = ?, is_read = ?, is_flagged = ?, is_answered = ?, is_forwarded = ?, size = ?
      WHERE id = ?
    `);
        stmt.run(message.subject, message.sender, message.recipients, message.cc, message.bcc, message.body, message.htmlBody, message.date.toISOString(), message.isRead, message.isFlagged, message.isAnswered, message.isForwarded, message.size, message.id);
        return this.getMessage(message.id);
    }
    // Search operations
    async searchMessages(query, folderId, limit = 50) {
        if (!this.db)
            throw new Error('Database not initialized');
        // Parse advanced search query
        const searchConditions = this.parseSearchQuery(query);
        if (searchConditions.length === 0 && !query.trim()) {
            return [];
        }
        let sql = 'SELECT * FROM messages WHERE 1=1';
        const params = [];
        // Add search conditions
        if (searchConditions.length > 0) {
            for (const condition of searchConditions) {
                sql += ` AND ${condition.sql}`;
                params.push(...condition.params);
            }
        }
        else {
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
        const results = stmt.all(...params);
        return results;
    }
    parseSearchQuery(query) {
        const conditions = [];
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
        }
        else if (query.includes('is:unread')) {
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
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
exports.DatabaseService = DatabaseService;
