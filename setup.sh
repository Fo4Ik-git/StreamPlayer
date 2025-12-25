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
echo "📦 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    # Используем путь напрямую к бинарнику venv для надежности
    ./$VENV_DIR/bin/python3 -m pip install --upgrade pip
    ./$VENV_DIR/bin/python3 -m pip install -r requirements.txt
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
    echo "⚠️  package.json not found, skipping npm install."
fi

echo ""
echo "✅ Setup complete!"
echo "--------------------------------------"

# КЛЮЧЕВАЯ ЧАСТЬ: Активация venv для текущей сессии
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Скрипт запущен как файл (./setup.sh)
    echo "ℹ️  Script finished in a subshell."
    echo "👉 To activate venv now, run: source $VENV_DIR/bin/activate"
else
    # Скрипт запущен через source или .
    source "$VENV_DIR/bin/activate"
    echo "⚡ Virtual environment ACTIVATED automatically!"
    echo "🚀 You can now run: npm run start"
fi