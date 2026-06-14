import express from 'express';
import { 
  getCampaigns, 
  createCampaign, 
  launchCampaign, 
  queryAISegment, 
  generateAICampaign, 
  deleteAllCampaigns,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign
} from '../controllers/campaignController.js';

const router = express.Router();

router.get('/', getCampaigns);
router.post('/', createCampaign);
router.delete('/', deleteAllCampaigns);
router.put('/:id/launch', launchCampaign);
router.post('/ai-segment', queryAISegment);
router.post('/ai-campaign', generateAICampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/duplicate', duplicateCampaign);

export default router;
