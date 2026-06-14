import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  segment: {
    type: String,
    default: 'New',
  },
  ltv: {
    type: Number,
    default: 0,
  },
  city: {
    type: String,
    required: true,
  },
  totalSpend: {
    type: Number,
    default: 0,
  },
  lastPurchaseDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
