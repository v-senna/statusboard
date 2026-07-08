import { Routes, Route } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import UnitDetail from './pages/UnitDetail';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">S</div>
          <h1>StatusBoard</h1>
        </div>
        <div className="header-right">
          <div className="badge-live">
            <span className="pulse-dot"></span>
            Ao vivo
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/unit/:id" element={<UnitDetail />} />
      </Routes>
    </div>
  );
}

export default App;
