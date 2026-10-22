@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo        NAMASTE PRINT / TASKFLOW - WINDOWS STARTUP
echo ==========================================================

:: Resolve project directory
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: Check if in outer directory
if not exist "package.json" (
  if exist "taskflow\package.json" (
    cd /d "%PROJECT_ROOT%taskflow"
    set "PROJECT_ROOT=%CD%\"
  )
)

echo [INFO] Project directory: %CD%

:: 1. Check Node.js and npm
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] npm is not installed or not in PATH.
  echo Please install npm from https://nodejs.org/
  pause
  exit /b 1
)

echo [OK] Node.js and npm detected.

:: 2. Install backend dependencies
echo.
echo [INFO] Step 1/2: Installing backend dependencies (server)...
if exist "server\package.json" (
  cd /d "%CD%\server"
  call npm install
  cd /d "%PROJECT_ROOT%"
  echo [OK] Backend dependencies installed.
) else (
  echo [ERROR] server directory not found.
  pause
  exit /b 1
)

:: 3. Install frontend dependencies
echo.
echo [INFO] Step 2/2: Installing frontend dependencies...
call npm install
echo [OK] Frontend dependencies installed.

:: 4. Start backend and frontend
echo.
echo ==========================================================
echo    STARTING BACKEND (Port 5000) ^& FRONTEND (Port 3000)
echo ==========================================================
echo [INFO] Backend:  http://localhost:5000
echo [INFO] Frontend: http://localhost:3000
echo ==========================================================

start "TaskFlow Backend API (Port 5000)" cmd /k "cd /d %PROJECT_ROOT%server && npm run dev"
timeout /t 2 /nobreak >nul
start "TaskFlow Frontend (Port 3000)" cmd /k "cd /d %PROJECT_ROOT% && npm run dev"

echo [SUCCESS] Both servers launched in separate terminal windows!
