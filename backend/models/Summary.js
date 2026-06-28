const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  content: { type: String, required: true },
  keyDecisions: [{ type: String }],
  actionItems: [{
    text: String,
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Summary', summarySchema);
