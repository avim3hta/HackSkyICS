#!/usr/bin/env python3
"""
Simple API Server Launcher
Just runs the AI detection API server without frontend integration
"""

import os
import sys

def main():
    print("🚀 Starting AI Detection API Server")
    print("=" * 40)
    
    # Check if model files exist
    required_files = [
        'models/electrical_grid_autoencoder.pth',
        'models/feature_scaler.pkl',
        'models/label_encoders.pkl',
        'models/feature_columns.pkl',
        'models/reconstruction_threshold.pkl'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required model files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print("\n🔧 Please run training first:")
        print("   python reconstruction_autoencoder.py")
        return
    
    print("✅ All model files found")
    print("🔄 Loading AI detection server...")
    
    try:
        from api_server import RealTimeDetectionServer
        
        server = RealTimeDetectionServer()
        print("\n🌐 API Server URLs:")
        print("   📊 Statistics:    http://localhost:8000/stats")
        print("   🏥 Health Check:  http://localhost:8000/health")
        print("   🔍 Detection API: http://localhost:8000/detect")
        print("   🔌 WebSocket:     ws://localhost:8000/ws/ai-detection")
        print("\n🎭 Ready for frontend and VM attacks!")
        print("🛑 Press Ctrl+C to stop")
        print("-" * 40)
        
        server.run(host="0.0.0.0", port=8000)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main()