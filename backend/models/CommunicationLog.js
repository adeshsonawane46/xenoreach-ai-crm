import mongoose from 'mongoose';

const communicationLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  channel: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['SENT', 'DELIVERED', 'FAILED', 'OPENED', 'READ', 'CLICKED', 'CONVERTED'],
    default: 'SENT',
  },
  history: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      }
    }
  ]
}, {
  timestamps: true,
});

const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);
export default CommunicationLog;
