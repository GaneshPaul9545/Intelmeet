const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  meetingCode: { type: String, unique: true, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduledTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  status: { type: String, enum: ['scheduled', 'active', 'completed'], default: 'scheduled' },
  duration: { type: Number, default: 0 }, // in minutes
  recordingUrl: { type: String, default: '' },
  transcript: { type: String, default: '' },
  notes: { type: String, default: '' }, // Meeting notes/transcript for AI summary
  chatHistory: [{
    sender: { type: String },
    text: { type: String },
    time: { type: String },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
