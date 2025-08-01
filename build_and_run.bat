@echo off
echo ========================================
echo Building AI Anomaly Detection System
echo ========================================

echo.
echo 1. Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo 2. Starting production server...
cd ..\ml_training
python production_server.py

pause