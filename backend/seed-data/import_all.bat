@echo off
echo ========================================
echo  Import du lieu vao MongoDB
echo  Database: dormitory_management
echo ========================================
echo.

set DB=dormitory_management
set DIR=%~dp0

echo [1/14] Importing users...
mongoimport --db %DB% --collection users --jsonArray --file "%DIR%01_users.json" --drop

echo [2/14] Importing buildings...
mongoimport --db %DB% --collection buildings --jsonArray --file "%DIR%02_buildings.json" --drop

echo [3/14] Importing rooms...
mongoimport --db %DB% --collection rooms --jsonArray --file "%DIR%03_rooms.json" --drop

echo [4/14] Importing students...
mongoimport --db %DB% --collection students --jsonArray --file "%DIR%04_students.json" --drop

echo [5/14] Importing roomassignments...
mongoimport --db %DB% --collection roomassignments --jsonArray --file "%DIR%05_roomassignments.json" --drop

echo [6/14] Importing roomregistrations...
mongoimport --db %DB% --collection roomregistrations --jsonArray --file "%DIR%06_roomregistrations.json" --drop

echo [7/14] Importing requests...
mongoimport --db %DB% --collection requests --jsonArray --file "%DIR%07_requests.json" --drop

echo [8/14] Importing reports...
mongoimport --db %DB% --collection reports --jsonArray --file "%DIR%08_reports.json" --drop

echo [9/14] Importing invoices...
mongoimport --db %DB% --collection invoices --jsonArray --file "%DIR%09_invoices.json" --drop

echo [10/14] Importing payments...
mongoimport --db %DB% --collection payments --jsonArray --file "%DIR%10_payments.json" --drop

echo [11/14] Importing notifications...
mongoimport --db %DB% --collection notifications --jsonArray --file "%DIR%11_notifications.json" --drop

echo [12/14] Importing settings...
mongoimport --db %DB% --collection settings --jsonArray --file "%DIR%12_settings.json" --drop

echo [13/14] Importing violationrecords...
mongoimport --db %DB% --collection violationrecords --jsonArray --file "%DIR%13_violationrecords.json" --drop

echo [14/14] Importing electricityusages...
mongoimport --db %DB% --collection electricityusages --jsonArray --file "%DIR%14_electricityusages.json" --drop

echo.
echo ========================================
echo  Hoan tat! Kiem tra MongoDB Compass
echo  de xac nhan du lieu da duoc import.
echo ========================================
pause
