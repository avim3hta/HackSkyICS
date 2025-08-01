import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Admin from './pages/Admin';
import SupabaseAnomalyDetection from './components/SupabaseAnomalyDetection';
import ElectricalGridDashboard from './pages/ElectricalGridDashboard';
import AIDetectionDashboard from './pages/AIDetectionDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/electrical-grid" element={<ElectricalGridDashboard />} />
        <Route path="/ai-detection" element={<AIDetectionDashboard />} />
        <Route path="/anomaly" element={<SupabaseAnomalyDetection />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App; 