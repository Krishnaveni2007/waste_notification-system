# Reset MySQL root password to empty

$mysqlPath = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'

# Try to connect and reset password
# This attempts with common default passwords
$passwords = @("", "root", "password", "123456")

foreach ($pwd in $passwords) {
    Write-Host "Trying password: '$pwd'" -ForegroundColor Yellow
    
    if ($pwd -eq "") {
        $result = & "$mysqlPath\mysql.exe" -u root -h 127.0.0.1 -e "SELECT 1" 2>&1
    } else {
        $result = & "$mysqlPath\mysql.exe" -u root -p$pwd -h 127.0.0.1 -e "SELECT 1" 2>&1
    }
    
    if ($result -match "ERROR" -or $result -match "Access denied") {
        continue
    } else {
        Write-Host "SUCCESS! Password is: '$pwd'" -ForegroundColor Green
        break
    }
}

# If we found the password, set it to empty
Write-Host "`nAttempting to set root password to empty..." -ForegroundColor Cyan

# Using mysqladmin to change password
& "$mysqlPath\mysqladmin.exe" -u root --password="" -h 127.0.0.1 password ""

Write-Host "Done!" -ForegroundColor Green
