const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
  type: {
    type: String,
    enum: ['task_assigned', 'task_updated', 'meeting_started', 'mention'],
    required: true
  },
  message: { type: String, required: true },
  link: { type: String, default: '' }, // Frontend route to navigate to
  isRead: { type: Boolean, default: false },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who caused it
  meta: { type: mongoose.Schema.Types.Mixed, default: {} } // any extra data
}, { timestamps: true });

// Index for fast per-user queries
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
