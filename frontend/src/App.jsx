import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/shared/Sidebar';
import Navbar from './components/shared/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataCenter from './pages/DataCenter';
import SegmentBuilder from './pages/SegmentBuilder';
import AICampaignWizard from './pages/AICampaignWizard';
import Campaigns from './pages/Campaigns';
import CampaignReview from './pages/CampaignReview';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import Profile from './pages/Profile';

import './App.css';

// Guard wrapper for private dashboard routes
const PrivateLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const user = localStorage.getItem('xenoreach_user');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/data-center') return 'Data Center';
    if (path === '/segment-builder') return 'Segment Builder';
    if (path === '/campaign-wizard') return 'AI Campaign Wizard';
    if (path === '/campaigns') return 'Campaigns';
    if (path.startsWith('/campaign-review')) return 'Campaign Review';
    if (path === '/analytics') return 'Performance Analytics';
    if (path === '/insights') return 'AI Insights';
    if (path === '/profile') return '';
    return '';
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="app-wrapper">
      <Sidebar isMobileOpen={mobileSidebarOpen} toggleMobileSidebar={toggleMobileSidebar} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', minWidth: 0, width: '100%', maxWidth: '100%' }}>
        <Navbar toggleMobileSidebar={toggleMobileSidebar} title={getPageTitle()} />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />

        {/* Private Dashboard layouts */}
        <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/data-center" element={<PrivateLayout><DataCenter /></PrivateLayout>} />
        <Route path="/segment-builder" element={<PrivateLayout><SegmentBuilder /></PrivateLayout>} />
        <Route path="/campaign-wizard" element={<PrivateLayout><AICampaignWizard /></PrivateLayout>} />
        <Route path="/campaigns" element={<PrivateLayout><Campaigns /></PrivateLayout>} />
        <Route path="/campaign-review/:id" element={<PrivateLayout><CampaignReview /></PrivateLayout>} />
        <Route path="/analytics" element={<PrivateLayout><Analytics /></PrivateLayout>} />
        <Route path="/insights" element={<PrivateLayout><AIInsights /></PrivateLayout>} />
        <Route path="/profile" element={<PrivateLayout><Profile /></PrivateLayout>} />

        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
