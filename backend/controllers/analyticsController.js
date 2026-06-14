import CommunicationLog from '../models/CommunicationLog.js';
import Campaign from '../models/Campaign.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || req.query.timeRange;

    let dateLimit = new Date();
    let numDays = 30; // default

    if (range === 'Last 7 Days') {
      dateLimit.setDate(dateLimit.getDate() - 7);
      numDays = 7;
    } else if (range === 'Last 30 Days') {
      dateLimit.setDate(dateLimit.getDate() - 30);
      numDays = 30;
    } else if (range === 'This Quarter') {
      const quarterStartMonth = Math.floor(dateLimit.getMonth() / 3) * 3;
      dateLimit = new Date(dateLimit.getFullYear(), quarterStartMonth, 1);
      const diffTime = Math.abs(new Date() - dateLimit);
      numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // default fallback to last 30 days
      dateLimit.setDate(dateLimit.getDate() - 30);
      numDays = 30;
    }

    const allLogs = await CommunicationLog.find({
      createdAt: { $gte: dateLimit }
    });

    const sent = allLogs.length;

    const deliveredLogs = allLogs.filter(l => 
      ['DELIVERED', 'OPENED', 'READ', 'CLICKED', 'CONVERTED'].includes(l.status)
    );
    const delivered = deliveredLogs.length;

    const openedLogs = allLogs.filter(l => 
      ['OPENED', 'READ', 'CLICKED', 'CONVERTED'].includes(l.status)
    );
    const opened = openedLogs.length;

    const clickedLogs = allLogs.filter(l => 
      ['CLICKED', 'CONVERTED'].includes(l.status)
    );
    const clicked = clickedLogs.length;

    const convertedLogs = allLogs.filter(l => l.status === 'CONVERTED');
    const converted = convertedLogs.length;

    // Rates in %
    const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0;
    const openRate = sent > 0 ? Number(((opened / sent) * 100).toFixed(1)) : 0;
    const ctr = sent > 0 ? Number(((clicked / sent) * 100).toFixed(1)) : 0;
    const conversionRate = sent > 0 ? Number(((converted / sent) * 100).toFixed(1)) : 0;

    // Channel breakdown
    const channels = ['Email', 'WhatsApp', 'SMS', 'Push'];
    const channelBreakdown = {};
    channels.forEach(ch => {
      const chLogs = allLogs.filter(l => l.channel === ch);
      const chSent = chLogs.length;
      const chDelivered = chLogs.filter(l => ['DELIVERED', 'OPENED', 'READ', 'CLICKED', 'CONVERTED'].includes(l.status)).length;
      const chOpened = chLogs.filter(l => ['OPENED', 'READ', 'CLICKED', 'CONVERTED'].includes(l.status)).length;
      const chClicked = chLogs.filter(l => ['CLICKED', 'CONVERTED'].includes(l.status)).length;
      const chConverted = chLogs.filter(l => l.status === 'CONVERTED').length;
      
      channelBreakdown[ch] = {
        sent: chSent,
        delivered: chDelivered,
        opened: chOpened,
        clicked: chClicked,
        converted: chConverted,
        openRate: chSent > 0 ? Number(((chOpened / chSent) * 100).toFixed(1)) : 0,
        conversionRate: chSent > 0 ? Number(((chConverted / chSent) * 100).toFixed(1)) : 0
      };
    });

    // Daily activity for the last numDays days
    const dailyActivity = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Seed default daily activity for last numDays days
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      
      let label = dayName;
      if (numDays > 7) {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      dailyActivity.push({
        day: label,
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        dateString: d.toDateString()
      });
    }

    // Populate daily counts
    allLogs.forEach(log => {
      const logDate = new Date(log.createdAt).toDateString();
      const match = dailyActivity.find(day => day.dateString === logDate);
      if (match) {
        match.sent += 1;
        if (['OPENED', 'READ', 'CLICKED', 'CONVERTED'].includes(log.status)) {
          match.opened += 1;
        }
        if (['CLICKED', 'CONVERTED'].includes(log.status)) {
          match.clicked += 1;
        }
        if (log.status === 'CONVERTED') {
          match.converted += 1;
        }
      }
    });

    // Clean date strings before returning
    const cleanedDailyActivity = dailyActivity.map(({ day, sent, opened, clicked, converted }) => ({
      day,
      sent,
      opened,
      clicked,
      converted
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          sent,
          delivered,
          opened,
          clicked,
          converted,
          deliveryRate,
          openRate,
          ctr,
          conversionRate
        },
        channelBreakdown,
        dailyActivity: cleanedDailyActivity
      }
    });
  } catch (error) {
    next(error);
  }
};
