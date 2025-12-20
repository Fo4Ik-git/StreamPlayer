#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting project setup..."

# 1. Setup Python Virtual Environment
echo "🐍 Setting up Python virtual environment..."
if [ -d ".venv" ]; then
    echo "   Virtual environment already exists."
else
    python3 -m venv .venv
    echo "   Virtual environment created."
fi

# Activate virtual environment
# source .venv/bin/activate

# 2. Install Python Dependencies
echo "📦 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    # Use python3 -m pip to avoid issues with pip/pip3 naming
    python3 -m pip install -r requirements.txt
else
    echo "❌ requirements.txt not found!"
    exit 1
fi

# 3. Install Node.js Dependencies
echo "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
else
    echo "❌ package.json not found! Are you in the 'web' directory?"
    exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Activate venv: source .venv/bin/activate"
echo "2. Run: pip install eel"
echo "3. Run: npm run start