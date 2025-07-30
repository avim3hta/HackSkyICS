@echo off
echo ========================================
echo  HackSkyICS - Supabase ML Detection
echo ========================================
echo.

echo Starting Supabase-Powered Frontend...
cd frontend  
start "Supabase Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo  System Started Successfully!
echo ========================================
echo.
echo Frontend Dashboard: http://localhost:8080
echo Anomaly Detection: http://localhost:8080/anomaly
echo Admin Panel: http://localhost:8080/admin
echo.
echo No backend needed - powered by Supabase!
echo.
echo Press any key to exit...
pause >nul 