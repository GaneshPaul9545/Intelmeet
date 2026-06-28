const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Recording', recordingSchema);
