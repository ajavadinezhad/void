# Void - Modern Email Client

A modern, cross-platform email client built with Electron, React, and TypeScript.

## Features

- **Cross-Platform**: Windows, macOS, Linux
- **Multiple Accounts**: Gmail, Outlook, Yahoo, IMAP/SMTP
- **OAuth2 Authentication**: Secure login for major providers
- **Offline Access**: Local SQLite storage
- **Modern UI**: Responsive interface with dark/light themes
- **Smooth Animations**: Polished transitions throughout
- **AI Assistant**: OpenAI/Claude integration
- **Auto-updates**: Seamless application updates

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Electron, Node.js, SQLite
- **Email**: IMAP/SMTP with OAuth2
- **AI**: OpenAI API, Claude API
- **Build**: Vite, electron-builder

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Package application
npm run package
```

## Environment Setup

Copy `env.example` to `.env` and add your API keys:

```bash
# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Services (optional)
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
```

## Recent Improvements

- **UI/UX**: Smooth animations, layout fixes, responsive design
- **Performance**: Code cleanup, optimized rendering, reduced logging
- **Data Management**: Fixed sidebar folder display, improved refresh logic

## Development

```bash
npm run dev          # Start development
npm run build        # Build application
npm run package      # Package for distribution
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

## License

MIT License
