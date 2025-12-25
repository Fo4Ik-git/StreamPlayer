@echo off
setlocal

echo 🚀 Starting project setup for Windows...

:: 1. Определение пути к venv
set VENV_DIR=.venv

:: 2. Создание виртуального окружения
echo 🐍 Setting up Python virtual environment...
if exist "%VENV_DIR%" (
    echo    Virtual environment already exists.
) else (
    python -m venv %VENV_DIR%
    echo    Virtual environment created.
)

:: 3. Установка Python зависимостей
echo 📦 Installing Python dependencies...
if exist "requirements.txt" (
    :: Используем путь напрямую к бинарнику venv для надежности
    %VENV_DIR%\Scripts\python.exe -m pip install --upgrade pip
    %VENV_DIR%\Scripts\python.exe -m pip install -r requirements.txt
    %VENV_DIR%\Scripts\python.exe -m pip install eel
) else (
    echo ❌ requirements.txt not found!
    exit /b 1
)

:: 4. Установка Node.js зависимостей
echo 📦 Installing Node.js dependencies...
if exist "package.json" (
    call npm install
) else (
    echo ⚠️  package.json not found, skipping npm install.
)

echo.
echo ✅ Setup complete!
echo --------------------------------------
echo ℹ️  To activate the virtual environment:
echo 👉 Run: %VENV_DIR%\Scripts\activate
echo.
echo 🚀 To start the application:
echo 👉 Run: npm run start
echo.

pause