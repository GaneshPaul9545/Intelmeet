const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, meetingController.createMeeting);
router.get('/', authMiddleware, meetingController.getMeetings);
router.get('/code/:code', authMiddleware, meetingController.getMeetingByCode);
router.get('/:id', authMiddleware, meetingController.getMeetingById);
router.put('/:id', authMiddleware, meetingController.updateMeeting);
router.put('/:id/end', authMiddleware, meetingController.endMeeting);
router.delete('/:id', authMiddleware, meetingController.deleteMeeting);
router.post('/:id/participants', authMiddleware, meetingController.addParticipant);
router.patch('/:id/status', authMiddleware, meetingController.updateMeetingStatus);

module.exports = router;
