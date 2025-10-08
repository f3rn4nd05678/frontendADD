import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import SellBet from './pages/SellBet';
import Events from './pages/Events';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Winners from './pages/Winners';
import ClaimPrize from './pages/ClaimPrize';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sell" element={<SellBet />} />
          <Route path="events" element={<Events />} />
          <Route path="customers" element={<Customers />} />
          <Route path="claim" element={<ClaimPrize />} />
          <Route path="winners" element={<Winners />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;