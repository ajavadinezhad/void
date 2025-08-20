#!/bin/bash

# Voida Development Script
# This script builds the project, kills any running processes, and starts the dev server

echo "🚀 Voida Development Script"
echo "=========================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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
    
    # Kill node processes (be more careful with this)
    pkill -f "node.*voida" 2>/dev/null || true
    
    echo "✅ Processes killed"
}

# Function to build the project
build_project() {
    echo "🔨 Building project..."
    
    if ! command_exists npm; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    # Clean and build
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build completed successfully"
    else
        echo "❌ Build failed"
        exit 1
    fi
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
    echo "🔍 Check the terminal for any errors"
}

# Main execution
main() {
    echo "Starting Voida development workflow..."
    echo ""
    
    # Kill existing processes
    kill_processes
    echo ""
    
    # Wait a moment for processes to fully terminate
    sleep 2
    
    # Build the project
    build_project
    echo ""
    
    # Start development server
    start_dev
    echo ""
    
    echo "🎉 Development environment ready!"
    echo "💡 Press Ctrl+C to stop the server"
    echo "🔄 Run this script again to rebuild and restart"
}

# Run the main function
main "$@"
