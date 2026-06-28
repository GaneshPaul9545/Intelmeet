const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, summaryController.createSummary);
router.post('/generate', authMiddleware, summaryController.generateAISummary);
router.get('/', authMiddleware, summaryController.getAllSummaries);
router.get('/:meetingId', authMiddleware, summaryController.getSummaryByMeetingId);
router.delete('/:id', authMiddleware, summaryController.deleteSummary);

module.exports = router;
