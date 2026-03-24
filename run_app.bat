@echo off
setlocal

title Waste Monitoring System - Auto Run

echo --- Initializing Waste Monitoring System ---

:: 1. Database Setup
echo [1/3] Setting up Database...
mysql -u root -e "source configuration/db_setup.sql"
if %errorlevel% neq 0 (
    echo [!] Database setup failed. Ensure MySQL is running and in your PATH.
) else (
    echo [✔] Database setup successful.
)

:: 2. Start Server in new window
echo [2/3] Starting Server...
start "Waste Monitoring Server" node server/server.js

:: 3. Open Browser
echo [3/3] Launching App...
timeout /t 2 >nul
start http://localhost:5000

echo --- System Ready! ---
pause
