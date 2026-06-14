import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userDataStr = localStorage.getItem('xenoreach_user');
    if (!userDataStr) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userDataStr);
      // If it has a data wrapper
      const userData = parsedUser.data || parsedUser;
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        name: userData.name || '',
        email: userData.email || ''
      }));
    } catch (err) {
      console.error('Error parsing user data:', err);
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    // Validate passwords if user wants to change password
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        setSaving(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        setSaving(false);
        return;
      }
    }

    try {
      // Simulate API saving call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update local storage
      const userDataStr = localStorage.getItem('xenoreach_user');
      if (userDataStr) {
        const parsedUser = JSON.parse(userDataStr);
        const coreUser = parsedUser.data || parsedUser;
        coreUser.name = formData.name;
        coreUser.email = formData.email;
        
        // Save back
        if (parsedUser.data) {
          parsedUser.data = coreUser;
          localStorage.setItem('xenoreach_user', JSON.stringify(parsedUser));
        } else {
          localStorage.setItem('xenoreach_user', JSON.stringify(coreUser));
        }
        
        setUser(coreUser);
      }

      setMessage('Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Trigger a navbar state sync (using storage event or custom event)
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h2>Profile Settings</h2>
          <p>Manage your account settings, credentials, and notification preferences.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Card Sidebar */}
        <div className="pr-left-col">
          <div className="card pr-profile-card">
            <div className="profile-avatar-large pr-avatar-container">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-BA9c_Y_12dzEdbLemDUURv9642axX0qcCr7FdekHjF1ih3MqyVWxDymP2c0MPKIB6bp8cgzNiFRlwxIc2YwuF8YWShkMK18g6AKn6ja_Jhwqbclfqdcc4KNSB0Otzl9B_GoocjEcfwRmSyEtDgWfYbKi6IngzadzQ6FoBjszBkNT8xpOD91rU3N5Grc2umiLd_CJgHfzx2B15HQVE1JkDStPgj9Een5nSF9K5GjDwbJe8bNEjXht45ojinv_JsAGYqQSS3LyXiXq" 
                alt={user.name} 
              />
            </div>
            <h3 className="font-headline-md pr-name">{user.name}</h3>
            <p className="font-body-md pr-email">{user.email}</p>
            <span className="badge badge-primary">Administrator</span>
          </div>

          {/* Channels Integration Status */}
          <div className="card">
            <h3 className="font-headline-md pr-channels-title">Marketing Channels</h3>
            
            <div className="pr-channels-list">
              {/* Email */}
              <div className="pr-channel-row">
                <div className="pr-channel-left">
                  <span className="material-symbols-outlined pr-channel-icon-email">mail</span>
                  <div>
                    <p className="font-body-md pr-channel-name">Email Marketing</p>
                    <p className="font-label-md pr-channel-subtext">Vite Mail Agent</p>
                  </div>
                </div>
                <span className="badge badge-success">Connected</span>
              </div>

              {/* SMS */}
              <div className="pr-channel-row">
                <div className="pr-channel-left">
                  <span className="material-symbols-outlined pr-channel-icon-sms">sms</span>
                  <div>
                    <p className="font-body-md pr-channel-name">SMS Gateways</p>
                    <p className="font-label-md pr-channel-subtext">Twilio Gateway</p>
                  </div>
                </div>
                <span className="badge badge-neutral">Inactive</span>
              </div>

              {/* WhatsApp */}
              <div className="pr-channel-row">
                <div className="pr-channel-left">
                  <span className="material-symbols-outlined pr-channel-icon-wa">chat</span>
                  <div>
                    <p className="font-body-md pr-channel-name">WhatsApp Business</p>
                    <p className="font-label-md pr-channel-subtext">Meta API</p>
                  </div>
                </div>
                <span className="badge badge-success">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Settings Card */}
        <div className="card">
          <h3 className="font-headline-md pr-edit-title">Edit Account Profile</h3>

          {message && (
            <div className="card pr-toast-success">
              <span className="material-symbols-outlined pr-toast-icon">check_circle</span>
              <span className="font-body-md pr-toast-text">{message}</span>
            </div>
          )}

          {error && (
            <div className="card pr-toast-error">
              <span className="material-symbols-outlined pr-toast-icon">error</span>
              <span className="font-body-md pr-toast-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="pr-form">
            <div className="pr-form-grid-2">
              <div className="form-group pr-form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group pr-form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <hr className="pr-form-divider" />

            <div>
              <h4 className="font-body-lg pr-form-section-title">Update Password</h4>
              <p className="font-label-md pr-form-section-subtitle">Leave blank if you don't want to change your password.</p>
              
              <div className="pr-password-list">
                <div className="form-group pr-form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pr-form-grid-2">
                  <div className="form-group pr-form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div className="form-group pr-form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pr-submit-row">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary pr-submit-btn"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined pr-spinner">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
