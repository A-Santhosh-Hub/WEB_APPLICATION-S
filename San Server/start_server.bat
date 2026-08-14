@echo off
title SanLAN Server
echo.
echo ========================================
echo          SanLAN Server Launcher
echo ========================================
echo.

REM Check for virtual environment
if exist ".venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call .venv\Scripts\activate.bat
) else (
    echo [WARN] No virtual environment found.
    echo [WARN] Run: python -m venv .venv
    echo [WARN] Then: .venv\Scripts\activate ^& pip install -r requirements.txt
    echo.
)

echo [INFO] Starting SanLAN server...
echo.
python -m server.main

echo.
echo [INFO] Server stopped.
pause
