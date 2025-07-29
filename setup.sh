#!/bin/bash

# HackSkyICS Setup Script
echo "🚀 Setting up HackSkyICS - Industrial Control System Cybersecurity Platform"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "✅ Environment file created (edit .env if needed)"
else
    echo "✅ Environment file already exists"
fi
cd ..

echo ""
echo "🎉 Setup Complete!"
echo "=================================================================="
echo ""
echo "🚀 To start the application:"
echo ""
echo "1. Start the Backend:"
echo "   cd backend"
echo "   npm run dev"
echo "   # API will be available at http://localhost:3001"
echo ""
echo "2. Start the Frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo "   # Dashboard will be available at http://localhost:3000"
echo ""
echo "3. For full system setup with VMs:"
echo "   Follow the 48-hour implementation plan in complete_48h_plan.md"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview and quick start"
echo "   - complete_48h_plan.md - Full implementation guide"
echo "   - IMPLEMENTATION_GUIDE.md - Detailed setup instructions"
echo ""
echo "🤖 AI Integration:"
echo "   The backend is ready for AI integration once you train your LLM"
echo "   with Modbus simulator data."
echo ""
echo "Happy hacking! 🎯" 