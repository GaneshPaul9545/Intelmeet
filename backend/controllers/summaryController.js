const Summary = require('../models/Summary');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const { generateMeetingSummary } = require('../services/aiService');

// Generate AI summary from meeting notes
exports.generateAISummary = async (req, res) => {
  try {
    const { meetingId, notes, participantNames } = req.body;

    // Check if meeting exists
    const meeting = await Meeting.findById(meetingId).populate('hostId', 'name');
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Use provided notes or meeting's stored notes
    const transcript = notes || meeting.notes || '';
    const meetingTitle = meeting.title;
    const names = participantNames || [];

    // Generate AI summary
    const aiResult = await generateMeetingSummary(meetingTitle, transcript, names);

    // Create or update summary in database
    let summary = await Summary.findOne({ meetingId });

    if (summary) {
      summary.content = aiResult.summary.join('\n');
      summary.keyDecisions = aiResult.keyDecisions;
      summary.actionItems = aiResult.actionItems.map(item => ({
        text: item.text,
        assigneeId: null // Could resolve assignee names to IDs
      }));
      await summary.save();
    } else {
      summary = new Summary({
        meetingId,
        content: aiResult.summary.join('\n'),
        keyDecisions: aiResult.keyDecisions,
        actionItems: aiResult.actionItems.map(item => ({
          text: item.text,
          assigneeId: null
        }))
      });
      await summary.save();
    }

    // Update meeting status to completed
    meeting.status = 'completed';
    if (notes) meeting.notes = notes;
    await meeting.save();

    // Automatically create tasks for action items
    try {
      if (aiResult.actionItems && aiResult.actionItems.length > 0) {
        for (const item of aiResult.actionItems) {
          const newTask = new Task({
            title: item.text,
            description: `Generated from meeting: ${meetingTitle}`,
            tag: 'Feature',
            color: 'bg-cyan-500',
            status: 'To Do',
            assignees: [],
            createdBy: meeting.hostId._id || meeting.hostId,
            meetingId: meetingId
          });
          await newTask.save();
        }
      }
    } catch (taskErr) {
      console.error('Error creating tasks from summary:', taskErr);
    }

    res.status(201).json({
      _id: summary._id,
      meetingId: summary.meetingId,
      summary: aiResult.summary,
      keyDecisions: aiResult.keyDecisions,
      actionItems: aiResult.actionItems,
      content: summary.content,
      createdAt: summary.createdAt
    });
  } catch (error) {
    console.error('AI Summary generation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create or update meeting summary (manual)
exports.createSummary = async (req, res) => {
  try {
    const { meetingId, content, keyDecisions, actionItems } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    let summary = await Summary.findOne({ meetingId });

    if (summary) {
      summary.content = content;
      summary.keyDecisions = keyDecisions;
      summary.actionItems = actionItems;
      await summary.save();
    } else {
      summary = new Summary({
        meetingId,
        content,
        keyDecisions,
        actionItems
      });
      await summary.save();
    }

    meeting.status = 'completed';
    await meeting.save();

    res.status(201).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get summary by meeting ID
exports.getSummaryByMeetingId = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const summary = await Summary.findOne({ meetingId })
      .populate('meetingId', 'title hostId participants duration scheduledTime')
      .populate('actionItems.assigneeId', 'name email avatar');

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all summaries for user
exports.getAllSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find()
      .populate('meetingId', 'title hostId participants duration scheduledTime')
      .populate('actionItems.assigneeId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(summaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete summary
exports.deleteSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const summary = await Summary.findByIdAndDelete(id);

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    res.json({ message: 'Summary deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
