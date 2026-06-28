const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ dest: require('os').tmpdir() });

router.post('/transcribe', authMiddleware, upload.single('audio'), aiController.transcribe);
router.post('/summary', authMiddleware, aiController.summary);

module.exports = router;
