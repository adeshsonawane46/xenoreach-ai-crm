import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Fulfilled', 'Processing', 'Cancelled'],
    default: 'Processing',
  },
  amount: {
    type: Number,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
