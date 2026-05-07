@echo off
echo ========================================
echo Cloud SQL Setup Script
echo ========================================
echo.

echo Step 1: Getting your current IP address...
curl -s https://api.ipify.org > temp_ip.txt
set /p MY_IP=<temp_ip.txt
del temp_ip.txt
echo Your IP: %MY_IP%
echo.

echo Step 2: Adding your IP to Cloud SQL authorized networks...
echo.
echo Run this command in Google Cloud Shell or with gcloud CLI:
echo.
echo gcloud sql instances patch my-demo-db --authorized-networks=%MY_IP% --project=burnished-treat-482906-f4
echo.
echo Or to allow all IPs (less secure, for testing):
echo gcloud sql instances patch my-demo-db --authorized-networks=0.0.0.0/0 --project=burnished-treat-482906-f4
echo.

echo Step 3: After adding your IP, test the connection:
echo.
echo psql -h 34.93.143.147 -U postgres -d postgres
echo Password: OfficialGradeBench-2025
echo.

echo Step 4: Initialize the database:
echo.
echo psql -h 34.93.143.147 -U postgres -d postgres -f init-db.sql
echo.

echo ========================================
echo Manual Steps Required:
echo ========================================
echo 1. Go to: https://console.cloud.google.com/sql/instances/my-demo-db/edit?project=burnished-treat-482906-f4
echo 2. Scroll to "Connections" section
echo 3. Click "ADD NETWORK" under "Authorized networks"
echo 4. Add: %MY_IP% (or 0.0.0.0/0 for all IPs)
echo 5. Click "SAVE"
echo.

pause
