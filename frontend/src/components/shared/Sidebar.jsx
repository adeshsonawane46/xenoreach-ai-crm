import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

const Sidebar = ({ isMobileOpen, toggleMobileSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('xenoreach_user');
    navigate('/login');
  };

  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={isMobileOpen ? toggleMobileSidebar : undefined}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(to bottom right, var(--primary), var(--secondary))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            X
          </div>
          <div>
            <h1>XenoReach AI</h1>
            <p>Marketing CRM</p>
          </div>
        </Link>
        <button 
          className="btn-icon sidebar-close-btn" 
          onClick={toggleMobileSidebar}
          aria-label="Close menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
        </button>
      </div>

      <div className="sidebar-actions">
        <Link to="/campaign-wizard" className="btn btn-ai w-full text-center" style={{ width: '100%' }}>
          <span className="material-symbols-outlined">add</span>
          New Campaign
        </Link>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleMobileSidebar}>
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </NavLink>
        <NavLink to="/data-center" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleMobileSidebar}>
          <span className="material-symbols-outlined">database</span>
          Data Center
        </NavLink>
        <NavLink to="/segment-builder" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleMobileSidebar}>
          <span className="material-symbols-outlined">group_add</span>
          Segment Builder
        </NavLink>
        <NavLink to="/campaign-wizard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleMobileSidebar}>
          <span className="material-symbols-outlined">auto_awesome</span>
          AI Campaign Wizard
        </NavLink>
        <NavLink to="/campaigns" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleMobileSidebar}>
          <span className="material-symbols-outlined">campaign</span>
          Campaigns
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleMobileSidebar}>
          <span className="material-symbols-outlined">leaderboard</span>
          Analytics
        </NavLink>
        <NavLink to="/insights" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleMobileSidebar}>
          <span className="material-symbols-outlined">psychology</span>
          AI Insights
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={handleLogout}
          className="sidebar-link" 
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
