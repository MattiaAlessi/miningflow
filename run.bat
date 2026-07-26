@echo off
REM MiningFlow v1.0 — one-click local server launcher

set "PORT=8080"
cd /d "%~dp0"

echo Starting MiningFlow server on http://localhost:%PORT% ...

REM Try Python first, then Node, then fallback instructions
python --version >nul 2>&1
if %errorlevel% == 0 (
    start "" "http://localhost:%PORT%"
    python -m http.server %PORT%
    goto :end
)

node --version >nul 2>&1
if %errorlevel% == 0 (
    start "" "http://localhost:%PORT%"
    npx -y http-server -p %PORT%
    goto :end
)

echo ERROR: Python or Node.js is required to run the local server.
echo Install Python from https://www.python.org/downloads/ and try again.
pause

:end
