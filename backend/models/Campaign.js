import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Completed'],
    default: 'Draft',
  },
  targetSegment: {
    type: String,
    required: true,
  },
  channel: {
    type: String,
    enum: ['Email', 'WhatsApp', 'SMS', 'Push'],
    default: 'Email',
  },
  engagement: {
    type: Number,
    default: 0, // In percentage e.g., 45%
  },
  conversion: {
    type: Number,
    default: 0, // In percentage e.g., 3.2%
  },
  subject: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  sentCount: {
    type: Number,
    default: 0,
  },
  objective: {
    type: String,
    default: '',
  },
  segmentLabel: {
    type: String,
    default: '',
  },
  optimalTime: {
    type: String,
    default: '',
  },
  predictedOpenRate: {
    type: Number,
    default: 0,
  },
  predictedConversionRate: {
    type: Number,
    default: 0,
  },
  targetFilter: {
    type: Object,
    default: {},
  },
  audienceSize: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
