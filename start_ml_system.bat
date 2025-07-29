@echo off
echo ========================================
echo  HackSkyICS - ML Anomaly Detection
echo ========================================
echo.

echo Starting Backend ML System...
cd backend
start "Backend ML System" cmd /k "npm start"
cd ..

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend Dashboard...
cd frontend  
start "Frontend Dashboard" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo  System Started Successfully!
echo ========================================
echo.
echo Backend ML API: http://localhost:5000
echo Frontend Dashboard: http://localhost:3000
echo Anomaly Detection: http://localhost:3000/anomaly
echo Admin Panel: http://localhost:3000/admin
echo.
echo Press any key to exit...
pause >nul 