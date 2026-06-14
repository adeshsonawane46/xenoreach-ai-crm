import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../styles/Dashboard.css';

// ==========================================
// Helper Functions (Refactored for Readability)
// ==========================================

/**
 * Calculates key insights dynamically from daily chart data and channel stats.
 */
const calculateChartInsights = (chartData, breakdown) => {
  let highestOpenDay = { day: '-', rate: 0 };
  let highestConvDay = { day: '-', rate: 0 };
  let totalVol = 0;
  
  if (Array.isArray(chartData)) {
    chartData.forEach(d => {
      totalVol += d.sent || 0;
      if (d.sent > 0) {
        const openRate = ((d.opened || 0) / d.sent) * 100;
        const convRate = ((d.converted || 0) / d.sent) * 100;
        if (openRate > highestOpenDay.rate) {
          highestOpenDay = { day: d.day, rate: openRate };
        }
        if (convRate > highestConvDay.rate) {
          highestConvDay = { day: d.day, rate: convRate };
        }
      }
    });
  }

  let bestChannel = '-';
  let bestChannelRate = 0;
  if (breakdown) {
    Object.entries(breakdown).forEach(([chan, stats]) => {
      const rate = stats.conversionRate || 0;
      if (rate > bestChannelRate) {
        bestChannelRate = rate;
        bestChannel = chan;
      }
    });
    // Fallback to highest open rate channel if no conversions
    if (bestChannel === '-') {
      let bestOpenRate = 0;
      Object.entries(breakdown).forEach(([chan, stats]) => {
        const rate = stats.openRate || 0;
        if (rate > bestOpenRate) {
          bestOpenRate = rate;
          bestChannel = chan;
        }
      });
    }
  }

  return {
    highestOpenDay: highestOpenDay.day !== '-' ? `${highestOpenDay.day} (${highestOpenDay.rate.toFixed(1)}%)` : '-',
    highestConvDay: highestConvDay.day !== '-' ? `${highestConvDay.day} (${highestConvDay.rate.toFixed(1)}%)` : '-',
    totalVolume: totalVol.toLocaleString(),
    bestChannel: bestChannel
  };
};

/**
 * Custom Tooltip for Premium SaaS AreaChart
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const sent = data.sent || 0;
    const opened = data.opened || 0;
    const clicked = data.clicked !== undefined ? data.clicked : Math.round(opened * 0.3 + (data.converted || 0) * 0.7);
    const converted = data.converted || 0;
    
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0';
    const conversionRate = sent > 0 ? ((converted / sent) * 100).toFixed(1) : '0.0';

    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <div className="tooltip-divider"></div>
        <div className="tooltip-grid">
          <div className="tooltip-row">
            <span className="dot sent"></span>
            <span className="tooltip-label">Sent</span>
            <span className="tooltip-value">{sent.toLocaleString()}</span>
          </div>
          <div className="tooltip-row">
            <span className="dot opened"></span>
            <span className="tooltip-label">Opened</span>
            <span className="tooltip-value">{opened.toLocaleString()}</span>
          </div>
          <div className="tooltip-row">
            <span className="dot clicked"></span>
            <span className="tooltip-label">Clicked</span>
            <span className="tooltip-value">{clicked.toLocaleString()}</span>
          </div>
          <div className="tooltip-row">
            <span className="dot converted"></span>
            <span className="tooltip-label">Converted</span>
            <span className="tooltip-value">{converted.toLocaleString()}</span>
          </div>
          <div className="tooltip-divider"></div>
          <div className="tooltip-row">
            <span className="tooltip-label">Open Rate</span>
            <span className="tooltip-value rate">{openRate}%</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Conversion Rate</span>
            <span className="tooltip-value rate">{conversionRate}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ==========================================
// Main Component
// ==========================================

const Dashboard = () => {
  const [stats, setStats] = useState({
    customers: 0,
    orders: 0,
    revenue: 0,
    activeCampaigns: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [demoDataLoading, setDemoDataLoading] = useState(false);
  const [demoDataLoadingText, setDemoDataLoadingText] = useState('');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

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

  const fetchDashboardData = async (silent = false, range = timeRange, onlyAnalytics = false) => {
    try {
      if (onlyAnalytics) {
        if (!silent) setAnalyticsLoading(true);
      } else {
        if (!silent) setLoading(true);
      }
      setError(null);
      
      if (onlyAnalytics) {
        const analyticsRes = await api.getAnalytics(range);
        if (analyticsRes && analyticsRes.success) {
          setAnalyticsData(analyticsRes.data);
        }
      } else {
        const [customersRes, ordersRes, campaignsRes, analyticsRes] = await Promise.all([
          api.getCustomers(),
          api.getOrders(),
          api.getCampaigns(),
          api.getAnalytics(range)
        ]);

        const customersCount = (customersRes && typeof customersRes.count === 'number') ? customersRes.count : 0;
        const ordersCount = (ordersRes && typeof ordersRes.count === 'number') ? ordersRes.count : 0;
        const ordersData = (ordersRes && Array.isArray(ordersRes.data)) ? ordersRes.data : [];
        const campaignsData = (campaignsRes && Array.isArray(campaignsRes.data)) ? campaignsRes.data : [];

        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.amount || 0), 0);
        const activeCount = campaignsData.filter(c => c.status === 'Active').length;

        setStats({
          customers: customersCount,
          orders: ordersCount,
          revenue: totalRevenue,
          activeCampaigns: activeCount
        });

        setRecentCampaigns(campaignsData.slice(0, 5));
        setAllCampaigns(campaignsData);
        
        if (analyticsRes && analyticsRes.success) {
          setAnalyticsData(analyticsRes.data);
        }

        // Check for recommendations endpoint dynamically
        if (typeof api.getRecommendations === 'function') {
          try {
            const recsRes = await api.getRecommendations();
            setRecommendations(recsRes.data || recsRes || []);
          } catch (recErr) {
            console.error('Error fetching dynamic recommendations:', recErr);
            setRecommendations([]);
          }
        } else {
          setRecommendations([]);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data');
    } finally {
      if (!silent) {
        setLoading(false);
        setAnalyticsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('xenoreach_user');
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData(false, timeRange);
  }, [navigate]);

  const handleTimeRangeChange = async (range) => {
    setTimeRange(range);
    await fetchDashboardData(false, range, true);
  };

  const handleGenerateDemoData = async () => {
    try {
      setDemoDataLoading(true);
      
      // Step-by-step loading state sequence
      setDemoDataLoadingText('Generating customers...');
      await new Promise(r => setTimeout(r, 600));
      setDemoDataLoadingText('Generating orders...');
      await new Promise(r => setTimeout(r, 600));
      setDemoDataLoadingText('Generating campaigns...');
      await new Promise(r => setTimeout(r, 600));
      setDemoDataLoadingText('Preparing analytics...');
      await new Promise(r => setTimeout(r, 600));

      await api.generateDemoData();

      setDemoDataLoadingText('Demo data ready.');
      await new Promise(r => setTimeout(r, 400));

      showToast('Demo data generated successfully\nDashboard metrics updated.', 'success');
      // Silent refresh of metrics with current range
      await fetchDashboardData(true, timeRange);
    } catch (error) {
      console.error(error);
      showToast('Unable to generate demo data.\nPlease try again.', 'error');
    } finally {
      setDemoDataLoading(false);
      setDemoDataLoadingText('');
    }
  };

  const applyRecommendation = async (rec) => {
    try {
      setLoading(true);
      if (typeof api.applyRecommendation === 'function') {
        await api.applyRecommendation(rec.id);
      }
      showToast(`AI Recommendation applied: ${rec.title}`, 'success');
      await fetchDashboardData(true, timeRange);
    } catch (error) {
      console.error(error);
      showToast('Failed to apply recommendation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Prepare Pie Chart Data
  const emailSent = analyticsData?.channelBreakdown?.Email?.sent || 0;
  const waSent = analyticsData?.channelBreakdown?.WhatsApp?.sent || 0;
  const smsSent = analyticsData?.channelBreakdown?.SMS?.sent || 0;
  const pushSent = analyticsData?.channelBreakdown?.Push?.sent || 0;
  const totalVolume = emailSent + waSent + smsSent + pushSent;

  const pieData = [
    { name: 'Email', value: emailSent, color: '#4f46e5' },
    { name: 'WhatsApp', value: waSent, color: '#25d366' },
    { name: 'SMS', value: smsSent, color: '#06b6d4' },
    { name: 'Push', value: pushSent, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const lineChartData = analyticsData?.dailyActivity || [];
  const insights = calculateChartInsights(lineChartData, analyticsData?.channelBreakdown);

  const bestChannelName = insights.bestChannel !== '-' ? insights.bestChannel : (pieData.length > 0 ? pieData[0].name : '-');
  const bestChannelData = pieData.find(d => d.name === bestChannelName);
  const bestChannelPct = (bestChannelData && totalVolume > 0) ? Math.round((bestChannelData.value / totalVolume) * 100) : 0;
  
  const aiInsightText = bestChannelName !== '-'
    ? `${bestChannelName} generated the highest engagement during the selected period.`
    : "No campaign engagement logs found in this period.";

  /**
   * Custom Tooltip for Channel Breakdown PieChart
   */
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = data.value || 0;
      const pct = totalVolume > 0 ? ((value / totalVolume) * 100).toFixed(1) : '0.0';
      return (
        <div className="custom-pie-tooltip" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-soft)',
          fontSize: '11px',
          color: 'var(--on-surface-variant)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data.color }}></span>
            {data.name}
          </div>
          <div>Messages: <strong>{value.toLocaleString()}</strong></div>
          <div>Share: <strong>{pct}%</strong></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container">
      {/* Toast Notification Container */}
      {toast && (
        <div className={`db-toast db-toast-${toast.type}`} role="alert">
          <span className="material-symbols-outlined db-toast-icon">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="db-toast-text" style={{ whiteSpace: 'pre-line' }}>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h2>Dashboard</h2>
          <p>Welcome back. Here is what is happening with your campaigns today.</p>
        </div>
        <div className="page-header-actions">
          <button 
            onClick={handleGenerateDemoData} 
            className="btn btn-secondary" 
            disabled={demoDataLoading || loading}
            aria-busy={demoDataLoading}
          >
            <span className={`material-symbols-outlined db-action-icon ${demoDataLoading ? 'db-spinner' : ''}`}>
              {demoDataLoading ? 'sync' : 'database'}
            </span>
            {demoDataLoading ? demoDataLoadingText : 'Generate Demo Data'}
          </button>
          <Link to="/segment-builder" className="btn btn-secondary">
            <span className="material-symbols-outlined db-action-icon">group_add</span>
            Create Segment
          </Link>
          <Link to="/campaign-wizard" className="btn btn-ai">
            <span className="material-symbols-outlined db-action-icon">auto_awesome</span>
            Launch Campaign
          </Link>
        </div>
      </div>

      {error ? (
        <div className="card db-error-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
          <span className="material-symbols-outlined db-error-icon" style={{ fontSize: '48px', color: 'var(--error)' }}>error</span>
          <div>
            <h3 className="font-headline-md db-error-title" style={{ margin: 0 }}>Unable to load dashboard data</h3>
            <p className="font-body-md db-error-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--on-surface-variant)' }}>Please check your connection or try again later.</p>
          </div>
          <button onClick={() => fetchDashboardData()} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>refresh</span>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid-4 db-kpi-grid">
            {/* KPI 1 */}
            <div className="card db-kpi-card">
              <div className="db-kpi-header">
                <p className="font-label-sm db-kpi-title">Total Customers</p>
                <span className="material-symbols-outlined db-kpi-icon">group</span>
              </div>
              <div className="db-kpi-content">
                <h3 className="font-headline-lg db-kpi-value">
                  {loading ? (
                    <div className="skeleton skeleton-title db-kpi-skeleton-val"></div>
                  ) : (
                    stats.customers || 0
                  )}
                </h3>
                {loading ? (
                  <div className="skeleton skeleton-text db-kpi-skeleton-text"></div>
                ) : (
                  <p className="font-label-md db-kpi-live-tag">
                    <span className="material-symbols-outlined db-kpi-live-icon">sync</span>
                    Customer records synced
                  </p>
                )}
              </div>
            </div>

            {/* KPI 2 */}
            <div className="card db-kpi-card">
              <div className="db-kpi-header">
                <p className="font-label-sm db-kpi-title">Total Orders</p>
                <span className="material-symbols-outlined db-kpi-icon">shopping_cart</span>
              </div>
              <div className="db-kpi-content">
                <h3 className="font-headline-lg db-kpi-value">
                  {loading ? (
                    <div className="skeleton skeleton-title db-kpi-skeleton-val"></div>
                  ) : (
                    stats.orders || 0
                  )}
                </h3>
                {loading ? (
                  <div className="skeleton skeleton-text db-kpi-skeleton-text"></div>
                ) : (
                  <p className="font-label-md db-kpi-live-tag">
                    <span className="material-symbols-outlined db-kpi-live-icon">sync</span>
                    Order history synced
                  </p>
                )}
              </div>
            </div>

            {/* KPI 3 */}
            <div className="card db-kpi-card">
              <div className="db-kpi-header">
                <p className="font-label-sm db-kpi-title">Revenue</p>
                <span className="material-symbols-outlined db-kpi-icon">payments</span>
              </div>
              <div className="db-kpi-content">
                <h3 className="font-headline-lg db-kpi-value">
                  {loading ? (
                    <div className="skeleton skeleton-title db-kpi-skeleton-val-revenue"></div>
                  ) : (
                    stats.revenue ? `₹${stats.revenue.toLocaleString()}` : '₹0'
                  )}
                </h3>
                {loading ? (
                  <div className="skeleton skeleton-text db-kpi-skeleton-text"></div>
                ) : (
                  <p className="font-label-md db-kpi-live-tag">
                    <span className="material-symbols-outlined db-kpi-live-icon">payments</span>
                    Revenue updated from orders
                  </p>
                )}
              </div>
            </div>

            {/* KPI 4 */}
            <div className="card db-kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="db-kpi-card-glow-bg"></div>
              <div className="db-kpi-header">
                <p className="font-label-sm db-kpi-title">Active Campaigns</p>
                <span className="material-symbols-outlined db-kpi-icon-active">campaign</span>
              </div>
              <div className="db-kpi-content">
                <h3 className="font-headline-lg db-kpi-value">
                  {loading ? (
                    <div className="skeleton skeleton-title db-kpi-skeleton-val"></div>
                  ) : (
                    stats.activeCampaigns || 0
                  )}
                </h3>
                {loading ? (
                  <div className="skeleton skeleton-text db-kpi-skeleton-text"></div>
                ) : (
                  <p className="font-label-md db-kpi-live-tag-secondary">
                    <span className="material-symbols-outlined db-kpi-live-icon">campaign</span>
                    Currently running campaigns
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid-bento" style={{ marginBottom: '24px' }}>
            {/* Upgraded Campaign Performance AreaChart */}
            <div className="card col-8 db-performance-card">
              <div className="db-chart-header">
                <div className="db-chart-header-left">
                  <h3 className="font-headline-md db-chart-title">Campaign Performance</h3>
                  <p className="db-chart-subtitle">Historical volume and analytics trend</p>
                </div>
                <div className="db-time-range-selector">
                  {['Last 7 Days', 'Last 30 Days', 'This Quarter'].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleTimeRangeChange(range)}
                      className={`btn-time-range ${timeRange === range ? 'active' : ''}`}
                      disabled={loading || demoDataLoading}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Metrics Row */}
              <div className="db-chart-summary-row">
                <div className="db-summary-metric">
                  <span className="db-summary-label">Total Sent</span>
                  <span className="db-summary-value">{(loading || analyticsLoading) ? '...' : (analyticsData?.summary?.sent || 0).toLocaleString()}</span>
                </div>
                <div className="db-summary-metric">
                  <span className="db-summary-label">Total Opened</span>
                  <span className="db-summary-value">{(loading || analyticsLoading) ? '...' : (analyticsData?.summary?.opened || 0).toLocaleString()}</span>
                </div>
                <div className="db-summary-metric">
                  <span className="db-summary-label">Total Converted</span>
                  <span className="db-summary-value">{(loading || analyticsLoading) ? '...' : (analyticsData?.summary?.converted || 0).toLocaleString()}</span>
                </div>
                <div className="db-summary-metric">
                  <span className="db-summary-label">Open Rate</span>
                  <span className="db-summary-value">{(loading || analyticsLoading) ? '...' : `${analyticsData?.summary?.openRate || 0}%`}</span>
                </div>
                <div className="db-summary-metric">
                  <span className="db-summary-label">Conversion Rate</span>
                  <span className="db-summary-value">{(loading || analyticsLoading) ? '...' : `${analyticsData?.summary?.conversionRate || 0}%`}</span>
                </div>
              </div>

              {/* Area Chart Container */}
              <div className="db-chart-container-wrapper">
                {(loading || analyticsLoading) ? (
                  <div className="skeleton db-chart-skeleton"></div>
                ) : lineChartData.length === 0 ? (
                  <div className="db-chart-empty-state">
                    <span className="material-symbols-outlined db-empty-state-icon">stacked_line_chart</span>
                    <p className="db-empty-state-title">No campaign performance data available.</p>
                    <p className="db-empty-state-desc">Generate Demo Data or launch campaigns to start tracking engagement.</p>
                    <button 
                      onClick={handleGenerateDemoData} 
                      className="btn btn-primary db-empty-state-btn"
                      disabled={demoDataLoading}
                    >
                      <span className="material-symbols-outlined">database</span>
                      Generate Demo Data
                    </button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={lineChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" opacity={0.3} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--outline)', fontSize: 10, fontWeight: 500 }} 
                        dy={8}
                      />
                      {/* Left YAxis for Sent and Opened */}
                      <YAxis 
                        yAxisId="left" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--outline)', fontSize: 10, fontWeight: 500 }} 
                        dx={-8}
                      />
                      {/* Right YAxis for Converted to keep it highly visible */}
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--outline)', fontSize: 10, fontWeight: 500 }} 
                        dx={8}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <RechartsLegend 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)', marginTop: '10px' }} 
                      />
                      <Area 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="sent" 
                        name="Sent" 
                        stroke="var(--primary)" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        animationDuration={800}
                        fillOpacity={1} 
                        fill="url(#colorSent)" 
                      />
                      <Area 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="opened" 
                        name="Opened" 
                        stroke="var(--secondary)" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        animationDuration={800}
                        fillOpacity={1} 
                        fill="url(#colorOpened)" 
                      />
                      <Area 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="converted" 
                        name="Converted" 
                        stroke="#eab308" 
                        strokeWidth={2.5} 
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        animationDuration={800}
                        fillOpacity={1} 
                        fill="url(#colorConverted)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Insights Horizontal Bar */}
              {!(loading || analyticsLoading) && lineChartData.length > 0 && (
                <div className="db-chart-insights-bar">
                  <div className="db-insight-item">
                    <span className="material-symbols-outlined db-insight-icon">trending_up</span>
                    <div>
                      <span className="db-insight-label">Best Channel</span>
                      <span className="db-insight-value">{insights.bestChannel}</span>
                    </div>
                  </div>
                  <div className="db-insight-item">
                    <span className="material-symbols-outlined db-insight-icon">mail_lock</span>
                    <div>
                      <span className="db-insight-label">Peak Open Rate</span>
                      <span className="db-insight-value">{insights.highestOpenDay}</span>
                    </div>
                  </div>
                  <div className="db-insight-item">
                    <span className="material-symbols-outlined db-insight-icon">check_circle</span>
                    <div>
                      <span className="db-insight-label">Peak Conversion</span>
                      <span className="db-insight-value">{insights.highestConvDay}</span>
                    </div>
                  </div>
                  <div className="db-insight-item">
                    <span className="material-symbols-outlined db-insight-icon">database</span>
                    <div>
                      <span className="db-insight-label">Total Volume</span>
                      <span className="db-insight-value">{insights.totalVolume}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Recharts Pie Chart */}
            <div className="card col-4 db-breakdown-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="db-chart-header" style={{ marginBottom: '16px' }}>
                <h3 className="font-headline-md db-chart-title">Channel Breakdown</h3>
              </div>

              {(loading || analyticsLoading) ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="skeleton" style={{ width: '100%', height: '54px', borderRadius: 'var(--radius-md)' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '50%' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-md)' }}></div>
                </div>
              ) : totalVolume === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="db-chart-empty-state">
                    <span className="material-symbols-outlined db-empty-state-icon">pie_chart</span>
                    <p className="db-empty-state-title">No delivery data available.</p>
                    <p className="db-empty-state-desc">Send campaigns to view channel performance.</p>
                  </div>
                </div>
              ) : (
                <div className="db-breakdown-content">
                  {/* Top Stats Grid */}
                  <div className="db-breakdown-stats-grid">
                    <div className="db-breakdown-stat-box">
                      <span className="db-breakdown-stat-label">Total Messages Sent</span>
                      <span className="db-breakdown-stat-val">{totalVolume.toLocaleString()}</span>
                    </div>
                    <div className="db-breakdown-stat-box">
                      <span className="db-breakdown-stat-label">🏆 Top Channel</span>
                      <span className="db-breakdown-stat-val primary-text">
                        {bestChannelName} ({bestChannelPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Donut Chart Container */}
                  <div className="db-donut-chart-wrapper">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="db-donut-center-label">
                      <span className="db-donut-center-val">{bestChannelPct}%</span>
                      <span className="db-donut-center-lbl">Top Share</span>
                    </div>
                  </div>

                  {/* Channel List statistics */}
                  <div className="db-breakdown-list">
                    {pieData.map((item, index) => (
                      <div key={index} className="db-breakdown-list-item">
                        <div className="db-breakdown-list-left">
                          <span className="db-breakdown-list-color" style={{ backgroundColor: item.color }}></span>
                          <span className="db-breakdown-list-name">{item.name}</span>
                        </div>
                        <span className="db-breakdown-list-value">
                          {item.value.toLocaleString()} messages ({Math.round((item.value / totalVolume) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* AI Insight Box */}
                  <div className="db-breakdown-insight-box">
                    <div className="db-breakdown-insight-header">
                      <span className="material-symbols-outlined db-breakdown-insight-icon">auto_awesome</span>
                      <span className="db-breakdown-insight-title">AI Insight</span>
                    </div>
                    <p className="db-breakdown-insight-text">
                      {aiInsightText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Campaigns and AI Recommendations Row */}
          <div className="grid-bento">
            {/* Table of Recent Campaigns */}
            <div className="card col-8 db-table-card">
              <div className="db-table-header">
                <h3 className="font-headline-md db-table-title">Recent Campaigns</h3>
                <Link to="/campaigns" className="db-table-link">View All</Link>
              </div>
              <div className="table-container db-table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Campaign Name</th>
                      <th>Status</th>
                      <th>Segment</th>
                      <th>Channel</th>
                      <th>Engagement</th>
                      <th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={`skel-${i}`}>
                          <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '60px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '60px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '40px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '40px' }}></div></td>
                        </tr>
                      ))
                    ) : recentCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="db-td-empty">
                          <div className="db-empty-state-wrapper">
                            <span className="material-symbols-outlined db-empty-state-icon">campaign</span>
                            <p className="db-empty-state-title">No campaigns found.</p>
                            <p className="db-empty-state-desc">Create a campaign to start tracking performance.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recentCampaigns.map((camp) => (
                        <tr key={camp._id} style={{ cursor: 'pointer' }} onClick={() => navigate(camp.status === 'Draft' ? `/campaign-review/${camp._id}` : '/analytics')}>
                          <td className="db-td-name">{camp.name}</td>
                          <td>
                            <span className={`badge ${
                              camp.status === 'Active' ? 'badge-primary' : 
                              camp.status === 'Completed' ? 'badge-success' : 'badge-neutral'
                            }`}>
                              {camp.status}
                            </span>
                          </td>
                          <td>{camp.targetSegment}</td>
                          <td>{camp.channel}</td>
                          <td className="db-td-val">{camp.engagement > 0 ? `${camp.engagement}%` : '-'}</td>
                          <td className="db-td-val">{camp.conversion > 0 ? `${camp.conversion}%` : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Recommendations Column */}
            <div className="card col-4 db-recs-card">
              <div className="db-recs-bg-icon-container">
                <span className="material-symbols-outlined db-recs-bg-icon">psychology</span>
              </div>
              <div className="db-recs-header">
                <span className="material-symbols-outlined db-recs-header-icon">auto_awesome</span>
                <h3 className="font-headline-md db-recs-header-title">AI Recommendations</h3>
              </div>
              <div className="db-recs-list">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <div 
                      key={rec.id || index} 
                      className={`card ${index === 0 ? 'ai-glow' : ''} db-rec-item`}
                    >
                      <p className={`font-label-md db-rec-title ${index === 0 ? 'highlight' : 'normal'}`}>
                        {rec.title}
                      </p>
                      <p className="font-body-md db-rec-desc">
                        {rec.description}
                      </p>
                      {rec.actionType === 'apply' ? (
                        <button 
                          onClick={() => applyRecommendation(rec)} 
                          className="btn btn-secondary db-rec-btn"
                          disabled={loading}
                        >
                          {rec.actionText}
                        </button>
                      ) : (
                        <Link to={rec.linkUrl || '/segment-builder'} className="btn btn-secondary db-rec-btn">
                          {rec.actionText}
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="db-recs-empty">
                    <span className="material-symbols-outlined db-recs-empty-icon">psychology</span>
                    <p className="db-recs-empty-title">No recommendations available yet.</p>
                    <p className="db-recs-empty-desc">
                      Launch campaigns and collect engagement data to unlock AI-powered optimization suggestions.
                    </p>
                    <div className="db-recs-empty-list">
                      <p className="db-recs-empty-list-title">Recommendations will include:</p>
                      <ul>
                        <li>• Best send times</li>
                        <li>• High-performing audience segments</li>
                        <li>• Channel performance insights</li>
                        <li>• Conversion improvement opportunities</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
