## Void Development Plan

### Implemented (current session)
- Core UX
  - Inbox opens threads by default when selecting a message
  - Collapsed sidebar shows folder icons (larger 40x40 hit-area) with unread badges
  - Sidebar ordering: Inbox first; other folders sorted by `id` consistently

- Email reading & conversation
  - Thread view (`EmailThread`) with per-message expand/collapse, attachments list, and actions (reply/forward)
  - Reply and Forward from `EmailDetail` using `ComposeModal` with prefilled subject/body
  - Safe HTML rendering and plaintext fallback

- Compose
  - `ComposeModal` supports To/Cc/Bcc dynamic fields, attachments (drag/drop + picker)
  - Modal modes: new/reply/forward with header title and initial data prefill

- Data & IPC
  - DB: `getMessagesByThreadId(threadId)` added and indexed path used
  - IPC: `db:get-messages-by-thread-id` exposed; preload bridge method `getMessagesByThreadId`
  - Gmail threading improvements: prefer Gmail `threadId`; for IMAP fallback derive from `X-GM-THRID` / `In-Reply-To` / `References` / `Message-ID`

- Refresh UX
  - Refresh progress bar logic improved: starts at 0%, smooth progress to 90%, finishes at 100%, auto-resets

- Updates (basic wiring)
  - Main process integrates optional `electron-updater` (lazy-loaded); IPC handlers: `updates:check`, `updates:download`, `updates:quit-and-install`
  - Preload exposes `checkForUpdates`, `downloadUpdate`, `quitAndInstall`, `onUpdateEvent`
  - Header adds icon button to trigger check; status piped via events (tooltips/pulse)
  - Note: currently logs "not configured" until publish provider is set

### Recently Implemented (Latest Session)
- **AI Integration**
  - ✅ AI Assistant side panel with chat interface
  - ✅ OpenAI and Claude API integration
  - ✅ Email summarization and analysis
  - ✅ Smart reply suggestions and action extraction
  - ✅ AI settings panel for API configuration
  - ✅ Quick actions for email processing
  - ✅ Tone analysis and general email assistance

- **Enhanced Email Rendering**
  - ✅ Fixed HTML content extraction from Gmail API
  - ✅ Improved plain text rendering with auto-link detection
  - ✅ Smart content type detection and fallback
  - ✅ Enhanced typography and styling for email content
  - ✅ Proper HTML vs plain text handling

- **UI Improvements**
  - ✅ Collapsible sidebar with smooth animations
  - ✅ Custom scrollbar styling throughout the app
  - ✅ Improved email detail view with better content rendering
  - ✅ Enhanced folder navigation with unread count badges
  - ✅ Better responsive design and accessibility

- **Data Management**
  - ✅ Fixed email read/unread status detection
  - ✅ Improved folder count synchronization
  - ✅ Enhanced refresh flow with progress indicators
  - ✅ Better event-driven UI updates
  - ✅ Robust error handling and recovery

- **Development Experience**
  - ✅ Quick restart functionality for faster development
  - ✅ Improved build process with separate Electron builds
  - ✅ Better debugging and logging throughout the application
  - ✅ Consistent code style and patterns

### Needs Implementation / Next Up
- Updates & Distribution
  - Add `electron-updater` as dependency and configure `electron-builder` publish provider (e.g., GitHub Releases)
  - Provide `build.publish` configuration and CI pipeline to draft/upload releases
  - Implement UI prompts: Download update, Restart to install (use `downloadUpdate` + `quitAndInstall`)

- Send Email
  - Implement `window.electronAPI.sendMessage` path in main service to actually send via SMTP/OAuth
  - Handle drafts/sent folder placement and sent message persistence

- Message Actions
  - Implement archive, delete, flag/unflag, mark read/unread with DB updates and UI state sync
  - Add context menu on list and in-thread messages

- Attachments
  - Download/open attachment files; persist metadata/path and handle viewing safely
  - Drag files from message to file system (optional)

- Search
  - Incremental search and filters (read/flagged/date range)
  - Highlighting of search terms in list and detail

- Accounts & Providers
  - Non‑Gmail providers (IMAP/SMTP) full parity: token/credential storage, folder mapping, sync
  - Account add/remove flows with validation and error handling

- Settings
  - UI toggles for theme, auto‑sync interval, notifications, sounds
  - Per‑account sync controls; safe reset/clear data tools

- Performance & Reliability
  - Pagination/infinite scroll tuning; background sync; debounced search
  - Robust error surfaces with retry; telemetry/log levels in dev vs prod

### Polishing / Nice‑to‑Have
- Keyboard shortcuts (navigation, compose, reply, archive)
- Thread rendering optimizations for long conversations
- Link detection and safe external open; image loading controls in HTML
- Theming polish and small-screen responsiveness
- Enhanced AI features with more providers and capabilities
- Email scheduling and automation features

### QA Checklist (short)
- Thread view loads messages by `threadId`; reply/forward prefill verified
- Sidebar: Inbox first; order stable across restarts; icons visible when collapsed
- Refresh progress shows 0→90%→100% and resets
- Update check button surfaces status (if updater configured)
- AI assistant panel opens/closes correctly and functions properly
- Email content renders correctly with HTML and plain text fallback
- Custom scrollbars appear consistently throughout the application
- Collapsible sidebar transitions smoothly and maintains functionality

---
Last updated: keep this file in sync as features land. When a section is completed, move it to Implemented and add any caveats/notes.

# Void - Cross-Platform Email Client

A modern email client application built with Electron, React, and TypeScript for cross-platform desktop support (Windows, macOS, Linux).

## Current Status: Phase 2 (Core Features) 🚀

**Phase 2 - Core Features (IN PROGRESS):**
- ✅ Email infrastructure and database setup
- ✅ Gmail OAuth2 integration and email synchronization
- ✅ Basic UI framework with three-pane layout
- ✅ Email reading and conversation view
- ✅ AI assistant integration with OpenAI and Claude
- ✅ Enhanced email content rendering
- ✅ Collapsible sidebar and custom scrollbars
- 📋 Email composition and sending
- 📋 Advanced search and filtering
- 📋 Message actions (archive, delete, flag)
- 📋 Attachment handling

## Features

**Implemented Features:**
- 🎯 Cross-platform desktop application (Windows, macOS, Linux)
- 🎯 Modern, responsive UI with dark/light theme support
- 🎯 Three-pane layout (sidebar, email list, conversation view)
- 🎯 Gmail account support with OAuth2 authentication
- 🎯 Real-time email synchronization
- 🎯 Offline email storage with SQLite
- 🎯 AI assistant with OpenAI and Claude integration
- 🎯 Enhanced email content rendering (HTML + plain text)
- 🎯 Collapsible sidebar with smooth animations
- 🎯 Custom scrollbar styling throughout the app
- 🎯 Email threading and conversation view
- 🎯 Folder navigation with unread counts
- 🎯 Event-driven UI updates and refresh system

**Planned Features (Future Phases):**
- 🎯 Multiple email account support (Outlook, Yahoo, IMAP/SMTP)
- 🎯 Email composition with rich text editor
- 🎯 Attachment support and file management
- 🎯 Advanced search with full-text indexing
- 🎯 Contact management and address book
- 🎯 Email encryption (PGP/GPG support)
- 🎯 Calendar integration
- 🎯 Email scheduling and automation
- 🎯 Keyboard shortcuts and accessibility
- 🎯 Notification system
- 🎯 Auto-update mechanism
- 🎯 Plugin system for extensions

## Technology Stack

**Core Technologies:**
- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building user interfaces
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework with custom prose styling
- **Headless UI**: Unstyled, accessible UI components

**Email & Data:**
- **Node.js**: Runtime environment for backend logic
- **SQLite**: Local database for email storage and indexing
- **node-imap**: IMAP client library
- **nodemailer**: SMTP client for sending emails
- **node-oauth2**: OAuth2 authentication
- **node-gmail-api**: Gmail API integration

**AI Integration:**
- **OpenAI API**: GPT-4 and GPT-3.5 Turbo for email assistance
- **Anthropic Claude API**: Claude 3 models for alternative AI features
- **Custom AI Service**: Unified interface for multiple AI providers

**Development Tools:**
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Unit testing framework
- **Electron Builder**: Application packaging and distribution
- **Electron Forge**: Development and packaging tools

## Project Structure

```
void/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts         # Main process entry point
│   │   ├── preload.ts       # Preload script for IPC
│   │   └── services/        # Email, auth, database, AI services
│   ├── renderer/            # Electron renderer process (React app)
│   │   ├── components/      # React components
│   │   │   ├── AI/         # AI assistant components
│   │   │   ├── Email/      # Email-related components
│   │   │   └── Layout/     # Layout and navigation components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # State management
│   │   └── main.tsx         # React entry point
│   └── shared/              # Shared code between main and renderer
│       └── types/           # TypeScript type definitions
├── assets/                  # Static assets
├── dist/                    # Build output
├── electron-builder.json    # Electron Builder configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.ts          # Vite configuration
```

## Development Phases

### Phase 0: Project Foundation ✅ COMPLETED
- ✅ Initialize Electron project with React + TypeScript
- ✅ Set up development environment and build tools
- ✅ Configure ESLint, Prettier, and testing setup
- ✅ Create basic application structure
- ✅ Implement main process and renderer process communication
- ✅ Set up Tailwind CSS and basic styling

### Phase 1: Core UI Framework ✅ COMPLETED
- ✅ Design and implement three-pane layout
- ✅ Create responsive sidebar with folder navigation
- ✅ Build email list component with virtual scrolling
- ✅ Implement conversation view with message threading
- ✅ Add settings window and preferences management
- ✅ Implement dark/light theme switching
- ✅ Create loading states and error handling

### Phase 2: Email Infrastructure ✅ COMPLETED
- ✅ Set up SQLite database schema
- ✅ Implement Gmail API integration for email retrieval
- ✅ Add OAuth2 authentication for Gmail
- ✅ Create email parsing and storage system
- ✅ Implement email synchronization system
- ✅ Add account management (add, edit, remove)
- ✅ Create event-driven UI update system

### Phase 3: AI Integration ✅ COMPLETED
- ✅ Integrate OpenAI API for email assistance
- ✅ Add Claude API as alternative AI provider
- ✅ Implement AI assistant side panel
- ✅ Create email summarization and analysis
- ✅ Add smart reply suggestions and action extraction
- ✅ Implement AI settings and configuration
- ✅ Add quick actions for email processing

### Phase 4: UI Enhancements ✅ COMPLETED
- ✅ Enhanced email content rendering (HTML + plain text)
- ✅ Implement collapsible sidebar with smooth animations
- ✅ Add custom scrollbar styling throughout the app
- ✅ Improve email detail view with better content rendering
- ✅ Enhanced folder navigation with unread count badges
- ✅ Better responsive design and accessibility

### Phase 5: Email Management (IN PROGRESS)
- [ ] Implement email composition with rich text editor
- [ ] Add attachment support and file handling
- [ ] Create email search with full-text indexing
- [ ] Implement email filtering and organization
- [ ] Add keyboard shortcuts and accessibility features
- [ ] Create notification system
- [ ] Implement offline email access

### Phase 6: Advanced Features (PLANNED)
- [ ] Add contact management and address book
- [ ] Implement email encryption (PGP/GPG)
- [ ] Create email templates and signatures
- [ ] Add calendar integration
- [ ] Implement email scheduling
- [ ] Create backup and restore functionality

### Phase 7: Polish & Distribution (PLANNED)
- [ ] Performance optimization
- [ ] Comprehensive testing (unit, integration, e2e)
- [ ] Security audit and hardening
- [ ] Auto-update mechanism
- [ ] Application packaging for all platforms
- [ ] Documentation and user guides
- [ ] Beta testing and feedback collection

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd void
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your OAuth2 credentials and AI API keys
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Build Commands

- **Development:** `npm run dev` - Start development server
- **Quick Restart:** `npm run dev:restart` - Quick restart for development
- **Build:** `npm run build` - Build for production
- **Build Electron:** `npm run build:electron` - Build Electron app
- **Package:** `npm run package` - Create distributable packages
- **Test:** `npm run test` - Run unit tests
- **Lint:** `npm run lint` - Run ESLint
- **Format:** `npm run format` - Format code with Prettier

## AI Features Setup

### OpenAI Configuration

1. **Get OpenAI API Key:**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Create an API key in your account settings

2. **Update Environment Variables:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4  # Optional: override default model
   ```

### Claude (Anthropic) Configuration

1. **Get Claude API Key:**
   - Sign up at [Anthropic Console](https://console.anthropic.com/)
   - Create an API key in your account settings

2. **Update Environment Variables:**
   ```env
   CLAUDE_API_KEY=your_claude_api_key_here
   CLAUDE_MODEL=claude-3-sonnet-20240229  # Optional: override default model
   ```

## OAuth2 Setup

### Gmail OAuth2 Configuration

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Gmail API

2. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Set application type to "External"
   - Add required scopes: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.send`

3. **Create OAuth2 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Create OAuth 2.0 Client ID (Desktop app type)
   - Download the client configuration

4. **Update Environment Variables:**
   ```env
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-client-secret
   ```

### Outlook/Microsoft 365 Setup

1. **Register Application in Azure:**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register a new application
   - Add redirect URI: `http://localhost:3000/auth/callback`

2. **Configure API Permissions:**
   - Add Microsoft Graph permissions for Mail.ReadWrite, Mail.Send

3. **Update Environment Variables:**
   ```env
   OUTLOOK_CLIENT_ID=your-azure-app-id
   OUTLOOK_CLIENT_SECRET=your-azure-app-secret
   ```

## Database Schema

### Core Tables

```sql
-- Email accounts
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL, -- 'gmail', 'outlook', 'imap'
    oauth_token TEXT,
    oauth_refresh_token TEXT,
    imap_host TEXT,
    imap_port INTEGER,
    smtp_host TEXT,
    smtp_port INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email folders
CREATE TABLE folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL, -- 'inbox', 'sent', 'drafts', 'trash', 'archive', 'custom'
    unread_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE(account_id, path)
);

-- Email messages
CREATE TABLE messages (
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
    is_read BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    is_forwarded BOOLEAN DEFAULT FALSE,
    size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (folder_id) REFERENCES folders(id),
    UNIQUE(account_id, uid)
);

-- Message attachments
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER,
    content_id TEXT,
    file_path TEXT,
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- Full-text search index
CREATE VIRTUAL TABLE messages_fts USING fts5(
    subject, sender, body, content='messages', content_rowid='id'
);
```

## Security Considerations

- **OAuth2 Token Storage**: Store tokens securely using Electron's safeStorage
- **Local Data Encryption**: Encrypt sensitive data in SQLite database
- **Network Security**: Use TLS/SSL for all email communications
- **Input Validation**: Validate all user inputs and email content
- **Auto-updates**: Implement secure auto-update mechanism
- **Sandboxing**: Use Electron's sandbox features where possible
- **AI API Security**: API keys stored securely and never exposed to renderer

## Performance Optimization

- **Virtual Scrolling**: Implement virtual scrolling for large email lists
- **Lazy Loading**: Load email content on demand
- **Background Sync**: Sync emails in background processes
- **Caching**: Implement intelligent caching for frequently accessed data
- **Database Indexing**: Optimize database queries with proper indexing
- **Memory Management**: Monitor and optimize memory usage
- **Event-driven Updates**: Efficient UI updates using IPC events

## Testing Strategy

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test email protocols and database operations
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Monitor application performance
- **Security Tests**: Validate security measures

## Distribution

### Build Targets

- **Windows**: `.exe` installer and portable version
- **macOS**: `.dmg` installer and `.app` bundle
- **Linux**: `.AppImage`, `.deb`, `.rpm` packages

### Auto-updates

- Implement auto-update mechanism using Electron Updater
- Support delta updates for smaller download sizes
- Provide update notifications and progress indicators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [Email Protocols (SMTP/IMAP)](https://tools.ietf.org/html/rfc5321)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)