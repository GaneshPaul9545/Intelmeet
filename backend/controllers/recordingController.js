const Meeting = require('../models/Meeting');
const Summary = require('../models/Summary');
const Task = require('../models/Task');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const Recording = require('../models/Recording');

exports.uploadRecording = async (req, res) => {
  try {
    const { meetingId } = req.body;
    
    // meeting ID check
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // If Cloudinary is configured, use its URL. Otherwise, use the local uploads path.
    const isCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
    const recordingUrl = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    const localFilePath = isCloudinary ? null : req.file.path;

    const newRecording = new Recording({
      meetingId,
      userId: req.user.id,
      fileUrl: recordingUrl
    });
    await newRecording.save();

    // Still keep the primary recordingUrl on Meeting if it's the first one, for backwards compatibility
    if (!meeting.recordingUrl) {
      meeting.recordingUrl = recordingUrl;
      await meeting.save();
    }

    res.json({ message: 'Recording uploaded successfully', recording: newRecording, meeting });

    // Asynchronous background processing: Transcribe & Summarize
    processRecording(meetingId, recordingUrl, localFilePath).catch(err => {
      console.error('Error processing recording in background:', err);
    });

  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getRecordings = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const recordings = await Recording.find({ meetingId }).populate('userId', 'name email avatar').sort({ createdAt: -1 });
    res.json(recordings);
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUserRecordings = async (req, res) => {
  try {
    const userId = req.user.id;
    const meetings = await Meeting.find({
      $or: [{ hostId: userId }, { participants: userId }]
    }).select('_id');
    const meetingIds = meetings.map(m => m._id);

    const recordings = await Recording.find({ 
      $or: [
        { meetingId: { $in: meetingIds } },
        { userId: userId }
      ]
    })
      .populate('meetingId', 'title scheduledTime duration')
      .sort({ createdAt: -1 });

    res.json(recordings);
  } catch (error) {
    console.error('Get all user recordings error:', error);
    res.status(500).json({ message: error.message });
  }
};

async function processRecording(meetingId, recordingUrl, localFilePath) {
  try {
    if (!openai) {
      console.warn('OpenAI API key not configured. Skipping transcription & summarization.');
      return;
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return;

    // 1. Transcription (Whisper)
    console.log(`Starting transcription for meeting ${meetingId}...`);
    // Note: Whisper requires a read stream. Since we have a local file from Multer:
    // If it's a Cloudinary URL, we'd need to download it first. Assuming local upload for simplicity.
    let transcriptText = "";
    if (recordingUrl) {
      try {
        let fileStream;
        let tempFilePath = null;

        if (localFilePath && fs.existsSync(localFilePath)) {
          // It's a local file
          fileStream = fs.createReadStream(localFilePath);
        } else {
          // It's a Cloudinary URL, download it first
          const https = require('https');
          const os = require('os');
          const path = require('path');
          tempFilePath = path.join(os.tmpdir(), `meeting-${meetingId}.webm`);
          
          await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(tempFilePath);
            https.get(recordingUrl, (response) => {
              response.pipe(file);
              file.on('finish', () => {
                file.close(resolve);
              });
            }).on('error', (err) => {
              fs.unlink(tempFilePath, () => {});
              reject(err);
            });
          });
          fileStream = fs.createReadStream(tempFilePath);
        }

        const transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
        });
        transcriptText = transcription.text;
        
        // Clean up temp file if we created one
        if (tempFilePath) fs.unlink(tempFilePath, () => {});
      } catch (err) {
        console.error("Error transcribing with Whisper:", err);
        return;
      }
    } else {
      console.warn(`Recording URL not found for transcription.`);
      return;
    }

    meeting.transcript = transcriptText;
    await meeting.save();
    console.log(`Transcription completed for meeting ${meetingId}.`);

    // 2. AI Summarization (GPT)
    console.log(`Starting summarization for meeting ${meetingId}...`);
    const prompt = `
You are an AI meeting assistant. Please analyze the following meeting transcript and generate a structured summary.
Return ONLY a valid JSON object matching this schema, without any markdown formatting:
{
  "content": "A high-level summary paragraph of the meeting.",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "actionItems": [
    { "text": "Action item description", "assignee": "Name or empty if unknown" }
  ]
}

Transcript:
${transcriptText}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    const summaryResult = JSON.parse(completion.choices[0].message.content);

    // Save summary to database
    let summaryDoc = await Summary.findOne({ meetingId });
    if (!summaryDoc) {
      summaryDoc = new Summary({ meetingId });
    }

    summaryDoc.content = summaryResult.content;
    summaryDoc.keyDecisions = summaryResult.keyDecisions || [];
    summaryDoc.actionItems = (summaryResult.actionItems || []).map(item => ({
      text: item.text
      // Assuming we map assignee name to User ID later or keep it simple.
    }));

    await summaryDoc.save();
    console.log(`Summarization completed for meeting ${meetingId}.`);

    // Automatically create tasks for action items
    try {
      if (summaryResult.actionItems && summaryResult.actionItems.length > 0) {
        for (const item of summaryResult.actionItems) {
          const newTask = new Task({
            title: item.text,
            description: `Generated from meeting transcript: ${meeting.title}`,
            tag: 'Feature',
            color: 'bg-cyan-500',
            status: 'To Do',
            assignees: [],
            createdBy: meeting.hostId._id || meeting.hostId,
            meetingId: meetingId
          });
          await newTask.save();
        }
        console.log(`Created ${summaryResult.actionItems.length} tasks from meeting ${meetingId}.`);
      }
    } catch (taskErr) {
      console.error('Error creating tasks from summary:', taskErr);
    }

  } catch (error) {
    console.error(`Background processing failed for meeting ${meetingId}:`, error);
  }
}
