import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import '../styles/Analytics.css';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

const LoadingOverlay = () => (
  <div className="an-card-loading-overlay">
    <span className="material-symbols-outlined an-spinning an-loading-overlay-icon">sync</span>
  </div>
);

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (range) => {
    try {
      setLoading(true);
      const res = await api.getAnalytics(range);
      if (res.success) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  if (loading && !analyticsData) {
    return (
      <div className="an-loading-container">
        <span className="material-symbols-outlined an-loading-icon">sync</span>
        <p className="an-loading-text">Loading analytics metrics...</p>
      </div>
    );
  }

  const summary = analyticsData?.summary || { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, deliveryRate: 0, openRate: 0, ctr: 0, conversionRate: 0 };
  const channelBreakdown = analyticsData?.channelBreakdown || {
    Email: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, openRate: 0, conversionRate: 0 },
    WhatsApp: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, openRate: 0, conversionRate: 0 },
    SMS: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, openRate: 0, conversionRate: 0 },
    Push: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, openRate: 0, conversionRate: 0 }
  };
  const dailyActivity = analyticsData?.dailyActivity || [];

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h2>Performance Analytics</h2>
          <p>Analyze global marketing performance metrics and lifecycle speeds.</p>
        </div>
        <div className="page-header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-input an-header-select"
            disabled={loading}
          >
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Quarter</option>
          </select>
          <button
            onClick={() => fetchAnalytics(timeRange)}
            className="btn btn-secondary"
            disabled={loading}
          >
            <span className={`material-symbols-outlined an-action-icon ${loading ? 'an-spinning' : ''}`}>
              {loading ? 'sync' : 'refresh'}
            </span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid-5 an-kpis-grid">
        {/* KPI 1 */}
        <div className="card an-kpi-card">
          {loading && <LoadingOverlay />}
          <p className="font-label-sm an-kpi-title">Sent</p>
          <h3 className="an-kpi-value">{formatNumber(summary.sent)}</h3>
          <div className="an-kpi-trend">
            <span className="material-symbols-outlined an-kpi-trend-icon">trending_up</span>
            <span>Live Data</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card an-kpi-card">
          {loading && <LoadingOverlay />}
          <p className="font-label-sm an-kpi-title">Delivered</p>
          <h3 className="an-kpi-value">{formatNumber(summary.delivered)}</h3>
          <div className="an-kpi-trend">
            <span className="material-symbols-outlined an-kpi-trend-icon">trending_up</span>
            <span>{summary.deliveryRate}% Rate</span>
          </div>
          <p className="an-kpi-subtext">Delivery Success</p>
        </div>

        {/* KPI 3 */}
        <div className="card an-kpi-card">
          {loading && <LoadingOverlay />}
          <p className="font-label-sm an-kpi-title">Opened</p>
          <h3 className="an-kpi-value">{formatNumber(summary.opened)}</h3>
          <div className="an-kpi-trend">
            <span className="material-symbols-outlined an-kpi-trend-icon">trending_up</span>
            <span>{summary.openRate}% Rate</span>
          </div>
          <p className="an-kpi-subtext">Open / Read Rate</p>
        </div>

        {/* KPI 4 */}
        <div className="card an-kpi-card">
          {loading && <LoadingOverlay />}
          <p className="font-label-sm an-kpi-title">Clicked</p>
          <h3 className="an-kpi-value">{formatNumber(summary.clicked)}</h3>
          <div className="an-kpi-trend">
            <span className="material-symbols-outlined an-kpi-trend-icon">trending_up</span>
            <span>{summary.ctr}% CTR</span>
          </div>
          <p className="an-kpi-subtext">Click-Through Rate</p>
        </div>

        {/* KPI 5 */}
        <div className="card an-kpi-card ai-kpi ai-glow">
          {loading && <LoadingOverlay />}
          <p className="font-label-sm an-kpi-title ai-title">
            <span className="material-symbols-outlined an-kpi-title-icon">auto_awesome</span>
            Converted
          </p>
          <h3 className="an-kpi-value">{formatNumber(summary.converted)}</h3>
          <div className="an-kpi-trend">
            <span className="material-symbols-outlined an-kpi-trend-icon">trending_up</span>
            <span>{summary.conversionRate}% Rate</span>
          </div>
          <p className="an-kpi-subtext">Conversion Rate</p>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid-bento">
        {/* Campaign performance (Line chart using SVG) */}
        <div className="card col-8 an-card-relative">
          {loading && <LoadingOverlay />}
          <div className="an-chart-header">
            <div className="an-chart-title-group">
              <h3 className="font-headline-md an-chart-title">Campaign Performance</h3>
              <p className="an-chart-subtitle">Sent volume over time (Solid) vs. Opened (Dashed)</p>
            </div>
            <div className="an-chart-legend">
              <span className="an-chart-legend-item">
                <div className="an-chart-legend-color-sent"></div>
                Sent Volume
              </span>
              <span className="an-chart-legend-item">
                <div className="an-chart-legend-color-opened"></div>
                Opened Volume
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="an-chart-container">
            {(() => {
              if (!dailyActivity || dailyActivity.length === 0) {
                return (
                  <div className="an-chart-empty">
                    No activity data available
                  </div>
                );
              }

              const maxVal = Math.max(...dailyActivity.map(d => d.sent), 10);
              const step = dailyActivity.length > 1 ? 600 / (dailyActivity.length - 1) : 600;
              const getX = (index) => 50 + index * step;
              const getY = (val) => 180 - (val / maxVal) * 150;

              const points = dailyActivity.map((d, i) => `${getX(i)},${getY(d.sent)}`);
              const pathD = `M ${points.join(' L ')}`;
              const areaD = `${pathD} L ${getX(dailyActivity.length - 1)},180 L 50,180 Z`;

              const openPoints = dailyActivity.map((d, i) => `${getX(i)},${getY(d.opened)}`);
              const openPathD = `M ${openPoints.join(' L ')}`;

              return (
                <svg viewBox="0 0 700 240" className="an-chart-svg">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="660" y2="30" stroke="var(--outline-variant)" strokeOpacity="0.3" />
                  <line x1="40" y1="80" x2="660" y2="80" stroke="var(--outline-variant)" strokeOpacity="0.3" />
                  <line x1="40" y1="130" x2="660" y2="130" stroke="var(--outline-variant)" strokeOpacity="0.3" />
                  <line x1="40" y1="180" x2="660" y2="180" stroke="var(--outline-variant)" strokeOpacity="0.3" />

                  {/* Left Y-axis labels */}
                  <text x="15" y="34" fontSize="10" fill="var(--outline)" textAnchor="middle">{formatNumber(maxVal)}</text>
                  <text x="15" y="84" fontSize="10" fill="var(--outline)" textAnchor="middle">{formatNumber(Math.round(maxVal * 0.66))}</text>
                  <text x="15" y="134" fontSize="10" fill="var(--outline)" textAnchor="middle">{formatNumber(Math.round(maxVal * 0.33))}</text>
                  <text x="15" y="184" fontSize="10" fill="var(--outline)" textAnchor="middle">0</text>

                  {/* AI Predicted Baseline Dash Line */}
                  <path
                    d={openPathD}
                    fill="none"
                    stroke="var(--secondary)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />

                  {/* Actual Engagement Line & Gradient Area */}
                  <path
                    d={areaD}
                    fill="url(#chartGradient)"
                    opacity="0.1"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                  />

                  {/* Data points */}
                  {dailyActivity.map((d, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(d.sent)} r="4" fill="var(--primary)" stroke="white" strokeWidth="2" />
                  ))}

                  {/* Bottom X-axis labels */}
                  {dailyActivity.map((d, i) => {
                    let showLabel = true;
                    if (dailyActivity.length > 7) {
                      const interval = dailyActivity.length > 45 ? 10 : 5;
                      showLabel = (i % interval === 0) || (i === dailyActivity.length - 1);
                    }
                    if (!showLabel) return null;
                    return (
                      <text key={i} x={getX(i)} y="220" fontSize="10" fill="var(--outline)" textAnchor="middle">{d.day}</text>
                    );
                  })}

                  {/* Definitions */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Funnel Pipeline */}
        <div className="card col-4 an-funnel-card an-card-relative">
          {loading && <LoadingOverlay />}
          <div className="an-funnel-header">
            <h3 className="font-headline-md an-funnel-title">Conversion Funnel</h3>
            <p className="an-funnel-subtitle">Aggregate pipeline health</p>
          </div>

          <div className="an-funnel-list">
            {/* Funnel Step 1 */}
            <div className="an-funnel-step">
              <div className="an-funnel-step-bg sent"></div>
              <span className="an-funnel-step-label">Sent</span>
              <span className="an-funnel-step-val">100% ({formatNumber(summary.sent)})</span>
            </div>
            {/* Funnel Step 2 */}
            <div className="an-funnel-step" style={{ width: '95%', margin: '0 auto' }}>
              <div className="an-funnel-step-bg" style={{ width: `${summary.deliveryRate}%`, backgroundColor: 'rgba(79, 70, 229, 0.25)' }}></div>
              <span className="an-funnel-step-label">Delivered</span>
              <span className="an-funnel-step-val">{summary.deliveryRate}% ({formatNumber(summary.delivered)})</span>
            </div>
            {/* Funnel Step 3 */}
            <div className="an-funnel-step" style={{ width: '90%', margin: '0 auto' }}>
              <div className="an-funnel-step-bg" style={{ width: `${summary.openRate}%`, backgroundColor: 'rgba(79, 70, 229, 0.45)' }}></div>
              <span className="an-funnel-step-label">Opened</span>
              <span className="an-funnel-step-val">{summary.openRate}% ({formatNumber(summary.opened)})</span>
            </div>
            {/* Funnel Step 4 */}
            <div className="an-funnel-step" style={{ width: '85%', margin: '0 auto' }}>
              <div className="an-funnel-step-bg" style={{ width: `${summary.ctr}%`, backgroundColor: 'rgba(79, 70, 229, 0.65)' }}></div>
              <span className="an-funnel-step-label">Clicked</span>
              <span className="an-funnel-step-val">{summary.ctr}% ({formatNumber(summary.clicked)})</span>
            </div>
            {/* Funnel Step 5 */}
            <div className="ai-glow an-funnel-step-convert" style={{ width: '80%', margin: '0 auto' }}>
              <span className="an-funnel-step-convert-label">
                <span className="material-symbols-outlined an-funnel-step-convert-icon">flag</span>
                Converted
              </span>
              <span className="an-funnel-step-convert-val">{summary.conversionRate}% ({formatNumber(summary.converted)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Breakdown Row */}
      <div className="grid-2">
        {/* Channel Breakdown */}
        <div className="card an-card-relative">
          {loading && <LoadingOverlay />}
          <div className="an-breakdown-header">
            <h3 className="font-headline-md an-breakdown-title">Channel Breakdown</h3>
            <p className="an-breakdown-subtitle">Volume vs Open & Conversion Rate</p>
          </div>

          <div className="an-breakdown-list">
            {/* WhatsApp */}
            <div className="an-breakdown-item">
              <div className="an-breakdown-row">
                <span className="an-breakdown-label">
                  <span className="material-symbols-outlined an-breakdown-label-icon whatsapp">chat</span>
                  WhatsApp
                </span>
                <span className="an-breakdown-val whatsapp">
                  {formatNumber(channelBreakdown.WhatsApp.sent)} sent ({channelBreakdown.WhatsApp.conversionRate}% conv.)
                </span>
              </div>
              <div className="an-breakdown-bar-bg">
                <div className="an-breakdown-bar-fill whatsapp" style={{ width: `${summary.sent > 0 ? (channelBreakdown.WhatsApp.sent / summary.sent) * 100 : 0}%` }}></div>
              </div>
            </div>

            {/* Email */}
            <div className="an-breakdown-item">
              <div className="an-breakdown-row">
                <span className="an-breakdown-label">
                  <span className="material-symbols-outlined an-breakdown-label-icon email">mail</span>
                  Email
                </span>
                <span className="an-breakdown-val email">
                  {formatNumber(channelBreakdown.Email.sent)} sent ({channelBreakdown.Email.conversionRate}% conv.)
                </span>
              </div>
              <div className="an-breakdown-bar-bg">
                <div className="an-breakdown-bar-fill email" style={{ width: `${summary.sent > 0 ? (channelBreakdown.Email.sent / summary.sent) * 100 : 0}%` }}></div>
              </div>
            </div>

            {/* SMS */}
            <div className="an-breakdown-item">
              <div className="an-breakdown-row">
                <span className="an-breakdown-label">
                  <span className="material-symbols-outlined an-breakdown-label-icon sms">sms</span>
                  SMS Text
                </span>
                <span className="an-breakdown-val sms">
                  {formatNumber(channelBreakdown.SMS.sent)} sent ({channelBreakdown.SMS.conversionRate}% conv.)
                </span>
              </div>
              <div className="an-breakdown-bar-bg">
                <div className="an-breakdown-bar-fill sms" style={{ width: `${summary.sent > 0 ? (channelBreakdown.SMS.sent / summary.sent) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Velocity */}
        <div className="card an-card-relative">
          {loading && <LoadingOverlay />}
          <div className="an-velocity-header">
            <h3 className="font-headline-md an-velocity-title">Lifecycle Velocity</h3>
            <p className="an-velocity-subtitle">Average time from creation to conversion</p>
          </div>

          <div className="an-velocity-list">
            {/* Line connecting items */}
            <div className="an-velocity-line"></div>

            {/* Step 1 */}
            <div className="an-velocity-step">
              <div className="an-velocity-dot"></div>
              <div>
                <h4 className="an-velocity-step-title">Campaign Created</h4>
                <p className="an-velocity-step-desc">Day 0</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="an-velocity-step">
              <div className="an-velocity-dot"></div>
              <div>
                <h4 className="an-velocity-step-title">AI Segment Generated</h4>
                <p className="an-velocity-step-desc">+ 2 Hours</p>
                <div className="an-velocity-badge">
                  <span className="material-symbols-outlined an-velocity-badge-icon">insights</span>
                  <span className="an-velocity-badge-text">Live campaign performance data</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="an-velocity-step">
              <div className="an-velocity-dot"></div>
              <div>
                <h4 className="an-velocity-step-title">Deployed / Sent</h4>
                <p className="an-velocity-step-desc">Day 1</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="an-velocity-step">
              <div className="an-velocity-dot ai-dot ai-glow"></div>
              <div>
                <h4 className="an-velocity-step-title">Peak Conversion Hit</h4>
                <p className="an-velocity-step-desc">Day 3</p>
                <p className="an-velocity-industry-compare">Updated in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
