@echo off
echo ========================================
echo HackSkyICS Project Setup
echo ========================================
echo.

echo Setting up Python virtual environment...
python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r ml_training/requirements.txt
echo.

echo Setting up Frontend dependencies...
cd frontend
npm install
cd ..
echo.

echo Setting up Backend dependencies...
cd backend
npm install
cd ..
echo.

echo Creating necessary directories...
mkdir ml_training\data
mkdir backend\data
mkdir backend\logs
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy your environment variables to .env files
echo 2. Download model files to ml_training/models/
echo 3. Add your data files to ml_training/data/
echo 4. Run the application using build_and_run.bat
echo.
pause 