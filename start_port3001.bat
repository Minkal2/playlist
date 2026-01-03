@echo off
setlocal

REM Minimal start script (ASCII only)

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed. Please install from https://nodejs.org/ (LTS).
  pause
  exit /b 1
)

IF NOT EXIST node_modules (
  echo Installing dependencies...
  call npm install
)

REM Open control page
start "" http://localhost:3001/control.html

REM Start server on port 3001
set PORT=3001
node server.js

endlocal
