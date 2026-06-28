const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, analyticsController.getDashboardStats);
router.get('/meetings-per-week', authMiddleware, analyticsController.getMeetingsPerWeek);
router.get('/productivity', authMiddleware, analyticsController.getProductivityTrend);
router.get('/engagement', authMiddleware, analyticsController.getEngagementRate);
router.get('/recent-activity', authMiddleware, analyticsController.getRecentActivity);

module.exports = router;
