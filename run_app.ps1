# Waste Monitoring System - Auto Run Script

Write-Host "--- Initializing Waste Monitoring System ---" -ForegroundColor Cyan

# 1. Try to setup the database
Write-Host "[1/3] Setting up Database..." -ForegroundColor Yellow
try {
    # Attempting to run the SQL script with root user (no password)
    # This assumes MySQL is running. If not, the script will continue but backend might show errors.
    mysql -u root -e "source configuration/db_setup.sql"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✔ Database setup successful." -ForegroundColor Green
    } else {
        Write-Warning "Database setup failed. Ensure MySQL is running and 'mysql' command is in your PATH."
    }
} catch {
    Write-Warning "Could not run mysql command. Please setup database manually."
}

# 2. Start the Backend Server
Write-Host "[2/3] Starting Server..." -ForegroundColor Yellow
# Starting node in a new window so the user can see logs
Start-Process node -ArgumentList "server/server.js" -WorkingDirectory $PSScriptRoot

# 3. Open Browser
Write-Host "[3/3] Launching App..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5000"

Write-Host "--- System Ready! ---" -ForegroundColor Green
Write-Host "The server is running in a separate window. You can close this shell."
