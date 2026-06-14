import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/Campaigns.css';

const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.getCampaigns();
      setCampaigns(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleLaunch = async (e, id) => {
    e.stopPropagation(); // Avoid triggering card navigation
    try {
      setLoading(true);
      await api.launchCampaign(id);
      alert('Campaign launched successfully!');
      fetchCampaigns();
    } catch (error) {
      alert('Failed to launch campaign: ' + error.message);
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete all campaigns? This will also clear all associated communication logs. This action cannot be undone.")) {
      try {
        setLoading(true);
        await api.deleteAllCampaigns();
        alert('All campaigns deleted successfully.');
        fetchCampaigns();
      } catch (error) {
        alert('Failed to delete campaigns: ' + error.message);
        setLoading(false);
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();

    if (!window.confirm('Delete this campaign?')) return;

    try {
      await api.deleteCampaign(id);
      alert('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = async (e, camp) => {
    e.stopPropagation();

    const newName = prompt('Edit Campaign Name', camp.name);

    if (!newName || newName.trim() === '') return;

    try {
      await api.updateCampaign(camp._id, {
        name: newName
      });

      alert('Campaign updated successfully');
      fetchCampaigns();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Campaigns</h2>
          <p>Deploy and track outcomes of your marketing campaigns.</p>
        </div>
        <div className="page-header-actions">
          {campaigns.length > 0 && (
            <button onClick={handleDeleteAll} className="btn btn-secondary cp-btn-delete-all">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              Delete All
            </button>
          )}
          <Link to="/campaign-wizard" className="btn btn-ai">
            <span className="material-symbols-outlined">add</span>
            Create Campaign
          </Link>
        </div>
      </div>

      {loading && campaigns.length === 0 ? (
        <div className="cp-loading-container">
          <span className="material-symbols-outlined cp-loading-icon">sync</span>
          <p className="cp-loading-text">Querying campaign records...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card cp-empty-card">
          <span className="material-symbols-outlined cp-empty-icon">campaign</span>
          <h3 className="font-headline-md cp-empty-title">No campaigns drafted yet</h3>
          <p className="cp-empty-desc">Launch the AI Campaign Wizard to generate high-converting drafts.</p>
          <Link to="/campaign-wizard" className="btn btn-primary">Open AI Wizard</Link>
        </div>
      ) : (
        <div className="cp-list">
          {campaigns.map((camp) => (
            <div 
              key={camp._id}
              className={`card card-hover cp-row-card ${camp.status === 'Active' ? 'active' : 'inactive'}`} 
              onClick={() => {
                setSelectedCampaign(camp);
                setActiveModal('view-campaign');
              }}
            >
              <div className="cp-row-left">
                <div className={`cp-icon-wrapper ${camp.status === 'Active' ? 'active' : 'inactive'}`}>
                  <span className="material-symbols-outlined">
                    {camp.channel === 'Email' ? 'mail' : camp.channel === 'WhatsApp' ? 'chat' : 'sms'}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline-md cp-row-title">{camp.name}</h3>
                  <div className="cp-row-meta">
                    <span>Target: <strong>{camp.targetSegment}</strong></span>
                    <span>•</span>
                    <span>Channel: <strong>{camp.channel}</strong></span>
                    <span>•</span>
                    <span>Created: <strong>{new Date(camp.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              </div>

              <div className="cp-row-right">
                {/* Metrics */}
                {camp.status !== 'Draft' && (
                  <div className="cp-metrics-container hide-tablet">
                    <div>
                      <div className="cp-metric-label">Engagement</div>
                      <div className="cp-metric-val-primary">{camp.engagement}%</div>
                    </div>
                    <div>
                      <div className="cp-metric-label">Conversion</div>
                      <div className="cp-metric-val-secondary">{camp.conversion}%</div>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <span className={`badge ${
                  camp.status === 'Active' ? 'badge-primary' : 
                  camp.status === 'Completed' ? 'badge-success' : 'badge-neutral'
                } cp-row-badge`}>
                  {camp.status}
                </span>

                {/* Quick actions */}
                <div className="cp-row-actions">
                  <button
                    onClick={(e) => handleEdit(e, camp)}
                    className="btn btn-secondary cp-btn-edit"
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, camp._id)}
                    className="btn btn-secondary cp-btn-delete"
                  >
                    Delete
                  </button>
                  
                  {camp.status === 'Draft' ? (
                    <button
                      onClick={(e) => handleLaunch(e, camp._id)}
                      className="btn btn-primary cp-btn-launch"
                    >
                      Launch
                    </button>
                  ) : (
                    <Link
                      to="/analytics"
                      className="btn btn-secondary cp-btn-analytics"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Analytics
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          {activeModal === 'view-campaign' && selectedCampaign && (
            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="font-headline-md cp-modal-title">Campaign Details</h3>
                  <button className="action-btn" onClick={() => setActiveModal(null)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                    
                <div className="modal-body">
                  <div className="cp-modal-body-list">
                    <div>
                      <label className="form-label">Campaign Name</label>
                      <p>{selectedCampaign.name}</p>
                    </div>
                    <div>
                      <label className="form-label">Target Segment</label>
                      <p>{selectedCampaign.targetSegment}</p>
                    </div>
                    <div>
                      <label className="form-label">Channel</label>
                      <p>{selectedCampaign.channel}</p>
                    </div>
                    <div>
                      <label className="form-label">Status</label>
                      <p>{selectedCampaign.status}</p>
                    </div>
                    <div>
                      <label className="form-label">Objective</label>
                      <p>{selectedCampaign.objective || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">Subject</label>
                      <p>{selectedCampaign.subject || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">Optimal Time</label>
                      <p>{selectedCampaign.optimalTime || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="form-label">Audience Size</label>
                      <p>{selectedCampaign.audienceSize || 0}</p>
                    </div>
                  </div>
                </div>
                    
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Campaigns;
