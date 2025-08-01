#!/bin/bash
# Complete reconstruction-based anomaly detection pipeline

echo "🛡️ Reconstruction-Based Anomaly Detection Pipeline"
echo "================================================="
echo "🎯 Approach: Train autoencoder ONLY on normal data"
echo "🚨 Detection: Any deviation = high reconstruction error = anomaly"
echo "💡 Advantage: Detects zero-day attacks never seen before"
echo ""

# Create directories
mkdir -p data
mkdir -p models

echo "📊 Step 1: Generate 900k normal electrical grid samples..."
python normal_grid_fabricator.py

echo ""
echo "🧠 Step 2: Train reconstruction autoencoder on normal data only..."
python reconstruction_autoencoder.py

echo ""
echo "⚔️ Step 3: Generate attack samples for testing..."
python attack_generator.py

echo ""
echo "✅ Reconstruction-based training completed!"
echo "🎭 Ready for hackathon demo with zero-day detection!"
echo ""
echo "🎯 How to use for demo:"
echo "   1. Normal data → Low reconstruction error"
echo "   2. Attack data → High reconstruction error = ANOMALY DETECTED"
echo "   3. Works on attacks never seen during training!" 