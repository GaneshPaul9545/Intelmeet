const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, notificationController.getNotifications);
router.patch('/read-all', authMiddleware, notificationController.markAllRead);
router.patch('/:id/read', authMiddleware, notificationController.markRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

module.exports = router;
