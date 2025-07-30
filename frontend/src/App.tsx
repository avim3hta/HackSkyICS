import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Admin from './pages/Admin';
import SupabaseAnomalyDetection from './components/SupabaseAnomalyDetection';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin" element={<Admin />} />
                    <Route path="/anomaly" element={<SupabaseAnomalyDetection />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App; 