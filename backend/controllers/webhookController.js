import CommunicationLog from '../models/CommunicationLog.js';
import Campaign from '../models/Campaign.js';

// POST /api/webhooks/channel
export const handleChannelWebhook = async (req, res, next) => {
  try {
    const { campaignId, customerId, recipient, channel, status, timestamp } = req.body;

    if (!campaignId || !customerId || !status) {
      return res.status(400).json({ success: false, message: 'Missing campaignId, customerId, or status' });
    }

    console.log(`[CRM Webhook] Received status update: Campaign ${campaignId}, Customer ${customerId} -> ${status}`);

    // 1. Find or create communication log
    let log = await CommunicationLog.findOne({ campaignId, customerId });

    if (!log) {
      log = new CommunicationLog({
        campaignId,
        customerId,
        recipient,
        channel,
        status,
        history: [{ status, timestamp: timestamp ? new Date(timestamp) : new Date() }]
      });
    } else {
      log.status = status;
      log.history.push({ status, timestamp: timestamp ? new Date(timestamp) : new Date() });
    }

    await log.save();

    // 2. Recalculate Campaign metrics
    const allLogs = await CommunicationLog.find({ campaignId });
    const sentCount = allLogs.length;

    if (sentCount > 0) {
      const openedCount = allLogs.filter(l => 
        ['OPENED', 'READ', 'CLICKED', 'CONVERTED'].includes(l.status)
      ).length;

      const clickedCount = allLogs.filter(l => 
        ['CLICKED', 'CONVERTED'].includes(l.status)
      ).length;

      const convertedCount = allLogs.filter(l => l.status === 'CONVERTED').length;

      const engagementRate = Math.round((openedCount / sentCount) * 100);
      const conversionRate = Number(((convertedCount / sentCount) * 100).toFixed(1));

      // Update campaign in DB
      await Campaign.findByIdAndUpdate(campaignId, {
        sentCount,
        engagement: engagementRate,
        conversion: conversionRate
      });

      console.log(`[CRM Webhook] Updated Campaign ${campaignId}: Sent=${sentCount}, Engagement=${engagementRate}%, Conversion=${conversionRate}%`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error(`[CRM Webhook Error] ${error.message}`);
    next(error);
  }
};
