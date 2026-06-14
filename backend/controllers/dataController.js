import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Campaign from '../models/Campaign.js';
import CommunicationLog from '../models/CommunicationLog.js';

// Get all customers (with optional segment filtering)
export const getCustomers = async (req, res, next) => {
  try {
    const { segment } = req.query;
    const filter = segment ? { segment } : {};
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    next(error);
  }
};

// Get all orders
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// Generate and seed demo data (customers, orders, campaigns, and communication logs)
export const generateDemoData = async (req, res, next) => {
  try {
    // Clear existing data
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await CommunicationLog.deleteMany({});

    const demoCustomers = [
      { name: 'Alex Rivera', email: 'arivera@example.com', segment: 'High Value', ltv: 1240, city: 'Mumbai', totalSpend: 5400, lastPurchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { name: 'Jordan Lee', email: 'jlee.tech@example.com', segment: 'New', ltv: 150, city: 'Bengaluru', totalSpend: 150, lastPurchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { name: 'Casey Smith', email: 'caseys@example.com', segment: 'At Risk', ltv: 890, city: 'Mumbai', totalSpend: 4900, lastPurchaseDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000) },
      { name: 'Priya Sharma', email: 'priya.s@example.com', segment: 'High Value', ltv: 2450, city: 'Delhi', totalSpend: 8200, lastPurchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { name: 'Rohan Mehta', email: 'rohan.mehta@example.com', segment: 'At Risk', ltv: 620, city: 'Pune', totalSpend: 1200, lastPurchaseDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000) },
      { name: 'Ananya Goel', email: 'ananya.g@example.com', segment: 'New', ltv: 320, city: 'Mumbai', totalSpend: 320, lastPurchaseDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
      { name: 'David Miller', email: 'david.miller@example.com', segment: 'High Value', ltv: 1850, city: 'Bengaluru', totalSpend: 6100, lastPurchaseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { name: 'Sarah Connor', email: 'sconnor@example.com', segment: 'At Risk', ltv: 400, city: 'Delhi', totalSpend: 1500, lastPurchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      { name: 'Vikram Singh', email: 'vikram.s@example.com', segment: 'High Value', ltv: 3100, city: 'Mumbai', totalSpend: 9500, lastPurchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { name: 'Ayesha Takia', email: 'ayesha.t@example.com', segment: 'New', ltv: 210, city: 'Chennai', totalSpend: 210, lastPurchaseDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { name: 'Marcus Aurelius', email: 'philosopher@example.com', segment: 'High Value', ltv: 5000, city: 'Delhi', totalSpend: 12000, lastPurchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
    ];

    const seededCustomers = await Customer.insertMany(demoCustomers);

    const demoOrders = [
      { orderId: '#ORD-9921', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'Fulfilled', amount: 345, customerName: 'Alex Rivera', customerEmail: 'arivera@example.com' },
      { orderId: '#ORD-9920', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'Processing', amount: 129.5, customerName: 'Jordan Lee', customerEmail: 'jlee.tech@example.com' },
      { orderId: '#ORD-9919', date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), status: 'Fulfilled', amount: 85, customerName: 'Casey Smith', customerEmail: 'caseys@example.com' },
      { orderId: '#ORD-9918', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: 'Fulfilled', amount: 850, customerName: 'Priya Sharma', customerEmail: 'priya.s@example.com' },
      { orderId: '#ORD-9917', date: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000), status: 'Fulfilled', amount: 150, customerName: 'Rohan Mehta', customerEmail: 'rohan.mehta@example.com' },
      { orderId: '#ORD-9916', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), status: 'Processing', amount: 320, customerName: 'Ananya Goel', customerEmail: 'ananya.g@example.com' },
      { orderId: '#ORD-9915', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'Fulfilled', amount: 450, customerName: 'David Miller', customerEmail: 'david.miller@example.com' },
      { orderId: '#ORD-9914', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), status: 'Fulfilled', amount: 200, customerName: 'Sarah Connor', customerEmail: 'sconnor@example.com' },
      { orderId: '#ORD-9913', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'Fulfilled', amount: 1200, customerName: 'Vikram Singh', customerEmail: 'vikram.s@example.com' }
    ];

    const seededOrders = await Order.insertMany(demoOrders);

    // Create demo campaigns
    const demoCampaigns = [
      {
        name: 'Welcome Onboarding Series',
        status: 'Completed',
        targetSegment: 'New',
        channel: 'Email',
        engagement: 48.2,
        conversion: 4.5,
        subject: 'Welcome to the family! 🎉',
        content: 'Hi {{first_name}},\n\nThank you for signing up! We are thrilled to have you. Enjoy 10% off your first purchase with coupon code WELCOME10.\n\nBest Regards,\nBrand Team',
        sentCount: 1500,
        audienceSize: 1500,
        objective: 'Engage new subscribers with a welcome message and a 10% coupon code.',
        optimalTime: 'Tuesday, 9:30 AM',
        predictedOpenRate: 48.0,
        predictedConversionRate: 4.5
      },
      {
        name: 'VIP High Value Spenders Special',
        status: 'Completed',
        targetSegment: 'High Value',
        channel: 'WhatsApp',
        engagement: 58.5,
        conversion: 6.2,
        subject: 'VIP Rewards Campaign',
        content: 'Hi {{first_name}},\n\nThank you for being one of our top customers. As a VIP member, you will earn double reward points on all purchases this weekend.\n\nBest Regards,\nBrand Team',
        sentCount: 1100,
        audienceSize: 1100,
        objective: 'Reward top-tier customers with double points and dedicated support.',
        optimalTime: 'Wednesday, 2:00 PM',
        predictedOpenRate: 52.0,
        predictedConversionRate: 5.5
      },
      {
        name: 'Win Back Inactive Customers',
        status: 'Active',
        targetSegment: 'At Risk',
        channel: 'SMS',
        engagement: 38.6,
        conversion: 3.5,
        subject: 'We miss you! 💔',
        content: 'Hi {{first_name}},\n\nIt\'s been a while since you last visited. We\'ve made some amazing updates and would love to welcome you back. Enjoy 15% off with code BACK15.\n\nBest Regards,\nBrand Team',
        sentCount: 850,
        audienceSize: 850,
        objective: 'Re-activate inactive customers with a 15% win-back coupon code.',
        optimalTime: 'Friday, 5:30 PM',
        predictedOpenRate: 42.0,
        predictedConversionRate: 3.8
      }
    ];

    const seededCampaigns = await Campaign.insertMany(demoCampaigns);

    // Generate CommunicationLogs spanning the last 30 days
    const logsToInsert = [];
    const now = new Date();

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - dayOffset);

      // Trend growth: Week 1 (low) -> Week 2 (mod) -> Week 3 (high) -> Week 4 (peak)
      let baseVolume = 80;
      if (dayOffset >= 22) {
        // Week 1 (Days 30-23 ago): 80-110 sent/day
        baseVolume = 80 + Math.floor(Math.random() * 30);
      } else if (dayOffset >= 15) {
        // Week 2 (Days 22-16 ago): 110-150 sent/day
        baseVolume = 110 + Math.floor(Math.random() * 40);
      } else if (dayOffset >= 8) {
        // Week 3 (Days 15-9 ago): 150-190 sent/day
        baseVolume = 150 + Math.floor(Math.random() * 40);
      } else {
        // Week 4 (Days 8-1 ago): 190-250 sent/day
        baseVolume = 190 + Math.floor(Math.random() * 60);
      }

      // Weekly Pattern: Weekdays busy, weekends quieter (40% drop)
      const dayOfWeek = targetDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseVolume = Math.floor(baseVolume * 0.6);
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        // Tues/Thurs boosts
        baseVolume = Math.floor(baseVolume * 1.2);
      }

      // Occasional spikes (e.g. major campaign launch events 12 days ago and 4 days ago)
      if (dayOffset === 12 || dayOffset === 4) {
        baseVolume += 150 + Math.floor(Math.random() * 100);
      }

      baseVolume = Math.max(50, Math.min(500, baseVolume));

      // Create log entries for this day
      for (let j = 0; j < baseVolume; j++) {
        const campaign = seededCampaigns[j % seededCampaigns.length];
        const customer = seededCustomers[j % seededCustomers.length];

        // Random roll for status:
        // Sent: 100% of baseVolume
        // Opened: 30-60% of sent
        // Clicked: 10-25% of opened
        // Converted: 2-8% of sent
        const openRoll = Math.random();
        const clickRoll = Math.random();
        const convertRoll = Math.random();

        const openedRate = 0.30 + (Math.random() * 0.30); // 30% to 60%
        const clickedRate = 0.10 + (Math.random() * 0.15); // 10% to 25%
        const convertedRate = 0.02 + (Math.random() * 0.06); // 2% to 8%

        let status = 'DELIVERED';

        if (convertRoll < convertedRate) {
          status = 'CONVERTED';
        } else if (openRoll < openedRate) {
          if (clickRoll < clickedRate) {
            status = 'CLICKED';
          } else {
            status = 'OPENED';
          }
        } else {
          // 5% FAILED status, 95% DELIVERED
          status = Math.random() < 0.05 ? 'FAILED' : 'DELIVERED';
        }

        const logTime = new Date(targetDate);
        logTime.setHours(8 + Math.floor(Math.random() * 14)); // 8am - 10pm
        logTime.setMinutes(Math.floor(Math.random() * 60));
        logTime.setSeconds(Math.floor(Math.random() * 60));

        logsToInsert.push({
          campaignId: campaign._id,
          customerId: customer._id,
          recipient: customer.email,
          channel: campaign.channel,
          status,
          createdAt: logTime,
          updatedAt: logTime,
          history: [
            { status: 'SENT', timestamp: logTime },
            { status: 'DELIVERED', timestamp: logTime }
          ]
        });
      }
    }

    // Bypass Mongoose hook to preserve the historical createdAt field
    await CommunicationLog.collection.insertMany(logsToInsert);

    res.status(200).json({
      success: true,
      message: 'Demo data generated successfully with historical campaign analytics',
      customersCount: seededCustomers.length,
      ordersCount: seededOrders.length,
      campaignsCount: seededCampaigns.length,
      logsCount: logsToInsert.length
    });
  } catch (error) {
    next(error);
  }
};

// Mock CSV Upload endpoint
export const uploadCustomersCSV = async (req, res, next) => {
  try {
    const { customers } = req.body;
    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ success: false, message: 'Please provide an array of customers' });
    }

    // Filter duplicate emails within the uploaded payload itself
    const uniqueUploads = [];
    const seenEmails = new Set();
    for (const cust of customers) {
      if (cust.email && !seenEmails.has(cust.email.toLowerCase())) {
        seenEmails.add(cust.email.toLowerCase());
        uniqueUploads.push(cust);
      }
    }

    const payloadEmails = uniqueUploads.map(c => c.email);
    // Query MongoDB to find if any of these emails already exist in the database
    const existingCustomers = await Customer.find({ email: { $in: payloadEmails } }).select('email');
    const existingEmails = new Set(existingCustomers.map(c => c.email.toLowerCase()));

    // Filter out any customers that already exist in database
    const toInsert = uniqueUploads.filter(c => !existingEmails.has(c.email.toLowerCase()));
    
    let count = 0;
    if (toInsert.length > 0) {
      const inserted = await Customer.insertMany(toInsert);
      count = inserted.length;
    }

    const skipped = customers.length - count;

    res.status(201).json({ 
      success: true, 
      count, 
      skipped,
      message: `${count} customers imported, ${skipped} duplicates skipped` 
    });
  } catch (error) {
    next(error);
  }
};

// Update Customer
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer, message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete Customer
export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Update Order
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order, message: 'Order updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete Order
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};
