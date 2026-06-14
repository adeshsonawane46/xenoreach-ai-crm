import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || 'http://localhost:5000/api/webhooks/channel';

app.use(cors());
app.use(express.json());

// Send Webhook callback helper
const sendWebhook = async (payload) => {
  try {
    console.log(`[Webhook] Sending ${payload.status} for Campaign ${payload.campaignId} to CRM Backend...`);
    await axios.post(CRM_WEBHOOK_URL, payload);
  } catch (error) {
    console.error(`[Webhook Error] Failed to send status update ${payload.status}: ${error.message}`);
  }
};

// Simulation engine using setTimeout
const startCommunicationSimulation = (recipient, channel, message, campaignId, customerId) => {
  const basePayload = { campaignId, customerId, recipient, channel, timestamp: new Date().toISOString() };

  // 1. Trigger SENT immediately
  setTimeout(() => {
    sendWebhook({ ...basePayload, status: 'SENT' });
  }, 100);

  // 2. Trigger DELIVERED or FAILED (1.5 seconds later)
  setTimeout(() => {
    const isSuccess = Math.random() > 0.05; // 95% delivery success rate
    const status = isSuccess ? 'DELIVERED' : 'FAILED';
    sendWebhook({ ...basePayload, status });

    if (!isSuccess) return; // Stop simulation on failure

    // 3. Trigger OPENED / READ (another 2 seconds later)
    setTimeout(() => {
      const isOpened = Math.random() > 0.3; // 70% open rate
      if (!isOpened) return;

      const openStatus = (channel === 'Email' || channel === 'WhatsApp') ? 'OPENED' : 'READ';
      sendWebhook({ ...basePayload, status: openStatus });

      // 4. Trigger CLICKED (another 1.5 seconds later)
      setTimeout(() => {
        const isClicked = Math.random() > 0.5; // 50% click rate
        if (!isClicked) return;

        sendWebhook({ ...basePayload, status: 'CLICKED' });

        // 5. Trigger CONVERTED (another 2 seconds later)
        setTimeout(() => {
          const isConverted = Math.random() > 0.7; // 30% conversion rate
          if (!isConverted) return;

          sendWebhook({ ...basePayload, status: 'CONVERTED' });
        }, 2000);

      }, 1500);

    }, 2000);

  }, 1500);
};

// POST /send endpoint
app.post('/send', (req, res) => {
  const { recipient, channel, message, campaignId, customerId } = req.body;

  if (!recipient || !channel || !message || !campaignId || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: recipient, channel, message, campaignId, customerId'
    });
  }

  // Start simulation asynchronously
  startCommunicationSimulation(recipient, channel, message, campaignId, customerId);

  res.status(200).json({
    success: true,
    message: `Communication simulation triggered for ${recipient} via ${channel}`
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Channel Communication Microservice',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`📡 Channel Service running on port ${PORT}`);
  console.log(`🔗 Target Webhook URL: ${CRM_WEBHOOK_URL}`);
  console.log(`=========================================`);
});
