const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

exports.createMeeting = async (req, res) => {
  try {
    const { title, scheduledTime, participants, description } = req.body;

    // Generate unique meeting code
    const meetingCode = uuidv4().split('-').slice(0, 3).join('-');

    const newMeeting = new Meeting({
      title,
      meetingCode,
      hostId: req.user.id,
      scheduledTime: scheduledTime || new Date(),
      participants: participants || [],
      description
    });
    await newMeeting.save();
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ hostId: req.user.id }, { participants: req.user.id }]
    }).populate('hostId', 'name email avatar').sort({ scheduledTime: -1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('hostId', 'name email avatar')
      .populate('participants', 'name email avatar');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Find meeting by code (for joining)
exports.getMeetingByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const meeting = await Meeting.findOne({ meetingCode: code })
      .populate('hostId', 'name email avatar')
      .populate('participants', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found. Please check the meeting code.' });
    }

    // Add user as participant if not already
    if (!meeting.participants.some(p => p._id.toString() === req.user.id) &&
        meeting.hostId._id.toString() !== req.user.id) {
      meeting.participants.push(req.user.id);
      await meeting.save();
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update meeting
exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, scheduledTime, participants, status, description, notes, duration } = req.body;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (title) meeting.title = title;
    if (scheduledTime) meeting.scheduledTime = scheduledTime;
    if (participants) meeting.participants = participants;
    if (status) meeting.status = status;
    if (description) meeting.description = description;
    if (notes) meeting.notes = notes;
    if (duration !== undefined) meeting.duration = duration;

    await meeting.save();
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// End meeting
exports.endMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, notes } = req.body;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    meeting.status = 'completed';
    meeting.endTime = new Date();
    if (duration !== undefined) meeting.duration = duration;
    if (notes) meeting.notes = notes;

    await meeting.save();
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete meeting
exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.hostId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this meeting' });
    }

    await Meeting.findByIdAndDelete(id);
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add participant to meeting
exports.addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantId } = req.body;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.participants.includes(participantId)) {
      meeting.participants.push(participantId);
      await meeting.save();
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update meeting status
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
