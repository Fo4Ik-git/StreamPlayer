@echo off
setlocal

echo 🚀 Starting project setup for Windows...

:: 1. Setup Python Virtual Environment
echo 🐍 Setting up Python virtual environment...
if exist ".venv" (
    echo    Virtual environment already exists.
) else (
    python -m venv .venv
    echo    Virtual environment created.
)

:: Activate virtual environment
@REM call .venv\Scripts\activate.bat

:: 2. Install Python Dependencies
echo 📦 Installing Python dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt
) else (
    echo ❌ requirements.txt not found!
    exit /b 1
)

:: 3. Install Node.js Dependencies
echo 📦 Installing Node.js dependencies...
if exist "package.json" (
    call npm install
) else (
    echo ❌ package.json not found! Are you in the 'web' directory?
    exit /b 1
)

echo ✅ Setup complete!
echo.
echo To start the application:
echo 1. Activate venv: .venv\Scripts\activate
echo 2. Run: pip install eel
echo 3. Run: npm run start
echo.
pause