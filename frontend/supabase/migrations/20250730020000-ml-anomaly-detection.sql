-- Create ML Anomaly Detection Tables
-- File: 20250730020000-ml-anomaly-detection.sql

-- Sensor data table
CREATE TABLE sensor_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    facility_type TEXT NOT NULL,
    device_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    sensor_value DECIMAL NOT NULL,
    criticality TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML predictions table
CREATE TABLE ml_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_data_id UUID REFERENCES sensor_data(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score DECIMAL DEFAULT 0,
    confidence DECIMAL DEFAULT 0,
    model_used TEXT DEFAULT 'supabase_autoencoder',
    reconstruction_error DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomaly alerts table
CREATE TABLE anomaly_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prediction_id UUID REFERENCES ml_predictions(id),
    facility_type TEXT NOT NULL,
    device_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    message TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_data;
ALTER PUBLICATION supabase_realtime ADD TABLE ml_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE anomaly_alerts;

-- Create indexes for performance
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX idx_sensor_data_facility ON sensor_data(facility_type);
CREATE INDEX idx_ml_predictions_timestamp ON ml_predictions(timestamp DESC);
CREATE INDEX idx_ml_predictions_anomaly ON ml_predictions(is_anomaly);
CREATE INDEX idx_anomaly_alerts_timestamp ON anomaly_alerts(created_at DESC);
CREATE INDEX idx_anomaly_alerts_acknowledged ON anomaly_alerts(acknowledged);
