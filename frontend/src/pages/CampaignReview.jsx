import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/CampaignReview.css';

// ==========================================
// Helper Functions (Refactored for Readability)
// ==========================================

/**
 * Strips accidental prefix text and formats segment names.
 * e.g., "SegmentNew Customers (Last 14 Days) in Mumbai" -> "New Customers (Last 14 Days) - Mumbai"
 */
const cleanSegmentName = (segment) => {
  if (!segment) return '';
  // Strip "Segment" or "Segment:" (case-insensitive) if concatenated directly or with spaces/colons
  let cleaned = segment.replace(/^Segment:?\s*/i, '');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/\s+in\s+([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)*)$/, ' - $1');
  return cleaned;
};

/**
 * Retrieves prediction metrics from campaign data with realistic fallbacks.
 */
const getPredictions = (campaign) => {
  const openRate = campaign?.predictedOpenRate !== undefined && campaign.predictedOpenRate !== 0 
    ? campaign.predictedOpenRate 
    : 48.0;
  const conversionRate = campaign?.predictedConversionRate !== undefined && campaign.predictedConversionRate !== 0
    ? campaign.predictedConversionRate 
    : 3.5;
  return { openRate, conversionRate };
};

/**
 * Calculates expected conversions based on audience size and conversion rate.
 * Returns '< 1' if the result is less than 1.
 */
const calculateExpectedConversions = (audienceCount, conversionRate) => {
  const rate = typeof conversionRate === 'number' ? conversionRate : parseFloat(conversionRate) || 0.0;
  const expected = audienceCount * (rate / 100);
  if (expected < 1) {
    return '< 1';
  }
  return Math.round(expected).toString();
};

/**
 * Replaces all placeholders inside message templates with sample customer values.
 */
const renderPersonalizedText = (text, customer) => {
  if (!text) return '';
  
  const firstName = customer?.name ? customer.name.split(' ')[0] : 'Rahul';
  const city = customer?.city || 'Mumbai';
  const segment = cleanSegmentName(customer?.segment) || 'New Customers';
  const rawSpend = customer?.totalSpend || customer?.total_spend || 5200;
  const totalSpend = typeof rawSpend === 'number' ? `₹${rawSpend.toLocaleString('en-IN')}` : rawSpend;

  return text
    .replace(/\{\{\s*(first_name|firstName)\s*\}\}/gi, firstName)
    .replace(/\{\{\s*city\s*\}\}/gi, city)
    .replace(/\{\{\s*segment\s*\}\}/gi, segment)
    .replace(/\{\{\s*total_spend\s*\}\}/gi, totalSpend);
};

/**
 * Dynamically generates CTA button text based on campaign properties.
 */
const getCTAFromCampaign = (campaign) => {
  if (!campaign) return 'Explore CRM Perks';
  
  if (campaign.cta) return campaign.cta;
  if (campaign.buttonText) return campaign.buttonText;

  const combinedText = [
    campaign.name,
    campaign.objective,
    campaign.subject,
    campaign.content,
    campaign.segmentLabel,
    campaign.targetSegment
  ].filter(Boolean).join(' ').toLowerCase();

  if (combinedText.includes('welcome') || combinedText.includes('onboarding') || combinedText.includes('signup')) {
    return 'Get Started';
  }
  if (combinedText.includes('win back') || combinedText.includes('win-back') || combinedText.includes('miss you') || combinedText.includes('reactivate') || combinedText.includes('churn')) {
    return 'Claim Offer';
  }
  if (combinedText.includes('discount') || combinedText.includes('coupon') || combinedText.includes('off') || combinedText.includes('redeem') || combinedText.includes('percent')) {
    return 'Redeem Discount';
  }
  if (combinedText.includes('vip') || combinedText.includes('exclusive') || combinedText.includes('loyal')) {
    return 'Unlock Benefits';
  }
  if (combinedText.includes('premium') || combinedText.includes('rewards') || combinedText.includes('points')) {
    return 'Explore Rewards';
  }

  return 'Explore CRM Perks';
};

// ==========================================
// Sub-components
// ==========================================

/**
 * Mockup preview for messaging channel.
 */
const MessagePreviewMockup = ({ campaign, previewMode, sampleCustomer, previewFirstName, ctaText }) => {
  const personalizedSubject = renderPersonalizedText(campaign?.subject, sampleCustomer);
  const personalizedContent = renderPersonalizedText(campaign?.content, sampleCustomer);

  return (
    <div className={`cr-mockup-wrapper ${previewMode === 'mobile' ? 'mobile' : 'desktop'}`}>
      {/* Header details */}
      <div className="cr-mockup-header">
        <div className="cr-mockup-sender-row">
          <div className="cr-mockup-avatar">B</div>
          <div>
            <div className="cr-mockup-sender-name">Brand Team</div>
            <div className="cr-mockup-sender-email">to: {previewFirstName.toLowerCase()}@example.com</div>
          </div>
        </div>
        <div className="cr-mockup-subject">
          Subject: {personalizedSubject}
        </div>
      </div>

      {/* Email Body */}
      <div className="cr-mockup-body">
        {personalizedContent}
        <div className="cr-mockup-btn-container">
          <button 
            className="btn btn-primary cr-mockup-btn cr-mockup-btn-preview" 
            disabled 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Main Component
// ==========================================

const CampaignReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [campaignNotFound, setCampaignNotFound] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop or mobile
  const [audienceCount, setAudienceCount] = useState(12450);
  const [previewFirstName, setPreviewFirstName] = useState('Rahul');
  const [sampleCustomer, setSampleCustomer] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      setLoadingStep(0); // Loading campaign draft...

      const res = await api.getCampaigns();
      const match = res.data.find(c => c._id === id);
      
      if (match) {
        setCampaign(match);
        setCampaignNotFound(false);
        
        // Dynamic loading step simulation
        await new Promise(resolve => setTimeout(resolve, 400));
        setLoadingStep(1); // Fetching audience data...

        // Query the target segment customer count dynamically
        const custRes = await api.getCustomers();
        let matched = [];
        if (match.targetFilter && Object.keys(match.targetFilter).length > 0) {
          matched = custRes.data.filter(c => {
            for (const key in match.targetFilter) {
              const cond = match.targetFilter[key];
              if (cond && typeof cond === 'object') {
                if ('$gt' in cond && !(c[key] > cond['$gt'])) return false;
                if ('$gte' in cond && !(c[key] >= cond['$gte'])) return false;
                if ('$lt' in cond && !(c[key] < cond['$lt'])) return false;
                if ('$lte' in cond && !(c[key] <= cond['$lte'])) return false;
              } else {
                if (c[key] !== cond) return false;
              }
            }
            return true;
          });
        } else {
          matched = custRes.data.filter(c => c.segment === match.targetSegment);
        }

        await new Promise(resolve => setTimeout(resolve, 400));
        setLoadingStep(2); // Preparing message preview...

        if (matched.length > 0) {
          const firstCust = matched[0];
          setSampleCustomer(firstCust);
          setPreviewFirstName(firstCust.name ? firstCust.name.split(' ')[0] : 'Rahul');
        } else {
          setSampleCustomer({
            name: 'Rahul Sharma',
            city: 'Mumbai',
            segment: 'New Customers',
            totalSpend: 5200
          });
          setPreviewFirstName('Rahul');
        }
        setAudienceCount(matched.length);
        
        await new Promise(resolve => setTimeout(resolve, 400));
      } else {
        setCampaignNotFound(true);
      }
    } catch (e) {
      console.error(e);
      showToast('Error fetching campaign: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleLaunch = async () => {
    try {
      setLoading(true);
      await api.launchCampaign(id);
      showToast('Campaign launched successfully!', 'success');
      
      setTimeout(() => {
        showToast('Redirecting to analytics...', 'info');
        setTimeout(() => {
          navigate('/analytics');
        }, 1200);
      }, 1200);
    } catch (error) {
      showToast('Failed to launch campaign. Please try again.', 'error');
      setLoading(false);
    }
  };

  if (loading && !campaign) {
    const steps = [
      { text: 'Loading campaign draft...', icon: 'article' },
      { text: 'Fetching audience data...', icon: 'groups' },
      { text: 'Preparing message preview...', icon: 'preview' }
    ];
    
    return (
      <div className="cr-loading-page">
        <div className="card cr-loading-card ai-glow animate-pulse">
          <div className="cr-loading-header">
            <span className="material-symbols-outlined cr-loading-spinner">sync</span>
            <h3 className="font-headline-md cr-loading-title">Reviewing Campaign</h3>
          </div>
          
          <div className="cr-loading-steps">
            {steps.map((step, idx) => {
              const isActive = loadingStep === idx;
              const isCompleted = loadingStep > idx;
              
              let iconName = step.icon;
              let stepClass = 'cr-loading-step';
              let iconClass = 'material-symbols-outlined';
              
              if (isCompleted) {
                iconName = 'check_circle';
                stepClass += ' completed';
                iconClass += ' step-completed-icon';
              } else if (isActive) {
                iconName = 'sync';
                stepClass += ' active';
                iconClass += ' cr-spinner';
              } else {
                stepClass += ' pending';
                iconClass += ' step-pending-icon';
              }
              
              return (
                <div key={idx} className={stepClass}>
                  <span className={iconClass}>{iconName}</span>
                  <span className="cr-step-text">{step.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (campaignNotFound) {
    return (
      <div className="container cr-container">
        <div className="card cr-empty-card">
          <div className="cr-empty-icon-box">
            <span className="material-symbols-outlined cr-empty-icon">error_outline</span>
          </div>
          <h2 className="font-headline-lg cr-empty-title">Campaign Not Found</h2>
          <p className="cr-empty-desc">The requested campaign does not exist or was removed.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary cr-empty-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const predictions = getPredictions(campaign);
  const expectedConversions = calculateExpectedConversions(audienceCount, predictions.conversionRate);

  return (
    <div className="container cr-container">
      {/* Toast Notification Container */}
      {toast && (
        <div className={`cr-toast cr-toast-${toast.type}`}>
          <span className="material-symbols-outlined cr-toast-icon">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="cr-toast-text">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="cr-header">
        <div className="cr-header-icon-box">
          <span className="material-symbols-outlined cr-header-icon">check_circle</span>
        </div>
        <h1 className="font-display-lg cr-header-title">Review Campaign</h1>
        <p className="font-body-lg cr-header-subtitle">
          Everything looks great. Review the details below before launching your campaign to the selected audience.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid-2 cr-grid">
        {/* Left Column: Details & Reach */}
        <div className="cr-left-column">
          {/* Target Audience Card */}
          <div className="card">
            <div className="cr-card-header">
              <span className="material-symbols-outlined cr-card-header-icon">groups</span>
              <h2 className="font-headline-md cr-card-title">Target Audience</h2>
            </div>
            
            <div className="cr-details-list">
              <div className="cr-details-row">
                <span className="cr-details-label">Segment:</span>
                <span className="cr-details-val">
                  {cleanSegmentName(campaign?.segmentLabel || campaign?.targetSegment)}
                </span>
              </div>
              <div className="cr-details-row">
                <span className="cr-details-label">Target Size</span>
                <span className="cr-details-val">{audienceCount} contacts</span>
              </div>
              <div className="cr-details-row align-center">
                <span className="cr-details-label">Channel</span>
                <span className="badge badge-neutral cr-details-val badge">
                  <span className="material-symbols-outlined cr-details-val-icon">
                    {campaign?.channel === 'WhatsApp' ? 'chat' : campaign?.channel === 'SMS' ? 'sms' : campaign?.channel === 'Push' ? 'notifications' : 'mail'}
                  </span>
                  {campaign?.channel}
                </span>
              </div>
              {campaign?.objective && (
                <div className="cr-details-col">
                  <span className="cr-details-col-label">Campaign Objective</span>
                  <span className="cr-details-col-val">{campaign.objective}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Estimations Card */}
          <div className="gradient-border ai-glow cr-estimations-card">
            <div className="cr-estimations-header">
              <span className="material-symbols-outlined cr-estimations-header-icon">auto_awesome</span>
              <h2 className="font-headline-md cr-estimations-title">AI Estimations</h2>
            </div>
            
            <div className="cr-estimations-grid">
              <div className="cr-estimation-box">
                <span className="cr-estimation-label">Predicted Open Rate</span>
                <span className="font-headline-lg cr-estimation-value">{predictions.openRate}%</span>
              </div>
              
              <div className="cr-estimation-box">
                <span className="cr-estimation-label">Predicted Conversion Rate</span>
                <span className="font-headline-lg cr-estimation-value">{predictions.conversionRate}%</span>
              </div>
              
              <div className="cr-estimation-box cr-estimation-box-full">
                <span className="cr-estimation-label">Expected Conversions</span>
                <span className="font-headline-lg cr-estimation-value">{expectedConversions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Message Preview */}
        <div className="cr-right-column">
          <div className="card cr-preview-card">
            {/* Preview Header */}
            <div className="cr-preview-header">
              <div className="cr-preview-header-left">
                <span className="material-symbols-outlined cr-preview-header-icon">preview</span>
                <h2 className="font-headline-md cr-preview-header-title">Message Preview</h2>
              </div>
              
              <div className="cr-preview-header-actions">
                <button 
                  onClick={() => setPreviewMode('desktop')}
                  className="btn-icon" 
                  style={{
                    backgroundColor: previewMode === 'desktop' ? 'var(--surface-container-high)' : 'transparent',
                    color: previewMode === 'desktop' ? 'var(--primary)' : 'var(--outline)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>desktop_windows</span>
                </button>
                <button 
                  onClick={() => setPreviewMode('mobile')}
                  className="btn-icon" 
                  style={{
                    backgroundColor: previewMode === 'mobile' ? 'var(--surface-container-high)' : 'transparent',
                    color: previewMode === 'mobile' ? 'var(--primary)' : 'var(--outline)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smartphone</span>
                </button>
              </div>
            </div>

            {/* Preview Personalization Label */}
            <div className="cr-preview-personalization-info">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
              <span>Previewing for: <strong>{previewFirstName}</strong> (Sample Customer)</span>
            </div>

            {/* Client Mockup */}
            <div className="cr-preview-container">
              <MessagePreviewMockup 
                campaign={campaign} 
                previewMode={previewMode} 
                sampleCustomer={sampleCustomer} 
                previewFirstName={previewFirstName} 
                ctaText={getCTAFromCampaign(campaign)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar Floating Sticky */}
      <div className="cr-sticky-bar">
        <button onClick={() => navigate('/campaign-wizard')} className="btn btn-secondary">
          <span className="material-symbols-outlined cr-sticky-bar-icon">edit</span>
          Edit Draft
        </button>
        <button onClick={handleLaunch} className="btn btn-ai ai-pulse cr-sticky-bar-launch-btn">
          <span className="material-symbols-outlined cr-sticky-bar-launch-icon">rocket_launch</span>
          Launch Campaign
        </button>
      </div>
    </div>
  );
};

export default CampaignReview;
