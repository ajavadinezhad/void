#!/bin/bash

# Void Quick Restart Script
# This script kills running processes and restarts the dev server without rebuilding

echo "⚡ Void Quick Restart"
echo "====================="

# Function to kill processes
kill_processes() {
    echo "🔄 Killing existing processes..."
    
    # Kill npm processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "npm run dev:vite" 2>/dev/null || true
    pkill -f "npm run dev:electron" 2>/dev/null || true
    
    # Kill electron processes
    pkill -f "electron" 2>/dev/null || true
    
    # Kill vite processes
    pkill -f "vite" 2>/dev/null || true
    
    echo "✅ Processes killed"
}

# Function to start development server
start_dev() {
    echo "🚀 Starting development server..."
    
    # Start the dev server in the background
    npm run dev &
    
    # Wait a moment for the server to start
    sleep 3
    
    echo "✅ Development server started"
    echo "📱 App should be opening shortly..."
}

# Main execution
main() {
    echo "Quick restarting Void..."
    echo ""
    
    # Kill existing processes
    kill_processes
    echo ""
    
    # Wait a moment for processes to fully terminate
    sleep 2
    
    # Start development server
    start_dev
    echo ""
    
    echo "🎉 Quick restart completed!"
    echo "💡 Press Ctrl+C to stop the server"
    echo "🔄 Run ./scripts/dev.sh for full rebuild"
}

# Run the main function
main "$@"
