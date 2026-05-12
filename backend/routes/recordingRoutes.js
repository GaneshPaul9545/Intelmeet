const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const recordingController = require('../controllers/recordingController');
const authMiddleware = require('../middleware/authMiddleware');

let storage;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'intellimeet_recordings',
      resource_type: 'video', 
      format: 'webm', 
      public_id: (req, file) => `${req.body.meetingId || 'unknown'}-${Date.now()}`
    },
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads/');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const meetingId = req.body.meetingId || 'unknown';
      cb(null, `${meetingId}-${Date.now()}${path.extname(file.originalname)}`);
    }
  });
}
const upload = multer({ storage });

router.post('/upload', authMiddleware, upload.single('recording'), recordingController.uploadRecording);
router.get('/user/all', authMiddleware, recordingController.getAllUserRecordings);
router.get('/:meetingId', authMiddleware, recordingController.getRecordings);

module.exports = router;
