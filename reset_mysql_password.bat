@echo off
REM Reset MySQL root password to empty

echo Stopping MySQL service...
net stop MySQL80

timeout /t 3

echo Starting MySQL without grant tables...
start "MySQL Safe Mode" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --bind-address=127.0.0.1

timeout /t 5

echo Connecting to MySQL and resetting password...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -h 127.0.0.1 ^
-e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY ''; FLUSH PRIVILEGES;"

timeout /t 2

echo Stopping MySQL safe mode...
taskkill /F /IM mysqld.exe

timeout /t 3

echo Restarting MySQL service...
net start MySQL80

timeout /t 3

echo Done! Root password is now empty.
pause
