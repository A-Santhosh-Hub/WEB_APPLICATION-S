@echo off
title SanPay Local Test Servers
echo ===================================================
echo   Starting SanPay Portals (User ^& Admin)
echo ===================================================
echo.

echo Starting User Portal (Port 8001)...
start "User Portal Server" cmd /c "cd User-Portal && echo Starting Python Server... && python -m http.server 8001 || echo Falling back to Node... && npx serve -l 8001"

echo Starting Admin Portal (Port 8002)...
start "Admin Portal Server" cmd /c "cd Admin-Portal && echo Starting Python Server... && python -m http.server 8002 || echo Falling back to Node... && npx serve -l 8002"

echo.
echo Both servers are spinning up in the background!
echo.
echo - User Portal:  http://localhost:8001
echo - Admin Portal: http://localhost:8002
echo.
echo Press any key to open both portals in your browser now...
pause >nul

start http://localhost:8001
start http://localhost:8002
