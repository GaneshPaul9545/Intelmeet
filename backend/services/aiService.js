/**
 * AI Summary Service
 * Uses Ollama (local LLM) with fallback to extractive summarizer
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Generate meeting summary using AI
 * @param {string} meetingTitle - Title of the meeting
 * @param {string} transcript - Meeting notes/transcript
 * @param {string[]} participantNames - List of participant names
 * @returns {Object} - { summary, keyDecisions, actionItems }
 */
async function generateMeetingSummary(meetingTitle, transcript, participantNames = []) {
  try {
    // Try Ollama first
    const result = await generateWithOllama(meetingTitle, transcript, participantNames);
    return result;
  } catch (ollamaError) {
    console.log('Ollama unavailable, using fallback summarizer:', ollamaError.message);
    // Fallback to extractive summarizer
    return generateFallbackSummary(meetingTitle, transcript, participantNames);
  }
}

/**
 * Generate summary using Ollama local LLM
 */
async function generateWithOllama(meetingTitle, transcript, participantNames) {
  const prompt = `You are an AI meeting assistant. Analyze the following meeting notes and generate a structured summary.

Meeting Title: ${meetingTitle}
Participants: ${participantNames.join(', ') || 'Not specified'}

Meeting Notes/Transcript:
${transcript}

Please provide the response in the following JSON format ONLY (no markdown, no extra text):
{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "keyDecisions": ["decision 1", "decision 2"],
  "actionItems": [
    {"text": "action item description", "assignee": "person name or null"},
    {"text": "action item description", "assignee": "person name or null"}
  ]
}

Rules:
- Summary should have 3-5 concise bullet points
- Key decisions should be specific and actionable
- Action items should mention who is responsible if possible
- Response must be valid JSON only`;

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 1024
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama responded with ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.response || '';

  // Try to parse JSON from the response
  try {
    // Find JSON in the response (handles cases where LLM adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: Array.isArray(parsed.summary) ? parsed.summary : [parsed.summary],
        keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(item => ({
          text: item.text || item,
          assignee: item.assignee || null
        })) : []
      };
    }
    throw new Error('No JSON found in response');
  } catch (parseError) {
    console.warn('Failed to parse Ollama response as JSON, using fallback');
    return generateFallbackSummary(meetingTitle, responseText, participantNames);
  }
}

/**
 * Fallback extractive summarizer (no AI required)
 */
function generateFallbackSummary(meetingTitle, transcript, participantNames) {
  if (!transcript || transcript.trim().length === 0) {
    return {
      summary: [`Meeting "${meetingTitle}" was conducted with ${participantNames.length || 'multiple'} participants.`],
      keyDecisions: ['No specific decisions were captured during this meeting.'],
      actionItems: [{ text: 'Review meeting recording and add notes', assignee: null }]
    };
  }

  // Split transcript into sentences
  const sentences = transcript
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10);

  // Extract summary (first few meaningful sentences)
  const summary = sentences.slice(0, Math.min(5, sentences.length));
  if (summary.length === 0) {
    summary.push(`Meeting "${meetingTitle}" was discussed among participants.`);
  }

  // Extract key decisions (sentences with decision-related keywords)
  const decisionKeywords = ['decided', 'agreed', 'approved', 'confirmed', 'will', 'should', 'must', 'plan to', 'going to'];
  const keyDecisions = sentences
    .filter(s => decisionKeywords.some(kw => s.toLowerCase().includes(kw)))
    .slice(0, 3);
  if (keyDecisions.length === 0) {
    keyDecisions.push('Review and finalize discussion points from this meeting.');
  }

  // Extract action items (sentences with action-related keywords)
  const actionKeywords = ['need to', 'will', 'should', 'must', 'action', 'todo', 'task', 'assign', 'complete', 'finish', 'deliver', 'send', 'create', 'update', 'prepare'];
  const actionItems = sentences
    .filter(s => actionKeywords.some(kw => s.toLowerCase().includes(kw)))
    .slice(0, 5)
    .map(text => {
      // Try to find an assignee from participant names
      const assignee = participantNames.find(name =>
        text.toLowerCase().includes(name.toLowerCase())
      ) || null;
      return { text, assignee };
    });

  if (actionItems.length === 0) {
    actionItems.push({
      text: 'Follow up on meeting discussion points',
      assignee: participantNames[0] || null
    });
  }

  return { summary, keyDecisions, actionItems };
}

module.exports = { generateMeetingSummary };
