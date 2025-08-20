# Void - Modern Email Client

A modern, cross-platform email client built with Electron, React, and TypeScript. Void provides a secure, fast, and feature-rich email experience with support for multiple accounts, AI-powered features, and offline access.

## Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Account Support**: Gmail, Outlook, Yahoo, and any IMAP/SMTP provider
- **OAuth2 Authentication**: Secure authentication for major email providers
- **Offline Access**: Emails stored locally with SQLite database
- **Modern UI**: Beautiful, responsive interface with dark/light themes
- **AI Assistant**: Integrated AI-powered features with OpenAI and Claude support
  - Email summarization and analysis
  - Smart reply suggestions
  - Action item extraction
  - Tone analysis
  - General email assistance
- **Enhanced Email Rendering**: Rich HTML content with fallback to styled plain text
- **Collapsible Sidebar**: Smart sidebar with icon-only mode and smooth transitions
- **Custom Scrollbars**: Consistent, modern scrollbar styling throughout the app
- **Fast Search**: Full-text search with instant results
- **Security**: Local data storage, encrypted connections, privacy-focused

## Screenshots

The application features a modern three-pane layout:
- **Left sidebar**: Account and folder navigation (collapsible)
- **Middle pane**: Email list with preview
- **Right pane**: Email content viewer with AI assistant panel

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building user interfaces
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework with custom prose styling
- **SQLite**: Local database for email storage
- **Node.js**: Backend services and email protocols
- **OpenAI API**: AI-powered email assistance
- **Anthropic Claude API**: Alternative AI provider for email features

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
│   │   └── main.tsx         # React entry point
│   └── shared/              # Shared code between main and renderer
│       └── types/           # TypeScript type definitions
├── assets/                  # Static assets
├── dist/                    # Build output
└── package.json             # Dependencies and scripts
```

## AI Features

### AI Assistant Panel
- **Access**: Click the sparkles icon in the header to open the AI assistant
- **Features**:
  - Chat with AI about your emails
  - Email summarization and analysis
  - Smart reply suggestions
  - Action item extraction
  - Tone analysis
  - General email assistance

### AI Settings
- **Configuration**: Access AI settings through the assistant panel
- **Providers**: Support for both OpenAI and Claude APIs
- **Models**: Configurable model selection for each provider
- **Testing**: Built-in connection testing for API keys

### Quick Actions
- **Summarize Email**: Get a concise summary of selected email
- **Draft Reply**: Generate contextual reply suggestions
- **Extract Actions**: Identify action items and tasks
- **Analyze Tone**: Understand the emotional tone of emails

## UI Features

### Enhanced Email Rendering
- **HTML Support**: Rich HTML email content with proper styling
- **Plain Text Fallback**: Styled plain text with auto-link detection
- **Content Detection**: Smart detection of HTML vs plain text content
- **Typography**: Improved text rendering with proper spacing and formatting

### Collapsible Sidebar
- **Toggle**: Click the sidebar toggle button to collapse/expand
- **Icon Mode**: When collapsed, shows only folder icons with unread badges
- **Smooth Transitions**: Animated expand/collapse with CSS transitions
- **Tooltips**: Hover tooltips show folder names when collapsed

### Custom Scrollbars
- **Consistent Styling**: Modern, thin scrollbars throughout the application
- **Cross-platform**: Consistent appearance on all operating systems
- **Accessibility**: Maintains scrollbar functionality while improving aesthetics

## Development

### Adding New Features

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Implement feature:**
   - Add TypeScript types in `src/shared/types/`
   - Implement backend logic in `src/main/services/`
   - Create UI components in `src/renderer/components/`
   - Add IPC handlers in main process

3. **Test your changes:**
   ```bash
   npm run test
   npm run lint
   ```

4. **Submit pull request**

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new functionality
- Use `g_log` for logging (preferred over `log_info` or `g_info`)
- UI handler functions should start with `uj_` prefix

## Security

- **OAuth2 Token Storage**: Tokens stored securely using Electron's safeStorage
- **Local Data Encryption**: Sensitive data encrypted in SQLite database
- **Network Security**: TLS/SSL for all email communications
- **Input Validation**: All user inputs validated
- **Auto-updates**: Secure auto-update mechanism
- **AI API Security**: API keys stored securely and never exposed to renderer

## Performance

- **Virtual Scrolling**: For large email lists
- **Lazy Loading**: Email content loaded on demand
- **Background Sync**: Emails synced in background
- **Caching**: Intelligent caching for frequently accessed data
- **Database Indexing**: Optimized queries with proper indexing
- **Event-driven Updates**: Efficient UI updates using IPC events

## Recent Improvements

### Email Content Rendering
- ✅ Fixed HTML content extraction from Gmail API
- ✅ Improved plain text rendering with auto-link detection
- ✅ Added proper content type detection and fallback
- ✅ Enhanced typography and styling for email content

### AI Integration
- ✅ Added AI assistant side panel with chat interface
- ✅ Implemented email summarization and analysis
- ✅ Added smart reply suggestions and action extraction
- ✅ Created AI settings panel for API configuration
- ✅ Support for both OpenAI and Claude providers

### UI Enhancements
- ✅ Implemented collapsible sidebar with smooth animations
- ✅ Added custom scrollbar styling throughout the app
- ✅ Improved email detail view with better content rendering
- ✅ Enhanced folder navigation with unread count badges

### Data Management
- ✅ Fixed email read/unread status detection
- ✅ Improved folder count synchronization
- ✅ Enhanced refresh flow with progress indicators
- ✅ Better event-driven UI updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Join our community discussions

## Roadmap

- [ ] Email composition with rich text editor
- [ ] Attachment support and file management
- [ ] Advanced search with filters
- [ ] Email templates and signatures
- [ ] Calendar integration
- [ ] Contact management
- [ ] Email encryption (PGP/GPG)
- [ ] Mobile companion app
- [ ] Cloud sync for settings
- [ ] Plugin system for extensions
- [ ] Enhanced AI features with more providers
- [ ] Email scheduling and automation
