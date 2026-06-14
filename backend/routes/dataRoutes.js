import express from 'express';
import { 
  getCustomers, 
  getOrders, 
  generateDemoData, 
  uploadCustomersCSV,
  updateCustomer,
  deleteCustomer,
  updateOrder,
  deleteOrder
} from '../controllers/dataController.js';

const router = express.Router();

router.get('/customers', getCustomers);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

router.get('/orders', getOrders);
router.put('/orders/:id', updateOrder);
router.delete('/orders/:id', deleteOrder);

router.post('/seed', generateDemoData);
router.post('/upload', uploadCustomersCSV);

export default router;
