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
exports.EmailService = void 0;
const imap_1 = __importDefault(require("imap"));
const nodemailer = __importStar(require("nodemailer"));
const mailparser_1 = require("mailparser");
class EmailService {
    constructor(databaseService, oauthService // OAuthService type
    ) {
        this.databaseService = databaseService;
        this.oauthService = oauthService;
        this.gmailApiBase = 'https://gmail.googleapis.com/gmail/v1/users/me';
    }
    // Gmail API Operations for syncing
    async syncFolder(accountId, folderId) {
        const account = await this.getAccount(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        console.log('EmailService: syncFolder called for account:', account.email);
        console.log('EmailService: Account provider:', account.provider);
        console.log('EmailService: Has OAuth token:', !!account.oauthToken);
        // For Gmail accounts, use Gmail API
        if (account.provider === 'gmail' && account.oauthToken) {
            console.log('EmailService: Using Gmail API sync');
            await this.syncGmailFolder(account, folderId);
        }
        else {
            console.log('EmailService: Using IMAP sync (fallback)');
            // Fallback to IMAP for other providers
            await this.syncImapFolder(account, folderId);
        }
    }
    // Refresh folders for an account (fetch from Gmail API and update database)
    async refreshFolders(accountId) {
        const account = await this.getAccount(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        console.log('EmailService: refreshFolders called for account:', account.email);
        if (account.provider === 'gmail' && account.oauthToken) {
            console.log('EmailService: Refreshing Gmail folders...');
            await this.ensureGmailFolders(account.id);
        }
        else {
            console.log('EmailService: Refresh folders not implemented for non-Gmail accounts');
        }
    }
    // Sync all folders for an account and update their counts
    async syncAllFolders(accountId) {
        console.log('EmailService: syncAllFolders called for account:', accountId);
        const account = await this.getAccount(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        if (account.provider === 'gmail') {
            await this.syncAllGmailFolders(account);
        }
    }
    async syncAllGmailFolders(account) {
        console.log('EmailService: Syncing all Gmail folders for account:', account.email);
        try {
            // First, clear all existing messages for this account to avoid duplicates
            console.log('EmailService: Clearing existing messages for account:', account.id);
            await this.databaseService.clearMessagesForAccount(account.id);
            // Ensure we have all Gmail folders in the database
            console.log('EmailService: Creating Gmail folders...');
            await this.ensureGmailFolders(account.id);
            // Get all folders for this account
            const folders = await this.databaseService.getFolders(account.id);
            console.log('EmailService: Found', folders.length, 'folders to sync');
            // Sync each folder individually using Gmail labels
            for (const folder of folders) {
                try {
                    console.log('EmailService: Syncing folder:', folder.name, 'ID:', folder.id, 'Path:', folder.path);
                    await this.syncGmailFolderByLabel(account, folder);
                }
                catch (error) {
                    console.error('EmailService: Error syncing folder', folder.name, ':', error);
                    // Continue with other folders even if one fails
                }
            }
            // Update counts for all folders after syncing
            console.log('EmailService: Updating counts for all folders...');
            await this.databaseService.updateAllFolderCounts(account.id);
            console.log('EmailService: All Gmail folders sync completed');
        }
        catch (error) {
            console.error('EmailService: Error syncing all Gmail folders:', error);
            throw error;
        }
    }
    async syncGmailFolderByLabel(account, folder) {
        console.log('EmailService: Syncing Gmail folder by label:', folder.name, 'Path:', folder.path);
        try {
            // Get messages for this specific label from Gmail API
            const messages = await this.getGmailMessagesByLabel(account.id, folder.path, 100);
            console.log('EmailService: Fetched', messages.length, 'messages for label:', folder.path);
            if (messages.length === 0) {
                console.log('EmailService: No messages found for label:', folder.path);
                return;
            }
            // Process each message for this folder
            console.log('EmailService: Processing', messages.length, 'messages for folder:', folder.name);
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                console.log(`EmailService: Processing message ${i + 1}/${messages.length} for folder ${folder.name}:`, message.id);
                await this.processGmailMessage(account.id, folder.id, message.id);
            }
            console.log('EmailService: Completed syncing folder:', folder.name);
        }
        catch (error) {
            console.error('EmailService: Error syncing folder by label:', folder.name, error);
            throw error;
        }
    }
    async syncGmailFolder(account, folderId) {
        console.log('EmailService: Syncing Gmail folder for account:', account.email);
        try {
            // First, ensure we have the inbox folder in the database
            console.log('EmailService: Creating Gmail folders...');
            await this.ensureGmailFolders(account.id);
            // Get the inbox folder ID after creation
            const folders = await this.databaseService.getFolders(account.id);
            const inboxFolder = folders.find(f => f.type === 'inbox');
            const targetFolderId = inboxFolder ? inboxFolder.id : 1;
            console.log('EmailService: Using folder ID:', targetFolderId, 'for account:', account.id);
            // Get messages from Gmail API
            const messages = await this.getGmailMessages(account.id, 100); // Increased to fetch more emails
            console.log('EmailService: Fetched', messages.length, 'messages from Gmail');
            if (messages.length === 0) {
                console.log('EmailService: WARNING - No messages returned from Gmail API');
                console.log('EmailService: This could indicate:');
                console.log('EmailService: 1. No emails in the inbox');
                console.log('EmailService: 2. OAuth token issues');
                console.log('EmailService: 3. Gmail API permissions issues');
                console.log('EmailService: 4. Network connectivity issues');
            }
            // Process each message
            console.log('EmailService: Processing', messages.length, 'messages...');
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                console.log(`EmailService: Processing message ${i + 1}/${messages.length}:`, message.id);
                await this.processGmailMessage(account.id, targetFolderId, message.id);
            }
            // Update folder counts after processing all messages
            console.log('EmailService: Updating folder counts...');
            await this.databaseService.updateFolderCounts(targetFolderId);
            console.log('EmailService: Gmail sync completed');
        }
        catch (error) {
            console.error('EmailService: Error syncing Gmail folder:', error);
            throw error;
        }
    }
    async ensureGmailFolders(accountId) {
        const account = await this.getAccount(accountId);
        if (!account || !account.oauthToken) {
            throw new Error('Account not found or no OAuth token');
        }
        try {
            // Fetch Gmail labels (folders) from Gmail API
            console.log('EmailService: Fetching Gmail labels...');
            const labels = await this.fetchGmailLabels(account.oauthToken, account.id);
            console.log('EmailService: Fetched labels:', labels);
            // Process each label and create folders
            for (const label of labels) {
                try {
                    const folderType = this.mapGmailLabelToFolderType(label.id);
                    const folderName = this.getDisplayNameForLabel(label);
                    await this.databaseService.addFolder({
                        accountId,
                        name: folderName,
                        path: label.id,
                        type: folderType,
                        unreadCount: label.messagesUnread || 0,
                        totalCount: label.messagesTotal || 0
                    });
                    console.log('EmailService: Created folder:', folderName, 'type:', folderType);
                }
                catch (error) {
                    // Folder might already exist, ignore error
                    console.log('EmailService: Folder might already exist:', label.id);
                }
            }
        }
        catch (error) {
            console.error('EmailService: Error fetching Gmail labels:', error);
            // Fallback to default folders if Gmail API fails
            console.log('EmailService: Falling back to default folders...');
            await this.createDefaultGmailFolders(accountId);
        }
    }
    async refreshAccountToken(accountId) {
        try {
            const account = await this.getAccount(accountId);
            if (!account || !account.oauthRefreshToken) {
                console.error('EmailService: No refresh token available for account:', accountId);
                return null;
            }
            console.log('EmailService: Refreshing token for account:', account.email);
            const tokenData = await this.oauthService.refreshToken(account.oauthRefreshToken, 'gmail');
            // Update the account with the new token
            await this.databaseService.updateAccount({
                ...account,
                oauthToken: tokenData.accessToken
            });
            console.log('EmailService: Token refreshed successfully');
            return tokenData.accessToken;
        }
        catch (error) {
            console.error('EmailService: Failed to refresh token:', error);
            return null;
        }
    }
    async fetchGmailLabels(oauthToken, accountId) {
        console.log('EmailService: fetchGmailLabels called with token length:', oauthToken?.length);
        console.log('EmailService: Gmail API URL:', `${this.gmailApiBase}/labels`);
        try {
            const response = await fetch(`${this.gmailApiBase}/labels`, {
                headers: {
                    'Authorization': `Bearer ${oauthToken}`,
                }
            });
            console.log('EmailService: Gmail API response status:', response.status);
            console.log('EmailService: Gmail API response status text:', response.statusText);
            if (response.status === 401 && accountId) {
                console.log('EmailService: Token expired, attempting to refresh...');
                const refreshedToken = await this.refreshAccountToken(accountId);
                if (refreshedToken) {
                    console.log('EmailService: Token refreshed, retrying API call...');
                    return this.fetchGmailLabels(refreshedToken);
                }
            }
            if (!response.ok) {
                const errorText = await response.text();
                console.error('EmailService: Gmail API error response:', errorText);
                throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('EmailService: Gmail API response data:', data);
            console.log('EmailService: Number of labels returned:', data.labels?.length || 0);
            return data.labels || [];
        }
        catch (error) {
            console.error('EmailService: Error fetching Gmail labels:', error);
            throw error;
        }
    }
    mapGmailLabelToFolderType(labelId) {
        switch (labelId) {
            case 'INBOX':
                return 'inbox';
            case 'SENT':
                return 'sent';
            case 'DRAFT':
                return 'drafts';
            case 'TRASH':
                return 'trash';
            case 'SPAM':
                return 'custom';
            default:
                return 'custom';
        }
    }
    getDisplayNameForLabel(label) {
        // Use the label name, but clean it up for display
        let name = label.name || label.id;
        // Remove system prefixes for better display
        if (name.startsWith('CATEGORY_')) {
            name = name.replace('CATEGORY_', '');
        }
        // Capitalize first letter of each word
        return name.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
    async createDefaultGmailFolders(accountId) {
        // Create default Gmail folders if they don't exist
        const defaultFolders = [
            { name: 'INBOX', path: 'INBOX', type: 'inbox' },
            { name: 'Sent', path: 'SENT', type: 'sent' },
            { name: 'Drafts', path: 'DRAFTS', type: 'drafts' },
            { name: 'Trash', path: 'TRASH', type: 'trash' }
        ];
        for (const folder of defaultFolders) {
            try {
                await this.databaseService.addFolder({
                    accountId,
                    name: folder.name,
                    path: folder.path,
                    type: folder.type,
                    unreadCount: 0,
                    totalCount: 0
                });
            }
            catch (error) {
                // Folder might already exist, ignore error
                console.log('EmailService: Folder might already exist:', folder.name);
            }
        }
    }
    async processGmailMessage(accountId, folderId, messageId) {
        try {
            const account = await this.getAccount(accountId);
            if (!account || !account.oauthToken) {
                throw new Error('Account not found or no OAuth token');
            }
            // Get full message details from Gmail API
            const response = await fetch(`${this.gmailApiBase}/messages/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${account.oauthToken}`,
                }
            });
            if (!response.ok) {
                throw new Error(`Gmail API error: ${response.statusText}`);
            }
            const messageData = await response.json();
            // Extract message details
            const headers = messageData.payload?.headers || [];
            const subject = headers.find((h) => h.name === 'Subject')?.value || '';
            const from = headers.find((h) => h.name === 'From')?.value || '';
            const to = headers.find((h) => h.name === 'To')?.value || '';
            const date = headers.find((h) => h.name === 'Date')?.value || '';
            // Get message body
            let body = '';
            if (messageData.payload?.body?.data) {
                body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
            }
            else if (messageData.payload?.parts) {
                const textPart = messageData.payload.parts.find((part) => part.mimeType === 'text/plain');
                if (textPart?.body?.data) {
                    body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                }
            }
            // Create email message object with safe data types for SQLite
            const emailMessage = {
                accountId: Number(accountId),
                folderId: Number(folderId),
                uid: String(messageId),
                threadId: String(messageData.threadId || `thread-${Date.now()}`),
                subject: String(subject || ''),
                sender: String(from || ''),
                recipients: String(to || ''),
                cc: '',
                bcc: '',
                body: String(body || ''),
                htmlBody: String(body || ''),
                date: date ? new Date(date) : new Date(),
                isRead: false,
                isFlagged: false,
                isAnswered: false,
                isForwarded: false,
                size: Number(messageData.sizeEstimate || 0)
            };
            // Debug: Check the boolean types
            console.log('EmailService: Boolean field types:', {
                isRead: { value: emailMessage.isRead, type: typeof emailMessage.isRead, constructor: emailMessage.isRead?.constructor?.name },
                isFlagged: { value: emailMessage.isFlagged, type: typeof emailMessage.isFlagged, constructor: emailMessage.isFlagged?.constructor?.name },
                isAnswered: { value: emailMessage.isAnswered, type: typeof emailMessage.isAnswered, constructor: emailMessage.isAnswered?.constructor?.name },
                isForwarded: { value: emailMessage.isForwarded, type: typeof emailMessage.isForwarded, constructor: emailMessage.isForwarded?.constructor?.name }
            });
            // Add to database
            console.log('EmailService: Adding message to database:', {
                subject: emailMessage.subject,
                sender: emailMessage.sender,
                date: emailMessage.date,
                size: emailMessage.size,
                bodyLength: emailMessage.body?.length || 0
            });
            // Debug: Log all fields being passed to SQLite
            console.log('EmailService: SQLite parameters:', {
                accountId: emailMessage.accountId,
                folderId: emailMessage.folderId,
                uid: emailMessage.uid,
                threadId: emailMessage.threadId,
                subject: emailMessage.subject,
                sender: emailMessage.sender,
                recipients: emailMessage.recipients,
                cc: emailMessage.cc,
                bcc: emailMessage.bcc,
                body: emailMessage.body?.substring(0, 100) + '...',
                htmlBody: emailMessage.htmlBody?.substring(0, 100) + '...',
                date: emailMessage.date.toISOString(),
                isRead: emailMessage.isRead,
                isFlagged: emailMessage.isFlagged,
                isAnswered: emailMessage.isAnswered,
                isForwarded: emailMessage.isForwarded,
                size: emailMessage.size
            });
            const addedMessage = await this.databaseService.addMessage(emailMessage);
            console.log('EmailService: Added message to database:', subject, 'with ID:', addedMessage.id);
            // Verify the message was added
            const verifyMessage = await this.databaseService.getMessage(addedMessage.id);
            console.log('EmailService: Verification - message in database:', !!verifyMessage);
        }
        catch (error) {
            console.error('EmailService: Error processing Gmail message:', error);
        }
    }
    // IMAP Operations (fallback for non-Gmail providers)
    async syncImapFolder(account, folderId) {
        const folder = await this.getFolder(folderId);
        if (!folder) {
            throw new Error('Folder not found');
        }
        const imap = this.createImapConnection(account);
        return new Promise((resolve, reject) => {
            imap.once('ready', () => {
                imap.openBox(folder.path, false, (err, box) => {
                    if (err) {
                        imap.end();
                        reject(err);
                        return;
                    }
                    // Get all messages
                    const fetch = imap.seq.fetch('1:*', {
                        bodies: '',
                        struct: true
                    });
                    fetch.on('message', (msg, seqno) => {
                        let buffer = '';
                        let messageAttributes = null;
                        msg.on('body', (stream, info) => {
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                        });
                        // Capture IMAP attributes; on Gmail this can include x-gm-thrid
                        msg.on('attributes', (attrs) => {
                            messageAttributes = attrs;
                        });
                        msg.once('end', async () => {
                            try {
                                const parsed = await (0, mailparser_1.simpleParser)(buffer);
                                // Prefer Gmail's thread id if available; otherwise derive from headers
                                const gmailThreadId = messageAttributes?.['x-gm-thrid']
                                    ? String(messageAttributes['x-gm-thrid'])
                                    : undefined;
                                const derivedFromHeaders = parsed.inReplyTo
                                    || (Array.isArray(parsed.references) && parsed.references[0])
                                    || parsed.messageId
                                    || `thread-${Date.now()}`;
                                const emailMessage = {
                                    accountId: account.id,
                                    folderId,
                                    uid: seqno.toString(),
                                    threadId: gmailThreadId || String(derivedFromHeaders),
                                    subject: parsed.subject || '',
                                    sender: Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '',
                                    recipients: Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '',
                                    cc: Array.isArray(parsed.cc) ? parsed.cc[0]?.text || '' : parsed.cc?.text || '',
                                    bcc: Array.isArray(parsed.bcc) ? parsed.bcc[0]?.text || '' : parsed.bcc?.text || '',
                                    body: parsed.text || '',
                                    htmlBody: parsed.html || '',
                                    date: parsed.date || new Date(),
                                    isRead: false,
                                    isFlagged: false,
                                    isAnswered: false,
                                    isForwarded: false,
                                    size: 0
                                };
                                await this.databaseService.addMessage(emailMessage);
                            }
                            catch (error) {
                                console.error('Error parsing message:', error);
                            }
                        });
                    });
                    fetch.once('error', (err) => {
                        imap.end();
                        reject(err);
                    });
                    fetch.once('end', () => {
                        imap.end();
                        resolve();
                    });
                });
            });
            imap.once('error', (err) => {
                reject(err);
            });
            imap.connect();
        });
    }
    async testConnection(account) {
        const imap = this.createImapConnection(account);
        return new Promise((resolve) => {
            imap.once('ready', () => {
                imap.end();
                resolve(true);
            });
            imap.once('error', () => {
                imap.end();
                resolve(false);
            });
            imap.connect();
        });
    }
    createImapConnection(account) {
        const config = {
            host: account.imapHost || this.getDefaultImapHost(account.provider),
            port: account.imapPort || this.getDefaultImapPort(account.provider),
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            user: account.email,
            password: account.oauthToken || '', // For OAuth2, token is used as password
        };
        return new imap_1.default(config);
    }
    // Gmail API Operations
    async sendMessageViaGmail(composeEmail) {
        const account = await this.getAccount(composeEmail.accountId);
        if (!account || !account.oauthToken) {
            throw new Error('Account not found or no OAuth token');
        }
        try {
            // Create email message in Gmail format
            const emailContent = this.createGmailMessage({ ...composeEmail, from: account.email });
            const encodedMessage = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
            const response = await fetch(`${this.gmailApiBase}/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${account.oauthToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    raw: encodedMessage
                })
            });
            if (!response.ok) {
                throw new Error(`Gmail API error: ${response.statusText}`);
            }
            return true;
        }
        catch (error) {
            console.error('Error sending email via Gmail API:', error);
            return false;
        }
    }
    async getGmailMessagesByLabel(accountId, labelId, maxResults = 50) {
        const account = await this.getAccount(accountId);
        if (!account || !account.oauthToken) {
            throw new Error('Account not found or no OAuth token');
        }
        try {
            console.log('EmailService: Fetching Gmail messages for label:', labelId);
            const response = await fetch(`${this.gmailApiBase}/messages?labelIds=${labelId}&maxResults=${maxResults}`, {
                headers: {
                    'Authorization': `Bearer ${account.oauthToken}`,
                }
            });
            if (response.status === 401) {
                console.log('EmailService: Token expired, attempting to refresh...');
                const refreshedToken = await this.refreshAccountToken(accountId);
                if (refreshedToken) {
                    console.log('EmailService: Token refreshed, retrying API call...');
                    return this.getGmailMessagesByLabel(accountId, labelId, maxResults);
                }
            }
            if (!response.ok) {
                const errorText = await response.text();
                console.error('EmailService: Gmail API error response for label', labelId, ':', errorText);
                throw new Error(`Gmail API error for label ${labelId}: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('EmailService: Gmail API response for label', labelId, ':', data.messages?.length || 0, 'messages');
            return data.messages || [];
        }
        catch (error) {
            console.error('EmailService: Error fetching Gmail messages for label', labelId, ':', error);
            throw error;
        }
    }
    async getGmailMessages(accountId, maxResults = 100) {
        const account = await this.getAccount(accountId);
        if (!account || !account.oauthToken) {
            console.error('EmailService: Account not found or no OAuth token');
            throw new Error('Account not found or no OAuth token');
        }
        console.log('EmailService: Fetching Gmail messages for account:', account.email);
        console.log('EmailService: Using OAuth token:', account.oauthToken.substring(0, 20) + '...');
        console.log('EmailService: Full OAuth token length:', account.oauthToken.length);
        console.log('EmailService: OAuth token starts with:', account.oauthToken.substring(0, 50) + '...');
        try {
            // First, let's try to get any messages without limiting the results
            const url = `${this.gmailApiBase}/messages?maxResults=${maxResults}`;
            console.log('EmailService: Gmail API URL:', url);
            console.log('EmailService: Gmail API base URL:', this.gmailApiBase);
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${account.oauthToken}`,
                }
            });
            console.log('EmailService: Gmail API response status:', response.status);
            if (response.status === 401) {
                console.log('EmailService: Token expired, attempting to refresh...');
                const refreshedToken = await this.refreshAccountToken(accountId);
                if (refreshedToken) {
                    console.log('EmailService: Token refreshed, retrying API call...');
                    return this.getGmailMessages(accountId, maxResults);
                }
            }
            if (!response.ok) {
                const errorText = await response.text();
                console.error('EmailService: Gmail API error response:', errorText);
                console.error('EmailService: Gmail API response status:', response.status);
                console.error('EmailService: Gmail API response headers:', Object.fromEntries(response.headers.entries()));
                throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('EmailService: Gmail API response data:', data);
            console.log('EmailService: Messages array length:', data.messages?.length || 0);
            console.log('EmailService: Response keys:', Object.keys(data));
            if (data.messages && data.messages.length > 0) {
                console.log('EmailService: First message ID:', data.messages[0].id);
                console.log('EmailService: First message snippet:', data.messages[0].snippet);
            }
            else {
                console.log('EmailService: No messages found in Gmail API response');
                console.log('EmailService: This could mean:');
                console.log('EmailService: 1. The inbox is empty');
                console.log('EmailService: 2. The OAuth token doesn\'t have the right permissions');
                console.log('EmailService: 3. The Gmail API is not returning messages for this account');
                // Let's test if the OAuth token is valid by checking user profile
                try {
                    console.log('EmailService: Testing OAuth token validity...');
                    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: {
                            'Authorization': `Bearer ${account.oauthToken}`,
                        }
                    });
                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        console.log('EmailService: OAuth token is valid, user profile:', profileData);
                    }
                    else {
                        console.log('EmailService: OAuth token is invalid, profile response:', profileResponse.status);
                    }
                }
                catch (profileError) {
                    console.log('EmailService: Error testing OAuth token:', profileError);
                }
            }
            return data.messages || [];
        }
        catch (error) {
            console.error('EmailService: Error fetching Gmail messages:', error);
            throw error;
        }
    }
    createGmailMessage(composeEmail) {
        const headers = [
            `From: ${composeEmail.from}`,
            `To: ${composeEmail.to.join(', ')}`,
            `Subject: ${composeEmail.subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=utf-8',
            'Content-Transfer-Encoding: 7bit',
            ''
        ];
        if (composeEmail.cc && composeEmail.cc.length > 0) {
            headers.splice(3, 0, `Cc: ${composeEmail.cc.join(', ')}`);
        }
        if (composeEmail.bcc && composeEmail.bcc.length > 0) {
            headers.splice(3, 0, `Bcc: ${composeEmail.bcc.join(', ')}`);
        }
        return headers.join('\r\n') + '\r\n' + composeEmail.body;
    }
    // SMTP Operations (fallback)
    async sendMessage(composeEmail) {
        const account = await this.getAccount(composeEmail.accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        // Try Gmail API first for Gmail accounts
        if (account.provider === 'gmail' && account.oauthToken) {
            return this.sendMessageViaGmail(composeEmail);
        }
        // Fallback to SMTP
        const transporter = this.createSmtpTransporter(account);
        const mailOptions = {
            from: account.email,
            to: composeEmail.to.join(', '),
            cc: composeEmail.cc?.join(', '),
            bcc: composeEmail.bcc?.join(', '),
            subject: composeEmail.subject,
            text: composeEmail.body,
            html: composeEmail.htmlBody
        };
        try {
            await transporter.sendMail(mailOptions);
            return true;
        }
        catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }
    createSmtpTransporter(account) {
        const config = {
            host: account.smtpHost || this.getDefaultSmtpHost(account.provider),
            port: account.smtpPort || this.getDefaultSmtpPort(account.provider),
            secure: true,
            auth: {
                user: account.email,
                pass: account.oauthToken || '', // For OAuth2, token is used as password
            }
        };
        return nodemailer.createTransport(config);
    }
    // Helper methods
    async getAccount(id) {
        const accounts = await this.databaseService.getAccounts();
        const account = accounts.find(account => account.id === id) || null;
        if (account) {
            console.log('EmailService: Found account:', {
                id: account.id,
                email: account.email,
                provider: account.provider,
                hasOAuthToken: !!account.oauthToken,
                oauthTokenLength: account.oauthToken?.length || 0
            });
        }
        return account;
    }
    async getFolder(id) {
        // Get all folders and find by ID
        const accounts = await this.databaseService.getAccounts();
        for (const account of accounts) {
            const folders = await this.databaseService.getFolders(account.id);
            const folder = folders.find(f => f.id === id);
            if (folder)
                return folder;
        }
        return null;
    }
    getDefaultImapHost(provider) {
        switch (provider) {
            case 'gmail':
                return 'imap.gmail.com';
            case 'outlook':
                return 'outlook.office365.com';
            case 'yahoo':
                return 'imap.mail.yahoo.com';
            default:
                return 'localhost';
        }
    }
    getDefaultImapPort(provider) {
        switch (provider) {
            case 'gmail':
            case 'outlook':
            case 'yahoo':
                return 993;
            default:
                return 143;
        }
    }
    getDefaultSmtpHost(provider) {
        switch (provider) {
            case 'gmail':
                return 'smtp.gmail.com';
            case 'outlook':
                return 'smtp.office365.com';
            case 'yahoo':
                return 'smtp.mail.yahoo.com';
            default:
                return 'localhost';
        }
    }
    getDefaultSmtpPort(provider) {
        switch (provider) {
            case 'gmail':
            case 'outlook':
            case 'yahoo':
                return 587;
            default:
                return 25;
        }
    }
}
exports.EmailService = EmailService;
