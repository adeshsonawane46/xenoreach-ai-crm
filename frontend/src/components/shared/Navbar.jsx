import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ toggleMobileSidebar, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState({ name: '', email: '' });

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Campaign 'Summer Promo 2026' draft was updated.", time: "10 mins ago", unread: true },
    { id: 2, text: "Imported 1,200 customer profiles successfully.", time: "1 hour ago", unread: true },
    { id: 3, text: "AI send-time optimization suggestion is ready.", time: "2 hours ago", unread: false },
    { id: 4, text: "XenoReach system connected to WhatsApp channel.", time: "1 day ago", unread: false }
  ]);

  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);

  const loadUserData = () => {
    const userDataStr = localStorage.getItem('xenoreach_user');
    if (userDataStr) {
      try {
        const parsedUser = JSON.parse(userDataStr);
        setUser(parsedUser.data || parsedUser);
      } catch (err) {
        console.error('Error parsing user data in Navbar:', err);
      }
    }
  };

  useEffect(() => {
    loadUserData();

    // Listen for storage events (e.g. profile page changes username/email)
    window.addEventListener('storage', loadUserData);
    return () => window.removeEventListener('storage', loadUserData);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    localStorage.removeItem('xenoreach_user');
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="btn-icon md-hide"
          onClick={toggleMobileSidebar}
          style={{ display: 'none' /* Will be toggled in CSS for mobile */ }}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {isProfilePage ? null : title ? (
          <h2 className="font-headline-md text-on-surface" style={{ margin: 0 }}>{title}</h2>
        ) : (
          <div className="search-container">
            <span className="material-symbols-outlined search-icon">search</span>
            <input type="text" placeholder="Search customer records, campaigns, insights..." />
          </div>
        )}
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notifications Icon and Dropdown */}
        <div ref={notificationsRef} style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="notification-badge" style={{
                width: '16px',
                height: '16px',
                fontSize: '9px',
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                top: '2px',
                right: '2px',
                padding: 0
              }}>{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="dropdown-menu" style={{ right: 0, width: '300px' }}>
              <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-body-md" style={{ fontWeight: '600', color: 'var(--on-surface)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--outline)', marginBottom: '8px' }}>notifications_off</span>
                    <p className="font-body-md">All caught up!</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.unread ? 'unread' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <p className="font-body-md" style={{ color: 'var(--on-surface)', margin: 0, fontSize: '12.5px', lineHeight: '18px' }}>{n.text}</p>
                      <span className="notification-time">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                <button
                  onClick={clearAllNotifications}
                  style={{ background: 'none', border: 'none', color: 'var(--outline)', fontSize: '11px', cursor: 'pointer', width: '100%' }}
                >
                  Clear all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar and Dropdown */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          <div
            className="avatar-container"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            style={!user.picture ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '13px',
              cursor: 'pointer'
            } : { cursor: 'pointer' }}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || "User profile"}
              />
            ) : (
              user.name ? user.name.charAt(0) : '?'
            )}
          </div>

          {showProfileMenu && (
            <div className="dropdown-menu" style={{ right: 0, minWidth: '220px' }}>
              <div className="dropdown-header">
                <p className="font-body-md" style={{ fontWeight: '600', color: 'var(--on-surface)', margin: 0 }}>{user.name || 'Admin User'}</p>
                <p className="font-label-md" style={{ color: 'var(--outline)', margin: '2px 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email || 'admin@xenoreach.com'}</p>
              </div>

              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => setShowProfileMenu(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>manage_accounts</span>
                View Profile
              </Link>

              <button
                onClick={handleLogout}
                className="dropdown-item"
                style={{ borderTop: '1px solid var(--outline-variant)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--error)' }}>logout</span>
                <span style={{ color: 'var(--error)' }}>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
