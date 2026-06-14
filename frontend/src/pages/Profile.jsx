import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    campaignsCount: 0,
    segmentsCount: 0,
    customersCount: 0
  });

  useEffect(() => {
    const userDataStr = localStorage.getItem('xenoreach_user');
    if (!userDataStr) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userDataStr);
      const userData = parsedUser.data || parsedUser;

      if (!userData || !userData.email) {
        localStorage.removeItem('xenoreach_user');
        navigate('/login');
        return;
      }

      setUser(userData);

      // Fetch platform activity stats dynamically from MongoDB APIs
      Promise.all([
        api.getCampaigns().catch(() => []),
        api.getCustomers().catch(() => ({ data: [], count: 0 }))
      ]).then(([campaignsRes, customersRes]) => {
        const campaignsData = Array.isArray(campaignsRes) ? campaignsRes : (campaignsRes.data || []);
        const customersData = Array.isArray(customersRes) ? customersRes : (customersRes.data || []);
        const customersCount = typeof customersRes.count === 'number' ? customersRes.count : customersData.length;

        // Calculate unique target segments from campaigns
        const uniqueSegments = new Set(campaignsData.map(c => c.targetSegment).filter(Boolean));

        setStats({
          campaignsCount: campaignsData.length,
          customersCount: customersCount,
          segmentsCount: uniqueSegments.size
        });
      }).catch(err => {
        console.error('Error fetching profile stats:', err);
      });

    } catch (err) {
      console.error('Error parsing user data:', err);
      localStorage.removeItem('xenoreach_user');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <span className="material-symbols-outlined pr-spinner" style={{ fontSize: '48px', color: 'var(--primary)' }}>progress_activity</span>
          <p className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>Initializing profile...</p>
        </div>
      </div>
    );
  }

  const userInitials = user && user.name ? user.name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h2>Profile Settings</h2>
          <p>Manage your account information and profile details.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Card Sidebar */}
        <div className="pr-left-col">
          <div className="card pr-profile-card">
            {user.picture ? (
              <div className="profile-avatar-large pr-avatar-container">
                <img src={user.picture} alt={user.name} />
              </div>
            ) : (
              <div className="profile-avatar-large pr-avatar-container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
                fontSize: '36px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {userInitials}
              </div>
            )}
            <h3 className="font-headline-md pr-name">{user.name}</h3>
            <p className="font-body-md pr-email">{user.email}</p>
            <span className={`badge ${user.role ? 'badge-primary' : 'badge-neutral'}`}>
              {user.role || 'User'}
            </span>
          </div>

          {/* Supported Communication Channels Card */}
          <div className="card">
            <h3 className="font-headline-md pr-channels-title">Supported Communication Channels</h3>

            <div className="pr-channels-list">
              {/* Email */}
              <div className="pr-channel-row">
                <div className="pr-channel-left">
                  <span className="material-symbols-outlined pr-channel-icon-email">mail</span>
                  <div>
                    <p className="font-body-md pr-channel-name">Email</p>
                    <p className="font-label-md pr-channel-subtext">Email Campaign Channel</p>
                  </div>
                </div>
              </div>

              {/* SMS */}
              <div className="pr-channel-row">
                <div className="pr-channel-left">
                  <span className="material-symbols-outlined pr-channel-icon-sms">sms</span>
                  <div>
                    <p className="font-body-md pr-channel-name">SMS</p>
                    <p className="font-label-md pr-channel-subtext">SMS Campaign Channel</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="pr-channel-row">
                <div className="pr-channel-left">
                  <span className="material-symbols-outlined pr-channel-icon-wa">chat</span>
                  <div>
                    <p className="font-body-md pr-channel-name">WhatsApp</p>
                    <p className="font-label-md pr-channel-subtext">WhatsApp Campaign Channel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Account Information Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="font-headline-md pr-edit-title" style={{ margin: 0 }}>Account Information</h3>

            <div className="pr-form">
              <div className="pr-form-grid-2">
                <div className="form-group pr-form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={user.name || ''}
                    className="form-input"
                    readOnly
                    style={{ backgroundColor: 'var(--surface-container-low)', cursor: 'default' }}
                  />
                </div>

                <div className="form-group pr-form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    className="form-input"
                    readOnly
                    style={{ backgroundColor: 'var(--surface-container-low)', cursor: 'default' }}
                  />
                </div>
              </div>

              <div className="pr-form-grid-2">
                <div className="form-group pr-form-group">
                  <label className="form-label">Account Status</label>
                  <input
                    type="text"
                    value="Active"
                    className="form-input"
                    readOnly
                    style={{ backgroundColor: 'var(--surface-container-low)', cursor: 'default', color: '#059669', fontWeight: 'bold' }}
                  />
                </div>

                <div className="form-group pr-form-group">
                  <label className="form-label">User Role</label>
                  <input
                    type="text"
                    value={user.role || 'User'}
                    className="form-input"
                    readOnly
                    style={{ backgroundColor: 'var(--surface-container-low)', cursor: 'default' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Activity Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="font-headline-md pr-edit-title" style={{ margin: 0 }}>Account Activity</h3>

            <div className="pr-form-grid-2">
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span className="font-label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Campaigns Created</span>
                <span className="font-headline-lg" style={{ color: 'var(--on-surface)', margin: 0 }}>{stats.campaignsCount}</span>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span className="font-label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Segments Created</span>
                <span className="font-headline-lg" style={{ color: 'var(--on-surface)', margin: 0 }}>{stats.segmentsCount}</span>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span className="font-label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Customers Managed</span>
                <span className="font-headline-lg" style={{ color: 'var(--on-surface)', margin: 0 }}>{stats.customersCount}</span>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span className="font-label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Login Session</span>
                <span className="font-body-lg" style={{ color: 'var(--on-surface)', fontWeight: 600, margin: 'auto 0' }}>{user.lastLogin || 'Current Session'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

