const { Handler } = require('@netlify/functions');

// Mock ML stats (replace with actual logic)
const getMockStats = () => ({
  success: true,
  data: {
    accuracy: 92.42,
    precision: 89.76,
    recall: 87.33,
    f1_score: 88.52,
    total_predictions: 15847,
    anomalies_detected: 1247,
    current_anomaly_rate: 7.87,
    model_status: 'active',
    last_updated: new Date().toISOString()
  }
});

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    try {
      const stats = getMockStats();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message 
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}; 