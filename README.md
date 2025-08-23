# Void - Modern Email Client

A modern, cross-platform email client built with Electron, React, and TypeScript featuring advanced AI integration and seamless email management.

## Features

### Core Email Management
- **Cross-Platform**: Windows, macOS, Linux support
- **Multiple Accounts**: Gmail, Outlook, Yahoo, IMAP/SMTP
- **OAuth2 Authentication**: Secure login for major providers
- **Offline Access**: Local SQLite storage with sync
- **Infinite Scroll**: Smooth email loading with pagination
- **Auto-Sync**: Configurable 5-minute automatic refresh
- **Advanced Search**: Filter and sort emails efficiently

### Modern User Interface
- **Responsive Design**: Clean, modern interface
- **Theme Support**: Light, Dark, and System themes
- **Smooth Animations**: Polished transitions throughout
- **Collapsible Sidebar**: Organized folder navigation
- **Progress Indicators**: Real-time sync progress

### AI-Powered Features
- **Multi-Provider AI**: Support for 7 AI providers (5 free!)
- **Smart Assistant**: Contextual email analysis and help
- **Quick Actions**: Scam detection, summarization, tone analysis
- **Writing Help**: AI-powered composition assistance
- **Free Options**: Ollama, Hugging Face, Cohere, Groq, Together AI

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Electron, Node.js, SQLite
- **Email**: IMAP/SMTP with OAuth2
- **AI**: OpenAI, Claude, Ollama, Hugging Face, Cohere, Groq, Together AI
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

# AI Services (optional - configure via UI)
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
```

## Recent Improvements

### Email Management
- **Infinite Scroll**: Fixed email loading with proper pagination (15 emails per batch)
- **Auto-Sync**: Implemented functional 5-minute auto-refresh toggle
- **Database Optimization**: Fixed total count calculation for proper infinite scroll
- **UI Improvements**: Responsive email list container with optimal height

### AI Integration
- **Free AI Providers**: Added 5 free alternatives (Ollama, Hugging Face, Cohere, Groq, Together AI)
- **Multi-Provider Support**: Seamless switching between 7 different AI providers
- **Enhanced Settings**: Comprehensive AI configuration with connection testing
- **Error Handling**: Robust error handling with clear user feedback

### User Experience
- **Visual Polish**: Smooth animations, improved layout, better spacing
- **Theme Integration**: Consistent dark/light theme across all components
- **Performance**: Optimized rendering and reduced unnecessary re-renders

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
