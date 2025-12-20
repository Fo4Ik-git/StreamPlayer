#!/bin/bash

# Останавливать скрипт при ошибках
set -e

echo "🚀 Starting project setup..."

# 1. Определение пути к venv
VENV_DIR=".venv"

# 2. Создание виртуального окружения
echo "🐍 Setting up Python virtual environment..."
if [ -d "$VENV_DIR" ]; then
    echo "   Virtual environment already exists."
else
    python3 -m venv "$VENV_DIR"
    echo "   Virtual environment created."
fi

# 3. Установка Python зависимостей
# ВАЖНО: используем прямой путь к python внутри venv, чтобы избежать PEP 668
echo "📦 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    ./$VENV_DIR/bin/python3 -m pip install --upgrade pip
    ./$VENV_DIR/bin/python3 -m pip install -r requirements.txt
    # Дополнительно ставим eel, если его нет в requirements
    ./$VENV_DIR/bin/python3 -m pip install eel
else
    echo "❌ requirements.txt not found!"
    exit 1
fi

# 4. Установка Node.js зависимостей
echo "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
else
    echo "❌ package.json not found!"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo "--------------------------------------"
echo "To start the application:"
echo "1. Create venv: python3 -m venv .venv"
echo "2. Activate venv: source $VENV_DIR/bin/activate"
echo "3. Install eel: pip3 install eel"
echo "4. Run: npm run start"