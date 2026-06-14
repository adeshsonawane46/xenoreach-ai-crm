import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { jsPDF } from 'jspdf';
import '../styles/AIInsights.css';


const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};


const AIInsights = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFixModal, setShowFixModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [campaignsRes, customersRes, ordersRes, analyticsRes] = await Promise.all([
        api.getCampaigns(),
        api.getCustomers(),
        api.getOrders(),
        api.getAnalytics()
      ]);

      setCampaigns(campaignsRes.data || []);
      setCustomers(customersRes.data || []);
      setOrders(ordersRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error('Error fetching AI insights data:', err);
      setError('Unable to load AI Insights data. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Core Derived Lists & Stats
  const campaignsList = campaigns || [];
  const customersList = customers || [];
  const ordersList = orders || [];
  const summary = analytics?.summary || { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, deliveryRate: 0, openRate: 0, ctr: 0, conversionRate: 0 };
  const channelBreakdown = analytics?.channelBreakdown || {};

  // 2. Determine Top Performing Channel
  const channelsList = ['Email', 'WhatsApp', 'SMS', 'Push'];
  let topChannel = 'Email';
  let maxChannelMetric = -1;
  channelsList.forEach(ch => {
    const chData = channelBreakdown?.[ch];
    if (chData && chData.sent > 0) {
      const metric = chData.conversionRate * 1000 + chData.openRate;
      if (metric > maxChannelMetric) {
        maxChannelMetric = metric;
        topChannel = ch;
      }
    }
  });

  // 3. Determine Top Segment (based on conversion rate on campaigns, fallback to count)
  const segments = [...new Set(campaignsList.filter(c => c.status !== 'Draft').map(c => c.targetSegment))];
  let topSegment = 'High Value';
  let maxSegMetric = -1;
  segments.forEach(seg => {
    const segCampaigns = campaignsList.filter(c => c.targetSegment === seg && c.status !== 'Draft');
    if (segCampaigns.length > 0) {
      const avgConv = segCampaigns.reduce((sum, c) => sum + (c.conversion || 0), 0) / segCampaigns.length;
      const avgEng = segCampaigns.reduce((sum, c) => sum + (c.engagement || 0), 0) / segCampaigns.length;
      const metric = avgConv * 1000 + avgEng;
      if (metric > maxSegMetric) {
        maxSegMetric = metric;
        topSegment = seg;
      }
    }
  });

  // Fallback if no campaigns have run: pick segment with largest customer count
  if (segments.length === 0 && customersList.length > 0) {
    const counts = {};
    customersList.forEach(c => {
      counts[c.segment] = (counts[c.segment] || 0) + 1;
    });
    let maxCount = -1;
    Object.entries(counts).forEach(([seg, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSegment = seg;
      }
    });
  }

  const topSegCount = customersList.filter(c => c.segment === topSegment).length;
  const topSegPct = customersList.length > 0 ? ((topSegCount / customersList.length) * 100).toFixed(1) : '0';
  const topSegCustomers = customersList.filter(c => c.segment === topSegment);
  const avgLtv = topSegCustomers.length > 0
    ? Math.round(topSegCustomers.reduce((sum, c) => sum + (c.ltv || 0), 0) / topSegCustomers.length)
    : 0;

  // 4. Calculate active count & reached count
  const activeCount = campaignsList.filter(c => c.status === 'Active').length;
  const totalReached = campaignsList.reduce((sum, c) => sum + (c.audienceSize || 0), 0);

  // 5. Executive Summary & Dynamic Send Time Calculation
  const topChannelStats = channelBreakdown?.[topChannel] || { openRate: 0, conversionRate: 0, sent: 0 };
  const completedCampaigns = campaignsList.filter(c => c.status === 'Completed' || c.status === 'Active');

  let optimalTimeStr = '10:00 AM';
  let optimalDaysStr = 'Weekdays';

  if (completedCampaigns.length > 0) {
    const bestCampaign = completedCampaigns.reduce((prev, current) => {
      return (current.engagement || 0) > (prev.engagement || 0) ? current : prev;
    }, completedCampaigns[0]);

    if (bestCampaign.optimalTime) {
      const parts = bestCampaign.optimalTime.split(', ');
      if (parts.length === 2) {
        optimalDaysStr = parts[0] + 's';
        optimalTimeStr = parts[1];
      } else {
        optimalTimeStr = bestCampaign.optimalTime;
        optimalDaysStr = 'Selected Days';
      }
    }
  } else {
    const fallbacks = {
      Email: { time: '9:30 AM', days: 'Tuesdays & Thursdays' },
      WhatsApp: { time: '2:00 PM', days: 'Wednesdays & Saturdays' },
      SMS: { time: '5:30 PM', days: 'Mondays & Fridays' },
      Push: { time: '7:00 PM', days: 'Weekdays' }
    };
    const fb = fallbacks[topChannel] || fallbacks.Email;
    optimalTimeStr = fb.time;
    optimalDaysStr = fb.days;
  }
  const optimalSendTime = { time: optimalTimeStr, days: optimalDaysStr };

  // 7. Funnel Velocity
  let totalDiffMs = 0;
  let conversionCount = 0;
  campaignsList.forEach(camp => {
    if (camp.status === 'Draft') return;
    const campDate = new Date(camp.createdAt);
    const matchingOrders = ordersList.filter(order => {
      const orderDate = new Date(order.date);
      const isAfter = orderDate >= campDate;
      const customerObj = customersList.find(c => c.email === order.customerEmail);
      const matchesSegment = customerObj && (camp.targetSegment === 'All' || customerObj.segment === camp.targetSegment);
      return isAfter && matchesSegment;
    });
    matchingOrders.forEach(order => {
      const orderDate = new Date(order.date);
      const diffMs = orderDate - campDate;
      if (diffMs > 0 && diffMs < 30 * 24 * 60 * 60 * 1000) {
        totalDiffMs += diffMs;
        conversionCount++;
      }
    });
  });
  const avgDays = conversionCount > 0 ? (totalDiffMs / (24 * 60 * 60 * 1000) / conversionCount).toFixed(1) : null;

  // 8. Lowest Performing Channel
  let lowestChannel = 'Email';
  let minChannelMetric = 999999;
  channelsList.forEach(ch => {
    const chData = channelBreakdown?.[ch];
    if (chData && chData.sent > 0) {
      const metric = chData.conversionRate * 1000 + chData.openRate;
      if (metric < minChannelMetric) {
        minChannelMetric = metric;
        lowestChannel = ch;
      }
    }
  });

  // Dynamic Recommendation Strategy Generator based on actual performance metrics
  const getDynamicModalData = (channel) => {
    const chData = channelBreakdown?.[channel] || { sent: 0, openRate: 0, conversionRate: 0, clicked: 0, converted: 0 };
    const sentCount = chData.sent || 0;
    const openRate = chData.openRate || 0;
    const convRate = chData.conversionRate || 0;
    const clickRate = sentCount > 0 ? Number(((chData.clicked / sentCount) * 100).toFixed(1)) : 0;

    // Default fallbacks in case sentCount is 0
    if (sentCount === 0) {
      return {
        problem: `Insufficient performance logs for ${channel}`,
        recommendation: `Launch a campaign on ${channel} to collect engagement data. AI Insights will automatically optimize strategy.`,
        actions: [
          `Create a draft campaign in the campaign wizard targeting ${topSegment || 'VIP'}`,
          `Configure templates with customer first_name and discount codes`,
          `Set up delivery rules using multi-channel fallback structures`,
          `Schedule a test send to verify rendering across devices`
        ],
        channel: topChannel || 'Email',
        time: optimalTimeStr || '10:00 AM'
      };
    }

    let problem = '';
    let recommendation = '';
    let actions = [];

    if (channel === 'Email') {
      if (openRate < 45) {
        problem = `Low Email Open Rate (${openRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `Improve open rate from ${openRate}% by writing shorter, action-oriented subject lines and refining sender reputation.`;
        actions = [
          'Keep subject lines under 40 characters to avoid mobile clipping',
          'Avoid spam trigger words (e.g. "Free", "Guaranteed", "Cash") in headers',
          `Schedule sends at ${optimalTimeStr} on ${optimalDaysStr} when users are active`,
          `Set up fallback WhatsApp notifications to unengaged email segments`
        ];
      } else if (clickRate < 15) {
        problem = `Low Email Click-Through Rate (CTR: ${clickRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `Increase click-through rate from ${clickRate}% by placing high-contrast CTA buttons above the fold and personalizing copy.`;
        actions = [
          'Implement a single, clear CTA button ("Get Started" or "Claim Offer")',
          'Use dynamic personalization tags (e.g., first name, last purchased category)',
          'Ensure the email template is fully responsive and loads under 2 seconds',
          'Use bulleted benefit lists instead of long paragraph blocks'
        ];
      } else {
        problem = `Email Conversion Bottleneck (Conversion Rate: ${convRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `Boost purchase conversion from ${convRate}% by matching email campaign messaging directly with custom landing pages.`;
        actions = [
          'Create dedicated product landing pages matching the email copy',
          'Include customer-specific discount codes with single-click checkout',
          'Add a sense of urgency (e.g. "Offer ends in 24 hours")',
          `Retarget clickers via ${topChannel} with a gentle reminders flow`
        ];
      }
    } else if (channel === 'WhatsApp') {
      if (openRate < 70) {
        problem = `Suboptimal WhatsApp Read Rate (${openRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `Increase read rates from ${openRate}% by personalizing sender name display and using interactive opt-in permissions.`;
        actions = [
          'Ensure business profile is officially verified and matches brand logo',
          'Add personalized greetings utilizing dynamic template parameters',
          'Optimize message timing based on local timezone engagement trends',
          'Cleanse contact list to remove invalid or inactive phone numbers'
        ];
      } else if (convRate < 5) {
        problem = `Low WhatsApp Conversion Rate (${convRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `WhatsApp has high readability but conversion is ${convRate}%. Simplify the offer and utilize interactive buttons.`;
        actions = [
          'Implement Quick Reply interactive buttons for immediate actions',
          'Limit WhatsApp text length to under 250 characters for readability',
          'Offer immediate incentives (e.g. coupon codes) directly inside the message',
          'Use WhatsApp only for high-value alerts; reserve general updates for Email'
        ];
      } else {
        problem = `WhatsApp High Opt-Out Risk (CTR: ${clickRate}% / Conversion: ${convRate}%)`;
        recommendation = `Maintain WhatsApp channel conversion health by keeping message frequency low and tailoring content segments.`;
        actions = [
          'Limit broadcast frequency to a maximum of 2 messages per week',
          `Directly target the highly responsive ${topSegment} audience segment`,
          'Ensure a clear and easy opt-out mechanism is available to reduce reports',
          'A/B test message templates between rich-text media and text-only formats'
        ];
      }
    } else if (channel === 'SMS') {
      if (clickRate < 8) {
        problem = `Low SMS CTR (Click-Through Rate: ${clickRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `SMS links are not generating clicks (${clickRate}%). Use branded short links and clear direct benefits.`;
        actions = [
          'Use a verified branded custom domain for all link URLs',
          'Start messages with a strong hook and personal name tag',
          'Keep message length strictly under 160 characters to avoid segment division',
          `Fallback to ${topChannel} messages for users who do not click SMS links`
        ];
      } else {
        problem = `Low SMS Conversion Rate (${convRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `Improve SMS ROI by linking directly to a streamlined checkout process instead of home pages.`;
        actions = [
          'Redirect users to a mobile-optimized cart with prepopulated customer data',
          'Keep value proposition clear (e.g., "Get 15% off using code CRM15")',
          'Avoid sending SMS during early morning or late night hours',
          'Align message scheduling with regional conversion activity statistics'
        ];
      }
    } else {
      if (openRate < 10) {
        problem = `Low Push Notification CTR (Open Rate: ${openRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `Increase push open rate from ${openRate}% using emoji cues, rich media cards, and behavioral triggers.`;
        actions = [
          'A/B test headline copy using active verbs and emojis',
          'Trigger push notifications immediately following customer actions (e.g. cart abandon)',
          'Limit push delivery frequency to 1 per day to avoid app uninstalls',
          'Incorporate product image previews in supported mobile notifications'
        ];
      } else {
        problem = `Low Push Notification Conversion Rate (${convRate}% across ${sentCount.toLocaleString()} messages)`;
        recommendation = `Drive checkout conversion from push alerts by using deep links that open specific product categories.`;
        actions = [
          'Implement deep linking directly to the product purchase checkout screen',
          'Personalize push copy with the last product page viewed by the contact',
          'Add single-click checkout buttons directly in the notification drawer',
          `Synergize push campaigns with email broadcasts targeting ${topSegment}`
        ];
      }
    }

    return {
      problem,
      recommendation,
      actions,
      channel: channel === 'Email' ? 'WhatsApp' : 'Email',
      time: optimalTimeStr
    };
  };

  const fixModalData = getDynamicModalData(lowestChannel);

  // Dynamic AI-Generated Executive Summary based on real campaign performance
  const generateAIExecutiveSummary = () => {
    if (campaignsList.length === 0) {
      return "No active campaigns found. Start launching campaigns to enable AI analytics.";
    }

    const totalSentVal = summary.sent || 0;
    const avgOpen = summary.openRate || 0;
    const avgConv = summary.conversionRate || 0;

    let insightsPara = `An analysis of the last 30 days of cross-channel campaign activity shows a total volume of ${totalSentVal.toLocaleString()} messages sent across ${campaignsList.length} campaigns. `;

    if (activeCount > 0) {
      insightsPara += `Currently, there ${activeCount === 1 ? 'is 1 campaign' : `are ${activeCount} campaigns`} actively running in the field. `;
    }

    insightsPara += `Overall customer engagement has stabilized with an average open rate of ${avgOpen}% and a purchase conversion rate of ${avgConv}%. `;

    if (topChannelStats.sent > 0) {
      insightsPara += `Xeno AI has identified ${topChannel} as your highest-performing channel, driven by a conversion rate of ${topChannelStats.conversionRate}% and an open rate of ${topChannelStats.openRate}%. `;
    }

    if (topSegment && topSegCount > 0) {
      insightsPara += `The ${topSegment} cohort shows the highest responsiveness, representing ${topSegPct}% of your synced customer base with an average LTV of ₹${avgLtv.toLocaleString()}. `;
    }

    if (avgDays) {
      insightsPara += `Our conversion funnel velocity is currently averaging ${avgDays} days from initial campaign touch to complete order fulfillment. `;
    } else {
      insightsPara += `Funnel velocity metrics are currently loading as we await more purchase conversion logs. `;
    }

    return insightsPara;
  };

  const execSummary = generateAIExecutiveSummary();

  // 9. Export PDF via jsPDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('XenoReach AI CRM', 20, 25);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Campaign Intelligence Report', 20, 32);

      // Date
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 130, 50);

      doc.setDrawColor(220, 220, 220);
      doc.line(20, 55, 190, 55);

      // Executive Summary
      doc.setTextColor(37, 0, 90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, 68);

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const splitSummary = doc.splitTextToSize(execSummary, 170);
      doc.text(splitSummary, 20, 76);

      const summaryHeight = splitSummary.length * 6;
      let currentY = 76 + summaryHeight + 15;

      // Statistics Table
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setTextColor(37, 0, 90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Campaign Statistics', 20, currentY);

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Total Campaigns: ${campaignsList.length}`, 20, currentY + 10);
      doc.text(`Active Campaigns: ${activeCount}`, 20, currentY + 17);
      doc.text(`Total Customers Reached: ${formatNumber(totalReached)}`, 20, currentY + 24);
      currentY = currentY + 24 + 15;

      // Channel Performance
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setTextColor(37, 0, 90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Channel Performance', 20, currentY);

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Channel', 20, currentY + 10);
      doc.text('Sent', 60, currentY + 10);
      doc.text('Open Rate', 95, currentY + 10);
      doc.text('Conversion Rate', 135, currentY + 10);

      doc.line(20, currentY + 12, 190, currentY + 12);

      doc.setFont('helvetica', 'normal');
      let rowY = currentY + 20;
      channelsList.forEach(ch => {
        const chData = channelBreakdown?.[ch] || { sent: 0, openRate: 0, conversionRate: 0 };
        doc.text(ch, 20, rowY);
        doc.text(chData.sent.toString(), 60, rowY);
        doc.text(chData.sent > 0 ? `${chData.openRate}%` : 'Not enough data', 95, rowY);
        doc.text(chData.sent > 0 ? `${chData.conversionRate}%` : 'Not enough data', 135, rowY);
        rowY += 8;
      });

      // Recommendations
      currentY = rowY + 15;
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setTextColor(37, 0, 90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('AI Recommendations', 20, currentY);

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Top Segment: ${topSegment} Customers (${topSegCount} contacts, ${topSegPct}%)`, 20, currentY + 10);
      doc.text(`Best Performing Channel: ${topChannel}`, 20, currentY + 17);
      doc.text(`Optimal Timing: ${optimalSendTime.time} (${optimalSendTime.days})`, 20, currentY + 24);
      doc.text(`Funnel Velocity: ${avgDays ? `${avgDays} Days` : 'Not enough data'}`, 20, currentY + 31);
      currentY = currentY + 31 + 15;

      // Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text('XenoReach Marketing CRM - Confidential Report', 20, 285);

      doc.save('XenoReach-AI-Insights-Report.pdf');
      showToast('✓ AI Insights PDF report downloaded successfully', 'success');
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr);
      showToast('Unable to generate PDF. Please try again.', 'error');
    }
  };

  // 10. Handle Loading Skeletons
  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="page-header">
          <div className="page-header-title">
            <div className="ai-header-meta">
              <span className="material-symbols-outlined text-secondary ai-header-meta-icon">psychology</span>
              <span className="font-label-sm ai-header-meta-label">Analyzing Data...</span>
            </div>
            <h2>Campaign Intelligence</h2>
          </div>
        </div>

        <div className="skeleton-insight skeleton-box summary"></div>

        <div className="grid-3">
          <div className="skeleton-insight skeleton-box card-height"></div>
          <div className="skeleton-insight skeleton-box card-height"></div>
          <div className="skeleton-insight skeleton-box card-height"></div>
        </div>
      </div>
    );
  }

  // 11. Handle Errors
  if (error) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="page-header">
          <div className="page-header-title">
            <h2>Campaign Intelligence</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px', gap: '16px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)' }}>error</span>
          <div>
            <h3 className="font-headline-md">{error}</h3>
            <p style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>We were unable to connect to the marketing metrics database.</p>
          </div>
          <button onClick={fetchData} className="btn btn-primary">
            <span className="material-symbols-outlined">refresh</span>
            Retry API Load
          </button>
        </div>
      </div>
    );
  }

  // 12. Handle Empty Campaigns State
  if (campaignsList.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <div className="page-header-title">
            <div className="ai-header-meta">
              <span className="material-symbols-outlined text-secondary ai-header-meta-icon">psychology</span>
              <span className="font-label-sm ai-header-meta-label">No campaign records</span>
            </div>
            <h2>Campaign Intelligence</h2>
          </div>
        </div>
        <div className="ai-empty-container">
          <span className="material-symbols-outlined ai-empty-icon">analytics</span>
          <h3 className="font-headline-md ai-empty-title">No campaigns found</h3>
          <p className="ai-empty-desc">
            No AI insights available yet. Launch campaigns and collect engagement data to generate AI-powered recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title">
          <div className="ai-header-meta">
            <span className="material-symbols-outlined text-secondary ai-header-meta-icon">psychology</span>
            <span className="font-label-sm ai-header-meta-label">Data-Driven Insights</span>
          </div>
          <h2>Campaign Intelligence</h2>
          <p>Analysis based on the last 30 days of cross-channel marketing activity.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={handleExportPDF} className="btn btn-secondary">
            <span className="material-symbols-outlined ai-action-icon">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* AI Executive Summary Card */}
      <div className="card ai-summary-card">
        <div className="ai-summary-header">
          <div className="ai-summary-blur-circle"></div>

          <div className="ai-glow-elevation ai-summary-icon-box">
            <span className="material-symbols-outlined ai-summary-icon">auto_awesome</span>
          </div>

          <div className="ai-summary-content">
            <h3 className="font-headline-md ai-summary-title">Executive Summary</h3>
            <p className="font-body-lg ai-summary-text">
              {execSummary}
            </p>
          </div>
        </div>

        {/* Bento columns inside Summary */}
        <div className="grid-3">
          <div className="ai-bento-item">
            <span className="font-label-sm ai-bento-label">Key Opportunity</span>
            <h4 className="font-headline-md ai-bento-title">Audience Pivot</h4>
            <p className="ai-bento-desc">
              Focus campaigns on the <strong>{topSegment}</strong> segment using <strong>{topChannel}</strong> for optimal outcomes.
            </p>
          </div>

          <div className="ai-bento-item">
            <span className="font-label-sm ai-bento-label">Primary Metric</span>
            <h4 className="font-headline-md ai-bento-title">{topChannel} Leads</h4>
            <p className="ai-bento-desc">
              Your best channel is achieving <strong>{topChannelStats.conversionRate}%</strong> conversion with active automation.
            </p>
          </div>

          <div className="ai-bento-action-box">
            <span className="font-label-sm ai-bento-action-label">Suggested Action</span>
            <button onClick={() => setShowFixModal(true)} className="btn btn-ai ai-pulse ai-bento-action-btn">
              View Optimization Plan
              <span className="material-symbols-outlined ai-bento-action-btn-icon">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Bento Grid */}
      <div className="grid-3">
        {/* Top Performing Audience Card */}
        <div className="card ai-card-flex">
          <div className="ai-card-header">
            <h3 className="font-headline-md ai-card-title">Top Audience</h3>
            <span className="material-symbols-outlined ai-card-icon">group</span>
          </div>

          <div className="ai-circle-progress-container">
            <div className="ai-circle-progress">
              <div className="ai-circle-inner-content">
                <span className="ai-circle-percentage">{topSegPct}%</span>
                <span className="ai-circle-label">of Customer Base</span>
              </div>
            </div>
          </div>

          <div className="ai-card-audience-details">
            <h4 className="ai-card-footer-title">{topSegment} Customers</h4>
            <p className="ai-card-footer-desc">
              <strong>{topSegCount}</strong> customers belong to this segment, representing <strong>{topSegPct}%</strong> of your customer base.
            </p>
            <div className="ai-card-footer-badges">
              <span className="badge badge-neutral">LTV: ₹{avgLtv.toLocaleString()}</span>
              <span className="badge badge-neutral">Top Segment</span>
              <span className="badge badge-neutral">{topSegment}</span>
            </div>
            <p className="ai-audience-insight-text">
              <span className="material-symbols-outlined ai-audience-insight-icon">trending_up</span>
              Highest engagement and conversion performance among all customer segments.
            </p>
          </div>
        </div>

        {/* Channel ROI Card */}
        <div className="card ai-card-flex">
          <div className="ai-card-header">
            <h3 className="font-headline-md ai-card-title">Channel ROI</h3>
            <span className="material-symbols-outlined ai-card-icon">stacked_bar_chart</span>
          </div>

          <div className="ai-roi-list">
            {/* WhatsApp */}
            <div className="ai-roi-item">
              <div className="ai-roi-row">
                <span className="ai-roi-label">WhatsApp</span>
                <span className="ai-roi-val">
                  {channelBreakdown?.WhatsApp?.sent > 0
                    ? `${channelBreakdown.WhatsApp.conversionRate}% conversion (${channelBreakdown.WhatsApp.sent.toLocaleString()} sent)`
                    : 'Insufficient data'}
                </span>
              </div>
              <div className="ai-roi-bar-bg">
                <div
                  className="ai-roi-bar-fill whatsapp"
                  style={{ width: channelBreakdown?.WhatsApp?.sent > 0 ? `${Math.min(channelBreakdown.WhatsApp.conversionRate, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>

            {/* Email */}
            <div className="ai-roi-item">
              <div className="ai-roi-row">
                <span className="ai-roi-label">Email</span>
                <span className="ai-roi-val">
                  {channelBreakdown?.Email?.sent > 0
                    ? `${channelBreakdown.Email.conversionRate}% conversion (${channelBreakdown.Email.sent.toLocaleString()} sent)`
                    : 'Insufficient data'}
                </span>
              </div>
              <div className="ai-roi-bar-bg">
                <div
                  className="ai-roi-bar-fill email"
                  style={{ width: channelBreakdown?.Email?.sent > 0 ? `${Math.min(channelBreakdown.Email.conversionRate, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>

            {/* SMS */}
            <div className="ai-roi-item">
              <div className="ai-roi-row">
                <span className="ai-roi-label">SMS Text</span>
                <span className="ai-roi-val">
                  {channelBreakdown?.SMS?.sent > 0
                    ? `${channelBreakdown.SMS.conversionRate}% conversion (${channelBreakdown.SMS.sent.toLocaleString()} sent)`
                    : 'Insufficient data'}
                </span>
              </div>
              <div className="ai-roi-bar-bg">
                <div
                  className="ai-roi-bar-fill sms"
                  style={{ width: channelBreakdown?.SMS?.sent > 0 ? `${Math.min(channelBreakdown.SMS.conversionRate, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          <div className="ai-roi-footer-box">
            <p className="ai-roi-footer-text">
              <span className="material-symbols-outlined ai-roi-footer-icon">lightbulb</span>
              Focus more budget allocation towards {topChannel} campaigns to maximize direct conversion velocity.
            </p>
          </div>
        </div>

        {/* Time and Funnel Velocity */}
        <div className="ai-col-flex">
          {/* Time Card */}
          <div className="card ai-time-card">
            <div className="ai-time-card-bg-icon">
              <span className="material-symbols-outlined ai-time-card-bg-icon-sym">schedule</span>
            </div>
            <div className="ai-time-card-content">
              <span className="font-label-sm ai-time-card-label">Optimal Send Time</span>
              <h4 className="ai-time-card-val">{optimalSendTime.time}</h4>
              <p className="ai-time-card-subtext">{optimalSendTime.days}</p>
            </div>
          </div>

          {/* Funnel Velocity Card */}
          <div className="card ai-velocity-card">
            <span className="font-label-sm ai-velocity-card-label">Funnel Velocity</span>
            <div className="ai-velocity-card-row">
              <h4 className="ai-velocity-card-val" style={{ fontSize: avgDays ? '32px' : '15px', fontWeight: '700' }}>
                {avgDays ? `${avgDays} Days` : 'Insufficient conversion data'}
              </h4>
              {avgDays && (
                <span className="badge badge-secondary ai-velocity-card-badge">
                  <span className="material-symbols-outlined ai-velocity-card-badge-icon">trending_down</span>
                  Calculated
                </span>
              )}
            </div>
            <p className="ai-velocity-card-subtext">
              {avgDays
                ? 'Average duration from first touch to checkout conversion.'
                : 'Not enough data to calculate funnel velocity.'}
            </p>
          </div>
        </div>
      </div>

      {/* --- GENERATE FIX SEQUENCE REACT MODAL --- */}
      {showFixModal && (
        <div className="ai-modal-overlay" onClick={() => setShowFixModal(false)}>
          <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h3>
                <span className="material-symbols-outlined ai-modal-header-icon">auto_awesome</span>
                AI Fix Sequence Strategy
              </h3>
              <button className="ai-modal-close-btn" onClick={() => setShowFixModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="ai-modal-body">
              <div className="ai-modal-problem-box">
                <div className="ai-modal-section-title">Detected Issue</div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>
                  {fixModalData.problem}
                </p>
              </div>

              <div>
                <div className="ai-modal-section-title">AI Recommendation</div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                  {fixModalData.recommendation}
                </p>
              </div>

              <div>
                <div className="ai-modal-section-title">Suggested Actions</div>
                <ul className="ai-modal-list">
                  {fixModalData.actions.map((act, index) => (
                    <li key={index} style={{ fontSize: '13px' }}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="ai-modal-meta-row">
                <div className="ai-modal-meta-item">
                  <div className="ai-modal-meta-label">Recommended Channel</div>
                  <div className="ai-modal-meta-val">{fixModalData.channel}</div>
                </div>
                <div className="ai-modal-meta-item">
                  <div className="ai-modal-meta-label">Suggested Send Time</div>
                  <div className="ai-modal-meta-val">{fixModalData.time}</div>
                </div>
              </div>
            </div>

            <div className="ai-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFixModal(false)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowFixModal(false);
                  navigate('/campaign-wizard');
                }}
              >
                Apply Recommendation
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`ai-toast toast-${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <div>
            <p className="toast-message" style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
