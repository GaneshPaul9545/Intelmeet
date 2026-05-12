const { OpenAI } = require('openai');
const fs = require('fs');

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

exports.transcribe = async (req, res) => {
  try {
    if (!openai) return res.status(500).json({ message: 'OpenAI API key not configured' });
    if (!req.file) return res.status(400).json({ message: 'No audio file provided' });

    const fileStream = fs.createReadStream(req.file.path);
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    });
    
    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.summary = async (req, res) => {
  try {
    if (!openai) return res.status(500).json({ message: 'OpenAI API key not configured' });
    const { transcript } = req.body;
    
    if (!transcript) return res.status(400).json({ message: 'Transcript text is required' });

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
${transcript}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    const summaryResult = JSON.parse(completion.choices[0].message.content);
    res.json(summaryResult);
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ message: error.message });
  }
};
