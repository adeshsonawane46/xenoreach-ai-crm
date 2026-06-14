import Customer from '../models/Customer.js';
import CommunicationLog from '../models/CommunicationLog.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = [];

    // 1. WIN-BACK OPPORTUNITY
    const inactiveDays = 60;
    const inactiveThreshold = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
    const inactiveCount = await Customer.countDocuments({
      lastPurchaseDate: { $lt: inactiveThreshold }
    });

    if (inactiveCount > 0) {
      recommendations.push({
        id: 'win-back',
        title: 'Win Back Inactive Customers',
        description: `${inactiveCount} customers have not purchased in over 60 days.`,
        actionText: 'Create Campaign',
        actionType: 'link',
        linkUrl: '/campaign-wizard'
      });
    }

    // 2. HIGH VALUE CUSTOMER SEGMENT
    const vipThreshold = 10000;
    const highValueCount = await Customer.countDocuments({
      totalSpend: { $gt: vipThreshold }
    });

    if (highValueCount > 0) {
      recommendations.push({
        id: 'vip-opt',
        title: 'VIP Customer Opportunity',
        description: `${highValueCount} customers spent more than ₹10,000 recently.`,
        actionText: 'Create Segment',
        actionType: 'link',
        linkUrl: '/segment-builder'
      });
    }

    // Load communication logs for analytics-driven insights
    const allLogs = await CommunicationLog.find({});
    
    if (allLogs.length > 0) {
      // 3. EMAIL PERFORMANCE ISSUE
      const emailLogs = allLogs.filter(l => l.channel === 'Email');
      const emailSent = emailLogs.length;
      if (emailSent > 0) {
        const emailOpened = emailLogs.filter(l => 
          ['OPENED', 'READ', 'CLICKED', 'CONVERTED'].includes(l.status)
        ).length;
        const emailOpenRate = (emailOpened / emailSent) * 100;
        
        // Benchmark is e.g. 35% open rate
        if (emailOpenRate < 35.0) {
          recommendations.push({
            id: 'email-opt',
            title: 'Optimize Email Campaigns',
            description: `Email open rate is below expected benchmark.`,
            actionText: 'View Analytics',
            actionType: 'link',
            linkUrl: '/analytics'
          });
        }
      }

      // 4. CHANNEL PERFORMANCE INSIGHT (WhatsApp vs Email conversion comparison)
      const waLogs = allLogs.filter(l => l.channel === 'WhatsApp');
      const waSent = waLogs.length;
      if (waSent > 0 && emailSent > 0) {
        const waConverted = waLogs.filter(l => l.status === 'CONVERTED').length;
        const emailConverted = emailLogs.filter(l => l.status === 'CONVERTED').length;
        
        const waConvRate = (waConverted / waSent) * 100;
        const emailConvRate = (emailConverted / emailSent) * 100;

        if (waConvRate > emailConvRate) {
          recommendations.push({
            id: 'channel-opt',
            title: 'Increase WhatsApp Usage',
            description: `WhatsApp campaigns are converting better than Email campaigns.`,
            actionText: 'View Analytics',
            actionType: 'link',
            linkUrl: '/analytics'
          });
        }
      }

      // 5. CONVERSION IMPROVEMENT
      const clicked = allLogs.filter(l => 
        ['CLICKED', 'CONVERTED'].includes(l.status)
      ).length;
      const converted = allLogs.filter(l => l.status === 'CONVERTED').length;
      
      const ctr = (clicked / allLogs.length) * 100;
      const conversionRate = (converted / allLogs.length) * 100;

      // High CTR but low conversion (interest exists but conversion barrier is present)
      if (ctr > 8.0 && conversionRate < 4.0) {
        recommendations.push({
          id: 'funnel-opt',
          title: 'Improve Conversion Funnel',
          description: `Customers are clicking campaigns but not converting.`,
          actionText: 'Review Campaigns',
          actionType: 'link',
          linkUrl: '/campaigns'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};
