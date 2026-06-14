import express from 'express';
import { handleChannelWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/channel', handleChannelWebhook);

export default router;
