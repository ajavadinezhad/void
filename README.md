# Voida - Modern Email Client

A modern, cross-platform email client built with Electron, React, and TypeScript. Voida provides a secure, fast, and feature-rich email experience with support for multiple accounts, AI-powered features, and offline access.

## Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Account Support**: Gmail, Outlook, Yahoo, and any IMAP/SMTP provider
- **OAuth2 Authentication**: Secure authentication for major email providers
- **Offline Access**: Emails stored locally with SQLite database
- **Modern UI**: Beautiful, responsive interface with dark/light themes
- **AI Features**: Writing assistance, smart search, and email summarization
- **Fast Search**: Full-text search with instant results
- **Security**: Local data storage, encrypted connections, privacy-focused

## Screenshots

The application features a modern three-pane layout:
- **Left sidebar**: Account and folder navigation
- **Middle pane**: Email list with preview
- **Right pane**: Email content viewer

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building user interfaces
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **SQLite**: Local database for email storage
- **Node.js**: Backend services and email protocols

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd voida
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your OAuth2 credentials
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Build Commands

- **Development:** `npm run dev` - Start development server
- **Build:** `npm run build` - Build for production
- **Package:** `npm run package` - Create distributable packages
- **Test:** `npm run test` - Run unit tests
- **Lint:** `npm run lint` - Run ESLint
- **Format:** `npm run format` - Format code with Prettier

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
voida/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts         # Main process entry point
│   │   ├── preload.ts       # Preload script for IPC
│   │   └── services/        # Email, auth, database services
│   ├── renderer/            # Electron renderer process (React app)
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── main.tsx         # React entry point
│   └── shared/              # Shared code between main and renderer
│       └── types/           # TypeScript type definitions
├── assets/                  # Static assets
├── dist/                    # Build output
└── package.json             # Dependencies and scripts
```

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

## Security

- **OAuth2 Token Storage**: Tokens stored securely using Electron's safeStorage
- **Local Data Encryption**: Sensitive data encrypted in SQLite database
- **Network Security**: TLS/SSL for all email communications
- **Input Validation**: All user inputs validated
- **Auto-updates**: Secure auto-update mechanism

## Performance

- **Virtual Scrolling**: For large email lists
- **Lazy Loading**: Email content loaded on demand
- **Background Sync**: Emails synced in background
- **Caching**: Intelligent caching for frequently accessed data
- **Database Indexing**: Optimized queries with proper indexing

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
