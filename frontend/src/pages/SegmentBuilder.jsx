import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/SegmentBuilder.css';

const SegmentBuilder = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual rules state
  const [spendField, setSpendField] = useState('Total Spend');
  const [spendOperator, setSpendOperator] = useState('is greater than');
  const [spendValue, setSpendValue] = useState(5000);
  
  const [cityField, setCityField] = useState('City');
  const [cityOperator, setCityOperator] = useState('is exactly');
  const [cityValue, setCityValue] = useState('Mumbai');

  const [dateField, setDateField] = useState('Last Purchase Date');
  const [dateOperator, setDateOperator] = useState('is within the last');
  const [dateValue, setDateValue] = useState(30);

  const [customers, setCustomers] = useState([]);
  const [matchingCount, setMatchingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // AI Builder state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load all customers initially for local matching count calculation
  const loadCustomers = async () => {
    try {
      const res = await api.getCustomers();
      setCustomers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCustomers();
    // Handle presets from dashboard
    const preset = searchParams.get('preset');
    if (preset === 'abandoned') {
      setActiveTab('manual');
      setSpendField('Total Spend');
      setSpendOperator('is less than');
      setSpendValue(2000);
      setDateOperator('is within the last');
      setDateValue(15);
    }
  }, [searchParams]);

  // Recalculate matching count when manual rules change
  useEffect(() => {
    if (customers.length === 0) return;

    const matched = customers.filter(c => {
      // 1. Spend check
      let spendMatch = true;
      if (spendOperator === 'is greater than') {
        spendMatch = c.totalSpend > spendValue;
      } else {
        spendMatch = c.totalSpend < spendValue;
      }

      // 2. City check
      let cityMatch = true;
      if (cityOperator === 'is exactly') {
        cityMatch = c.city.toLowerCase() === cityValue.toLowerCase();
      } else {
        cityMatch = c.city.toLowerCase() !== cityValue.toLowerCase();
      }

      // 3. Last Purchase check
      let dateMatch = true;
      const daysAgo = (Date.now() - new Date(c.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24);
      if (dateOperator === 'is within the last') {
        dateMatch = daysAgo <= dateValue;
      } else {
        dateMatch = daysAgo > dateValue;
      }

      return spendMatch && cityMatch && dateMatch;
    });

    setMatchingCount(matched.length);
  }, [customers, spendOperator, spendValue, cityOperator, cityValue, dateOperator, dateValue]);

  const handleAISubmit = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return alert('Please describe your target segment');
    try {
      setAiLoading(true);
      const res = await api.queryAISegment(aiPrompt);
      setAiResult(res);
    } catch (error) {
      alert('AI processing failed: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditInManual = () => {
    if (!aiResult) return;
    setActiveTab('manual');
    // Map AI result rules to manual builder
    aiResult.rules.forEach(rule => {
      if (rule.field === 'Total Spend') {
        setSpendValue(5000);
        setSpendOperator('is greater than');
      }
      if (rule.field === 'City') {
        setCityValue(rule.value);
        setCityOperator('is exactly');
      }
      if (rule.field === 'Segment') {
        // Fallback for segment
      }
    });
  };

  const handleSaveSegment = () => {
    const segmentName = prompt('Enter a name for this segment:', activeTab === 'manual' ? 'Custom Audience Rules' : 'AI Generated Segment');
    if (!segmentName) return;
    alert(`Segment "${segmentName}" saved successfully! You can now select it in the AI Campaign Wizard.`);
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h2>Segment Builder</h2>
          <p>Define target customer segments using manual filters or AI prompting.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sb-tabs">
        <button 
          onClick={() => setActiveTab('manual')}
          className={`sb-tab-btn ${activeTab === 'manual' ? 'active' : 'inactive'}`}
        >
          Manual Builder
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`sb-tab-btn sb-ai-tab-btn ${activeTab === 'ai' ? 'active' : 'inactive'}`}
        >
          <span className="material-symbols-outlined sb-ai-tab-icon">auto_awesome</span>
          AI Builder
        </button>
      </div>

      {/* Manual Builder Tab */}
      {activeTab === 'manual' && (
        <div className="grid-bento">
          {/* Logic Rules Canvas */}
          <div className="card col-8 sb-rules-card">
            <div className="sb-rules-header">
              <h3 className="font-headline-md sb-rules-title">Audience Rules</h3>
              <button className="btn btn-secondary sb-rules-add-btn" onClick={() => alert('Rule groups feature coming soon')}>
                <span className="material-symbols-outlined sb-rules-add-icon">add_circle</span> Add Rule Group
              </button>
            </div>

            {/* Rule Group Container */}
            <div className="sb-rules-container">
              <p className="font-label-sm sb-rules-subtitle">
                Match ALL of the following conditions:
              </p>

              <div className="sb-rules-list">
                {/* Condition 1: Spend */}
                <div className="sb-rule-row">
                  <span className="material-symbols-outlined sb-rule-icon">payments</span>
                  <span className="sb-rule-field">{spendField}</span>
                  <select 
                    value={spendOperator}
                    onChange={(e) => setSpendOperator(e.target.value)}
                    className="form-input sb-rule-select"
                  >
                    <option value="is greater than">is greater than</option>
                    <option value="is less than">is less than</option>
                  </select>
                  <div className="sb-rule-input-wrapper">
                    <span className="sb-rule-input-symbol">₹</span>
                    <input 
                      type="number" 
                      value={spendValue} 
                      onChange={(e) => setSpendValue(Number(e.target.value))}
                      className="form-input sb-rule-input-spend" 
                    />
                  </div>
                </div>

                {/* Condition 2: City */}
                <div className="sb-rule-row">
                  <span className="material-symbols-outlined sb-rule-icon">location_city</span>
                  <span className="sb-rule-field">{cityField}</span>
                  <select 
                    value={cityOperator}
                    onChange={(e) => setCityOperator(e.target.value)}
                    className="form-input sb-rule-select"
                  >
                    <option value="is exactly">is exactly</option>
                    <option value="is not">is not</option>
                  </select>
                  <input 
                    type="text" 
                    value={cityValue} 
                    onChange={(e) => setCityValue(e.target.value)}
                    className="form-input sb-rule-input-city" 
                  />
                </div>

                {/* Condition 3: Date */}
                <div className="sb-rule-row">
                  <span className="material-symbols-outlined sb-rule-icon">history</span>
                  <span className="sb-rule-field">Last Order</span>
                  <select 
                    value={dateOperator}
                    onChange={(e) => setDateOperator(e.target.value)}
                    className="form-input sb-rule-select"
                  >
                    <option value="is within the last">is within the last</option>
                    <option value="is before">is before</option>
                  </select>
                  <div className="sb-rule-input-days-wrapper">
                    <input 
                      type="number" 
                      value={dateValue} 
                      onChange={(e) => setDateValue(Number(e.target.value))}
                      className="form-input sb-rule-input-days" 
                    />
                    <span className="sb-rule-input-days-label">Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audience Preview Column */}
          <div className="card col-4 sb-preview-card">
            <div>
              <h3 className="font-headline-md sb-preview-title">Audience Preview</h3>
              
              <div className="sb-preview-reach-box">
                <div className="sb-preview-reach-count">
                  {loading ? '...' : matchingCount}
                </div>
                <div className="font-body-md sb-preview-reach-label">Estimated Target Reach</div>
              </div>

              <div className="sb-preview-details">
                <div>
                  <div className="sb-preview-reachability-row">
                    <span>Reachability</span>
                    <span className="sb-preview-reachability-badge">High</span>
                  </div>
                  <div className="sb-preview-bar-bg">
                    <div className="sb-preview-bar-fill"></div>
                  </div>
                </div>

                <div className="sb-preview-traits-box">
                  <p className="font-label-sm sb-preview-traits-title">Active Traits</p>
                  <div className="sb-preview-traits-list">
                    <span className="badge badge-neutral">Spend: ₹{spendValue}</span>
                    <span className="badge badge-neutral">City: {cityValue}</span>
                    <span className="badge badge-neutral">Recency: {dateValue}d</span>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleSaveSegment} className="btn btn-primary w-full sb-preview-save-btn">
              Save Segment
            </button>
          </div>
        </div>
      )}

      {/* AI Builder Tab */}
      {activeTab === 'ai' && (
        <div className="sb-ai-container">
          <div className="sb-ai-header">
            <span className="material-symbols-outlined sb-ai-header-icon">auto_awesome</span>
            <h2 className="font-display-lg sb-ai-header-title">Describe Your Audience</h2>
            <p className="font-body-lg sb-ai-header-subtitle">Let AI generate complex database logic rules for you in seconds.</p>
          </div>

          <form onSubmit={handleAISubmit} className="ai-glow sb-ai-form">
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Find customers who spent more than ₹5000 in Mumbai city, and have ordered within the last 30 days..."
              className="sb-ai-textarea"
            />
            
            <div className="sb-ai-form-actions">
              <div className="sb-ai-presets-container">
                <button 
                  type="button"
                  onClick={() => setAiPrompt('High spenders in Mumbai who ordered recently')}
                  className="badge badge-secondary sb-ai-preset-btn"
                >
                  "High spenders in Mumbai"
                </button>
                <button 
                  type="button"
                  onClick={() => setAiPrompt('Find customers at risk who ordered more than 60 days ago')}
                  className="badge badge-secondary sb-ai-preset-btn"
                >
                  "At risk customers"
                </button>
              </div>

              <button type="submit" disabled={aiLoading} className="btn btn-ai">
                {aiLoading ? 'Analyzing...' : 'Generate Rules'}
                <span className="material-symbols-outlined sb-ai-submit-icon">magic_button</span>
              </button>
            </div>
          </form>

          {/* AI Result Card */}
          {aiResult && (
            <div className="card ai-glow-elevation sb-ai-result-card">
              <div className="sb-ai-result-header">
                <div>
                  <div className="sb-ai-result-title-container">
                    <span className="material-symbols-outlined sb-ai-result-check-icon">check_circle</span>
                    <h3 className="font-headline-md sb-ai-result-title">Generated Segment</h3>
                  </div>
                  <p className="font-body-md sb-ai-result-desc">Rules generated successfully based on prompt.</p>
                </div>
                <div className="sb-ai-result-stats">
                  <div className="sb-ai-result-stats-count">{aiResult.matchingCount}</div>
                  <div className="font-label-sm sb-ai-result-stats-label">Matching Customers</div>
                </div>
              </div>

              <div className="sb-ai-result-rules-list">
                {aiResult.rules.map((rule, idx) => (
                  <div key={idx} className="sb-ai-result-rule-row">
                    <span className="material-symbols-outlined sb-ai-result-rule-icon">{rule.icon}</span>
                    <span><strong>{rule.field}</strong> {rule.operator} <strong>{rule.value}</strong></span>
                  </div>
                ))}
              </div>

              <div className="sb-ai-result-actions">
                <button onClick={handleEditInManual} className="btn btn-secondary sb-ai-result-btn-secondary">
                  Edit in Manual Builder
                </button>
                <button onClick={handleSaveSegment} className="btn btn-primary sb-ai-result-btn-primary">
                  Save Segment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SegmentBuilder;
