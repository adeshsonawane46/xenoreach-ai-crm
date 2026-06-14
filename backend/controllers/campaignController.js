import Campaign from '../models/Campaign.js';
import Customer from '../models/Customer.js';
import CommunicationLog from '../models/CommunicationLog.js';

// Get all campaigns
export const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    next(error);
  }
};

// Create a new campaign draft
export const createCampaign = async (req, res, next) => {
  try {
    const { 
      name, 
      targetSegment, 
      channel, 
      subject, 
      content,
      objective,
      segmentLabel,
      optimalTime,
      predictedOpenRate,
      predictedConversionRate,
      targetFilter,
      audienceSize
    } = req.body;

    if (!name || !targetSegment) {
      return res.status(400).json({ success: false, message: 'Campaign name and target segment are required' });
    }

    const campaign = await Campaign.create({
      name,
      targetSegment,
      channel: channel || 'Email',
      subject: subject || '',
      content: content || '',
      status: 'Draft',
      objective: objective || '',
      segmentLabel: segmentLabel || '',
      optimalTime: optimalTime || '',
      predictedOpenRate: predictedOpenRate || 0,
      predictedConversionRate: predictedConversionRate || 0,
      targetFilter: targetFilter || {},
      audienceSize: audienceSize || 0
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

// Launch a campaign
export const launchCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Determine target filter based on saved targetFilter or fallback
    let queryFilter = campaign.targetFilter;
    if (!queryFilter || Object.keys(queryFilter).length === 0) {
      const filter = campaign.targetSegment === 'All' ? {} : { segment: campaign.targetSegment };
      queryFilter = filter;
      const lowerSegment = campaign.targetSegment.toLowerCase();
      if (lowerSegment.includes('spend')) {
        queryFilter = { totalSpend: { $gt: 5000 } };
      } else if (lowerSegment.includes('mumbai')) {
        queryFilter = { city: 'Mumbai' };
      }
    }

    const customers = await Customer.find(queryFilter);

    campaign.status = 'Active';
    campaign.sentCount = 0; // Will be set as SENT callbacks arrive
    campaign.engagement = 0;
    campaign.conversion = 0;
    campaign.audienceSize = customers.length; // Ensure accurate count on launch
    await campaign.save();

    // Dispatch asynchronous events to the Channel Service
    const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'https://xenoreach-ai-crm-1.onrender.com';

    customers.forEach(customer => {
      const firstName = customer.name ? customer.name.split(' ')[0] : 'Customer';
      const messageBody = campaign.content
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{firstName\}\}/g, firstName);
      const subjectLine = campaign.subject ? campaign.subject
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{firstName\}\}/g, firstName) : '';

      fetch(CHANNEL_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: customer.email,
          channel: campaign.channel,
          message: messageBody,
          subject: subjectLine,
          campaignId: campaign._id,
          customerId: customer._id
        })
      }).then(response => {
        if (!response.ok) {
          console.error(`[CRM Launch Dispatch] Channel service returned error code ${response.status} for customer ${customer.email}`);
        }
      }).catch(err => {
        console.error(`[CRM Launch Dispatch Error] Failed to connect to channel service: ${err.message}`);
      });
    });

    res.status(200).json({ 
      success: true, 
      data: campaign, 
      message: `Campaign launched successfully. Dispatched simulation to ${customers.length} customers.` 
    });
  } catch (error) {
    next(error);
  }
};

// Simulated AI Prompt parsing for Segment Builder
export const queryAISegment = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    let filter = {};
    let traits = [];

    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('high spend') || lowerPrompt.includes('spend more than') || lowerPrompt.includes('5000')) {
      filter.totalSpend = { $gt: 5000 };
      traits.push('High Spenders (>₹5000)');
    }
    
    if (lowerPrompt.includes('mumbai')) {
      filter.city = 'Mumbai';
      traits.push('Mumbai Metro');
    } else if (lowerPrompt.includes('delhi')) {
      filter.city = 'Delhi';
      traits.push('Delhi NCR');
    } else if (lowerPrompt.includes('bengaluru') || lowerPrompt.includes('bangalore')) {
      filter.city = 'Bengaluru';
      traits.push('Bengaluru Hub');
    }

    if (lowerPrompt.includes('risk') || lowerPrompt.includes('churn') || lowerPrompt.includes('inactive')) {
      filter.segment = 'At Risk';
      traits.push('Inactive / At Risk');
    } else if (lowerPrompt.includes('new') || lowerPrompt.includes('recent')) {
      filter.segment = 'New';
      traits.push('Recent Registrations');
    } else if (lowerPrompt.includes('loyal') || lowerPrompt.includes('high value')) {
      filter.segment = 'High Value';
      traits.push('High Value Tier');
    }

    // Default if no filters match
    if (Object.keys(filter).length === 0) {
      filter = {};
      traits = ['All Customers'];
    }

    const customers = await Customer.find(filter);
    
    res.status(200).json({
      success: true,
      prompt,
      matchingCount: customers.length,
      traits,
      rules: Object.entries(filter).map(([key, value]) => {
        if (key === 'totalSpend') return { field: 'Total Spend', operator: 'is greater than', value: '₹5000', icon: 'payments' };
        if (key === 'city') return { field: 'City', operator: 'is exactly', value: value, icon: 'location_city' };
        if (key === 'segment') return { field: 'Segment', operator: 'is exactly', value: value, icon: 'group' };
        return { field: key, operator: 'equals', value: JSON.stringify(value), icon: 'settings' };
      }),
      preview: customers.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};

// Helper to parse dynamic fallback strategy when Gemini is offline or not configured
const generateFallbackStrategy = (prompt) => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Default values
  let title = 'VIP Exclusive Perks';
  let targetSegment = 'High Value';
  let segmentLabel = 'VIP Customer Base';
  let channel = 'Email';
  let optimalTime = 'Tuesday, 10:30 AM';
  let objective = 'Reward top-tier customers with exclusive access to premium rewards.';
  let subject = 'Your VIP Rewards Portal is ready! 💎';
  let body = `Hi {{first_name}},\n\nYour support means everything. We've upgraded your account to premium VIP rewards. Browse our new collections with your permanent 10% discount.\n\nBest Regards,\nBrand Team`;
  let openRate = 52.0;
  let conversionRate = 5.5;
  const query = {};

  // 1. Detect city
  let city = '';
  if (lowerPrompt.includes('mumbai')) {
    city = 'Mumbai';
    query.city = 'Mumbai';
  } else if (lowerPrompt.includes('delhi')) {
    city = 'Delhi';
    query.city = 'Delhi';
  } else if (lowerPrompt.includes('bengaluru') || lowerPrompt.includes('bangalore')) {
    city = 'Bengaluru';
    query.city = 'Bengaluru';
  } else if (lowerPrompt.includes('pune')) {
    city = 'Pune';
    query.city = 'Pune';
  } else if (lowerPrompt.includes('chennai')) {
    city = 'Chennai';
    query.city = 'Chennai';
  }

  // 2. Detect spending
  let isHighSpend = false;
  if (lowerPrompt.includes('spend') || lowerPrompt.includes('premium') || lowerPrompt.includes('high-spending') || lowerPrompt.includes('vip') || lowerPrompt.includes('high value')) {
    isHighSpend = true;
    targetSegment = 'High Value';
    query.segment = 'High Value';
    if (lowerPrompt.includes('10000') || lowerPrompt.includes('10k')) {
      query.minSpend = 10000;
    } else {
      query.minSpend = 5000;
    }
  }

  // 3. Detect inactivity
  let isInactive = false;
  if (lowerPrompt.includes('inactive') || lowerPrompt.includes('churn') || lowerPrompt.includes('recover') || lowerPrompt.includes('back') || lowerPrompt.includes('90') || lowerPrompt.includes('at risk')) {
    isInactive = true;
    targetSegment = 'At Risk';
    query.segment = 'At Risk';
  }

  // 4. Detect channel
  if (lowerPrompt.includes('whatsapp') || lowerPrompt.includes('wa')) {
    channel = 'WhatsApp';
  } else if (lowerPrompt.includes('sms') || lowerPrompt.includes('text')) {
    channel = 'SMS';
  } else if (lowerPrompt.includes('push')) {
    channel = 'Push';
  } else if (lowerPrompt.includes('email') || lowerPrompt.includes('mail')) {
    channel = 'Email';
  } else {
    // Intelligently guess channel
    if (isHighSpend) channel = 'WhatsApp';
    else if (isInactive) channel = 'Email';
    else channel = 'SMS';
  }

  // Adjust timing based on channel
  if (channel === 'WhatsApp') optimalTime = 'Wednesday, 2:00 PM';
  else if (channel === 'SMS') optimalTime = 'Friday, 5:30 PM';
  else if (channel === 'Push') optimalTime = 'Thursday, 4:00 PM';
  else optimalTime = 'Tuesday, 9:30 AM';

  // Customize based on findings
  if (isInactive) {
    if (lowerPrompt.includes('win-back') || lowerPrompt.includes('winback') || lowerPrompt.includes('recover') || (!lowerPrompt.includes('return') && !lowerPrompt.includes('loyalty'))) {
      title = 'Win-Back Campaign';
      segmentLabel = 'Inactive Customers (90+ Days)';
      objective = 'Re-activate inactive customers with a 15% win-back coupon code.';
      subject = 'We miss you, {{first_name}} — here is 15% off! 💔';
      body = `Hi {{first_name}},\n\nIt's been a while since you last visited. We've made some amazing updates and would love to welcome you back. Enjoy 15% off your next purchase with code BACK15.\n\nBest Regards,\nBrand Team`;
      openRate = 42.0;
      conversionRate = 3.8;
    } else if (lowerPrompt.includes('return') || lowerPrompt.includes('offer')) {
      title = 'Special Return Offer';
      segmentLabel = 'Inactive Customers (90+ Days)';
      objective = 'Drive reactivation by giving a special mystery return gift on their next order.';
      subject = 'Ready to return, {{first_name}}? Here is your exclusive gift!';
      body = `Hi {{first_name}},\n\nWe'd love to welcome you back! Place any order this week and get a free mystery gift with coupon code RETURNFREE at checkout.\n\nBest Regards,\nBrand Team`;
      openRate = 42.0;
      conversionRate = 3.8;
    } else if (lowerPrompt.includes('loyalty') || lowerPrompt.includes('reward')) {
      title = 'Loyalty Rewards Reactivation';
      segmentLabel = 'Inactive Customers (90+ Days)';
      objective = 'Acknowledge loyal customers and prompt account activity via loyalty point reminders.';
      subject = 'Claim your loyalty points, {{first_name}}! ⭐';
      body = `Hi {{first_name}},\n\nYour loyalty points are waiting! Re-activate your account by claiming your points before they expire. Use them for exclusive discounts on your next order.\n\nBest Regards,\nBrand Team`;
      openRate = 42.0;
      conversionRate = 3.8;
    }
  } else if (isHighSpend) {
    if (lowerPrompt.includes('vip') || lowerPrompt.includes('rewards')) {
      title = 'VIP Rewards Campaign';
      segmentLabel = 'VIP Customers';
      objective = 'Reward top-tier customers with double points and dedicated support.';
      subject = "You've unlocked VIP rewards, {{first_name}}! 💎";
      body = `Hi {{first_name}},\n\nThank you for being one of our top customers. As a VIP member, you will earn double reward points on all purchases this weekend.\n\nBest Regards,\nBrand Team`;
      openRate = 52.0;
      conversionRate = 5.5;
    } else if (lowerPrompt.includes('exclusive') || lowerPrompt.includes('access')) {
      title = 'Exclusive Access Campaign';
      segmentLabel = 'VIP Customers';
      objective = 'Provide premium buyers with 24-hour early access to seasonal collections.';
      subject = 'Exclusive early access for {{first_name}}! ⚡';
      body = `Hi {{first_name}},\n\nWe are launching our new seasonal collection soon, and you have exclusive 24-hour early access. Shop the best styles before anyone else!\n\nBest Regards,\nBrand Team`;
      openRate = 52.0;
      conversionRate = 5.5;
    } else {
      title = 'Premium VIP Perks';
      segmentLabel = 'VIP Customers';
      objective = 'Acknowledge LTV contribution and incentivize high basket value via upgrades.';
      subject = 'Your premium perks are ready, {{first_name}}! 🚀';
      body = `Hi {{first_name}},\n\nEnjoy complimentary shipping and free product upgrades on your next order. Thank you for your continued support.\n\nBest Regards,\nBrand Team`;
      openRate = 52.0;
      conversionRate = 5.5;
    }
  } else {
    // New Customers
    if (lowerPrompt.includes('onboarding') || lowerPrompt.includes('guide')) {
      title = 'Onboarding Campaign';
      segmentLabel = 'New Customers (Last 14 Days)';
      targetSegment = 'New';
      query.segment = 'New';
      objective = 'Help new buyers get familiar with the product line to drive adoption.';
      subject = 'How to make the most of your purchase, {{first_name}} 🚀';
      body = `Hi {{first_name}},\n\nWe want to make sure you have the best experience. Here is a quick guide to getting started with our products and services.\n\nBest Regards,\nBrand Team`;
      openRate = 48.0;
      conversionRate = 4.5;
    } else {
      title = 'Welcome Onboarding Campaign';
      segmentLabel = 'New Customers (Last 14 Days)';
      targetSegment = 'New';
      query.segment = 'New';
      objective = 'Engage new subscribers with a welcome message and a 10% coupon code.';
      subject = "Welcome to the family, {{first_name}}! 🎉";
      body = `Hi {{first_name}},\n\nThank you for signing up! We are thrilled to have you. Enjoy 10% off your first purchase with coupon code WELCOME10.\n\nBest Regards,\nBrand Team`;
      openRate = 48.0;
      conversionRate = 4.5;
    }
  }

  // Adjust details based on city
  if (city) {
    title = `${city} | ${title}`;
    segmentLabel = `${segmentLabel} in ${city}`;
    query.city = city;
  }

  // Channel Reasoning
  let channelReasoning = '';
  if (channel === 'Email') {
    channelReasoning = `• Audience contains ${targetSegment.toLowerCase()} customers\n• Longer content performs better via email\n• Expected Open Rate: ${openRate}%\n• Expected Conversion Rate: ${conversionRate}%`;
  } else if (channel === 'WhatsApp') {
    channelReasoning = `• VIP customers show 3x higher response rates on WhatsApp\n• Immediate reach with high-priority notifications\n• Expected Open Rate: ${openRate}%\n• Expected Conversion Rate: ${conversionRate}%`;
  } else if (channel === 'SMS') {
    channelReasoning = `• High read rate within 3 minutes of dispatch\n• Short action-oriented messages perform best via text\n• Expected Open Rate: ${openRate}%\n• Expected Conversion Rate: ${conversionRate}%`;
  } else {
    channelReasoning = `• Push notifications drive immediate click-throughs\n• Great for time-sensitive flash offers\n• Expected Open Rate: ${openRate}%\n• Expected Conversion Rate: ${conversionRate}%`;
  }

  return {
    strategy: {
      title,
      targetSegment,
      segmentLabel,
      channel,
      channelReasoning,
      optimalTime,
      objective,
      message: {
        subject,
        body
      },
      predictions: {
        openRate,
        conversionRate
      }
    },
    query
  };
};

const compileMongoQuery = (query) => {
  const filter = {};
  if (query.city) {
    filter.city = query.city;
  }
  if (query.minSpend) {
    filter.totalSpend = { $gt: query.minSpend };
  }
  if (query.segment) {
    filter.segment = query.segment;
  }
  return filter;
};

const compileFilter = (strategy, query) => {
  let filter = {};
  if (query && Object.keys(query).length > 0) {
    filter = compileMongoQuery(query);
  } else {
    const seg = strategy.targetSegment;
    if (seg === 'All') {
      filter = {};
    } else if (['New', 'High Value', 'At Risk'].includes(seg)) {
      filter = { segment: seg };
    } else {
      const segLower = seg.toLowerCase();
      if (segLower.includes('mumbai')) filter.city = 'Mumbai';
      if (segLower.includes('delhi')) filter.city = 'Delhi';
      if (segLower.includes('bengaluru')) filter.city = 'Bengaluru';
      
      if (segLower.includes('spend') || segLower.includes('premium')) {
        filter.totalSpend = { $gt: 5000 };
      }
      
      if (segLower.includes('risk') || segLower.includes('inactive')) {
        filter.segment = 'At Risk';
      } else if (segLower.includes('new') || segLower.includes('recent')) {
        filter.segment = 'New';
      }
    }
  }
  return filter;
};

// Simulated/Actual AI Prompt response for Campaign Creator Wizard
export const generateAICampaign = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let strategy;
    let parsedQuery = {};

    if (apiKey) {
      try {
        console.log('[Gemini API] Querying Gemini for campaign generation...');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI CRM Campaign Strategist. Based on this user prompt: "${prompt}", generate a marketing campaign strategy in JSON format.
                The response must be valid JSON matching this schema:
                {
                  "title": "A catchy campaign title",
                  "targetSegment": "High Value" | "New" | "At Risk" | "All" | "Custom segment name",
                  "segmentLabel": "A friendly label describing the targeted segment",
                  "channel": "Email" | "WhatsApp" | "SMS" | "Push",
                  "channelReasoning": "A paragraph or bulleted list explaining why this channel was recommended",
                  "optimalTime": "Optimal send time, e.g. Tuesday, 10:30 AM",
                  "objective": "The business objective of this campaign",
                  "message": {
                    "subject": "Email subject line or WhatsApp/SMS header",
                    "body": "The message body copy. Use {{first_name}} as a placeholder for the customer's name. It should sound like a real Ecommerce / D2C / SaaS marketing communication from a premium brand. End with 'Best Regards, Brand Team' instead of referring to 'XenoReach' or 'AI Insights'."
                  },
                  "predictions": {
                    "openRate": A number representing estimated open/read rate percentage (e.g. 42.5),
                    "conversionRate": A number representing estimated conversion rate percentage (e.g. 3.5)
                  },
                  "query": {
                    "city": "Optional city filter matching one of: Mumbai, Delhi, Bengaluru, Pune, Chennai",
                    "minSpend": Optional number for minimum spend filter (e.g. 5000 or 10000),
                    "segment": "Optional segment filter matching one of: High Value, New, At Risk"
                  }
                }`
              }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const jsonText = result.candidates[0].content.parts[0].text;
          const data = JSON.parse(jsonText);
          strategy = {
            title: data.title,
            targetSegment: data.targetSegment,
            segmentLabel: data.segmentLabel,
            channel: data.channel,
            channelReasoning: data.channelReasoning || '',
            optimalTime: data.optimalTime,
            objective: data.objective,
            message: data.message,
            predictions: data.predictions || { openRate: 40, conversionRate: 3 }
          };
          parsedQuery = data.query || {};
          console.log('[Gemini API] Strategy successfully generated by Gemini.');
        } else {
          console.warn(`[Gemini API] Call failed with status ${response.status}. Using fallback generator.`);
        }
      } catch (err) {
        console.error(`[Gemini API Error] ${err.message}. Using fallback generator.`);
      }
    }

    // Fallback if not configured or failed
    if (!strategy) {
      console.log('[Gemini Fallback] Using rule-based generator for dynamic response.');
      const fallback = generateFallbackStrategy(prompt);
      strategy = fallback.strategy;
      parsedQuery = fallback.query;
    }

    // Resolve targetFilter
    const targetFilter = compileFilter(strategy, parsedQuery);

    // Count matching audience size from database
    const matchingCount = await Customer.countDocuments(targetFilter);

    res.status(200).json({
      success: true,
      strategy: {
        title: strategy.title,
        targetSegment: strategy.targetSegment,
        segmentLabel: strategy.segmentLabel,
        channel: strategy.channel,
        channelReasoning: strategy.channelReasoning || '',
        optimalTime: strategy.optimalTime,
        objective: strategy.objective,
        message: strategy.message,
        predictions: strategy.predictions,
        targetFilter,
        matchingCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete all campaigns & communication logs
export const deleteAllCampaigns = async (req, res, next) => {
  try {
    await Promise.all([
      Campaign.deleteMany({}),
      CommunicationLog.deleteMany({})
    ]);
    res.status(200).json({ success: true, message: 'All campaigns and logs deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Update a campaign
export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subject, content, channel, targetSegment, status } = req.body;

    let updates = { name, subject, content, channel, targetSegment, status };

    // Resolve targetFilter if targetSegment is changed
    let targetFilter = req.body.targetFilter;
    if (!targetFilter && targetSegment) {
      const filter = targetSegment === 'All' ? {} : { segment: targetSegment };
      let queryFilter = filter;
      const lowerSegment = targetSegment.toLowerCase();
      if (lowerSegment.includes('spend')) {
        queryFilter = { totalSpend: { $gt: 5000 } };
      } else if (lowerSegment.includes('mumbai')) {
        queryFilter = { city: 'Mumbai' };
      }
      targetFilter = queryFilter;
    }

    if (targetFilter) {
      updates.targetFilter = targetFilter;
      updates.audienceSize = await Customer.countDocuments(targetFilter);
    } else {
      const currentCamp = await Campaign.findById(id);
      if (currentCamp) {
        updates.audienceSize = await Customer.countDocuments(currentCamp.targetFilter || {});
      }
    }

    const campaign = await Campaign.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

// Delete a single campaign
export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndDelete(id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Clean up communication logs
    await CommunicationLog.deleteMany({ campaignId: id });

    res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Duplicate a campaign
export const duplicateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const duplicatedCampaign = await Campaign.create({
      name: `${campaign.name} (Copy)`,
      targetSegment: campaign.targetSegment,
      segmentLabel: campaign.segmentLabel,
      channel: campaign.channel,
      subject: campaign.subject,
      content: campaign.content,
      status: 'Draft',
      objective: campaign.objective,
      optimalTime: campaign.optimalTime,
      predictedOpenRate: campaign.predictedOpenRate,
      predictedConversionRate: campaign.predictedConversionRate,
      targetFilter: campaign.targetFilter,
      audienceSize: campaign.audienceSize,
      engagement: 0,
      conversion: 0,
      sentCount: 0
    });

    res.status(201).json({ success: true, data: duplicatedCampaign });
  } catch (error) {
    next(error);
  }
};
