@echo off
REM Quick setup script for Aid Landing Page

echo 🚀 Setting up Aid Landing Page...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Available commands:
echo   npm run dev      - Start development server
echo   npm run build    - Build for production
echo   npm run preview  - Preview production build
echo   npm run lint     - Run ESLint
echo.
echo 🌐 To start developing, run: npm run dev
pause
