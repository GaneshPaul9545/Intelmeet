import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Share2, PlayCircle, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function Summary() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [summaryData, setSummaryData] = useState(null);
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    if (meetingId) {
      fetchSummary();
      fetchMeeting();
      fetchRecordings();
    } else {
      setLoading(false);
    }
  }, [meetingId]);

  const fetchRecordings = async () => {
    try {
      const res = await api.get(`/api/recordings/${meetingId}`);
      setRecordings(res.data);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
    }
  };

  const fetchMeeting = async () => {
    try {
      const res = await api.get(`/api/meetings/${meetingId}`);
      const data = res.data;
      setMeetingData(data);
      if (data.notes) setNotes(data.notes);
    } catch (err) {
      console.error('Failed to fetch meeting:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/api/summaries/${meetingId}`);
      setSummaryData(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/api/summaries/generate', {
        meetingId,
        notes: notes || 'General team sync meeting. Discussed project progress and upcoming milestones.',
        participantNames: meetingData?.participants?.map(p => p.name) || []
      });

      setSummaryData(res.data);
      toast?.success('AI Summary generated successfully!');
      setShowNotesInput(false);
    } catch (err) {
      toast?.error('Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!summaryData) return;

    const content = `Meeting Summary
===============
${meetingData?.title || 'Meeting'}
Date: ${meetingData ? new Date(meetingData.scheduledTime).toLocaleDateString() : 'N/A'}
Duration: ${meetingData?.duration || 0} minutes

SUMMARY
-------
${(summaryData.summary || summaryData.content?.split('\n') || []).map(s => `• ${s}`).join('\n')}

KEY DECISIONS
-------------
${(summaryData.keyDecisions || []).map(d => `✓ ${d}`).join('\n')}

ACTION ITEMS
------------
${(summaryData.actionItems || []).map(a => `☐ ${a.text || a} ${a.assignee ? `(${a.assignee})` : ''}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${meetingId || 'report'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.success('Summary downloaded!');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast?.success('Summary link copied to clipboard!');
  };

  const handleDownloadRecording = async (recordingUrl) => {
    const targetUrl = recordingUrl || meetingData?.recordingUrl;
    if (!targetUrl) return;
    try {
      toast?.success('Starting download...');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const url = targetUrl.startsWith('http') ? targetUrl : `${backendUrl}${targetUrl}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `meeting-recording-${meetingId}-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast?.error('Failed to download recording');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Normalize summary data
  const summaryPoints = summaryData?.summary ||
    (summaryData?.content ? summaryData.content.split('\n').filter(Boolean) : null);
  const keyDecisions = summaryData?.keyDecisions || [];
  const actionItems = summaryData?.actionItems || [];

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 pb-20">
      <button
        onClick={() => navigate('/app')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {/* No summary yet — Generate */}
      {!summaryData && meetingId && (
        <div className="glass-card p-8 text-center">
          <Sparkles size={48} className="text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Generate AI Summary</h2>
          <p className="text-gray-400 mb-6">
            {meetingData?.title ? `Generate an AI summary for "${meetingData.title}"` : 'Generate an AI-powered meeting summary'}
          </p>

          {showNotesInput ? (
            <div className="max-w-lg mx-auto space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your meeting notes or transcript here... The AI will analyze them and generate a structured summary with key decisions and action items."
                rows={6}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500 resize-none text-sm"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNotesInput(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateSummary}
                  disabled={generating}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Generate Summary
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowNotesInput(true)}
                className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                Add Meeting Notes
              </button>
              <button
                onClick={handleGenerateSummary}
                disabled={generating}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Auto Generate
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* No meetingId - show generic view */}
      {!meetingId && !summaryData && (
        <div className="glass-card p-8 text-center">
          <Sparkles size={48} className="text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Meeting Summaries</h2>
          <p className="text-gray-400 mb-6">End a meeting to generate an AI-powered summary.</p>
          <button
            onClick={() => navigate('/app')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Summary Content */}
      {summaryData && (
        <div className="glass-card overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Meeting Summary</h2>
                {meetingData && (
                  <p className="text-white/70 text-sm mt-1">
                    {meetingData.title} · {new Date(meetingData.scheduledTime).toLocaleDateString()} · {meetingData.duration || 0} min
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-white/80" />
                <span className="text-white/80 text-sm">AI Generated</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1117] p-6 md:p-8 space-y-8">
            {/* Recordings List */}
            {recordings.length > 0 ? (
              <section className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                  <PlayCircle className="text-blue-500" size={20} /> Recordings ({recordings.length})
                </h3>
                {recordings.map((rec, index) => (
                  <div key={rec._id || index} className="mb-6 bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                      <div>
                        <h4 className="text-white font-medium text-lg">Meeting Recording {index + 1}</h4>
                        <p className="text-sm text-gray-400 mt-1">
                          <span className="font-medium text-gray-300">Meeting:</span> {meetingData?.title || 'Unknown Meeting'}
                        </p>
                        <p className="text-sm text-gray-400">
                          <span className="font-medium text-gray-300">Date:</span> {new Date(rec.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          <span className="font-medium text-gray-300">Duration:</span> {meetingData?.duration || 0} minutes
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadRecording(rec.fileUrl)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                      >
                        <Download size={16} /> Download Recording
                      </button>
                    </div>
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 aspect-video flex items-center justify-center">
                      <video 
                        src={rec.fileUrl.startsWith('http') ? rec.fileUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${rec.fileUrl}`} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </section>
            ) : meetingData?.recordingUrl && (
              <section>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                      <PlayCircle className="text-blue-500" size={20} /> Meeting Recording
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      <span className="font-medium text-gray-300">Meeting:</span> {meetingData?.title || 'Unknown Meeting'}
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="font-medium text-gray-300">Date:</span> {meetingData ? new Date(meetingData.scheduledTime || Date.now()).toLocaleDateString() : ''}
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="font-medium text-gray-300">Duration:</span> {meetingData?.duration || 0} minutes
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadRecording(meetingData.recordingUrl)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Download size={16} /> Download Recording
                  </button>
                </div>
                <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 aspect-video flex items-center justify-center">
                  <video 
                    src={meetingData.recordingUrl.startsWith('http') ? meetingData.recordingUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${meetingData.recordingUrl}`} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                </div>
              </section>
            )}

            {/* Summary */}
            {summaryPoints && summaryPoints.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                    <span className="w-1 h-5 bg-blue-600 rounded-full"></span> Summary
                  </h3>
                  {(recordings.length > 0 || meetingData?.recordingUrl) && (
                    <button
                      onClick={() => handleDownloadRecording(recordings[0]?.fileUrl || meetingData?.recordingUrl)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-white/10"
                    >
                      <Download size={16} /> Download Recording
                    </button>
                  )}
                </div>
                <ul className="space-y-2 list-disc pl-5 text-sm text-gray-300">
                  {summaryPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Key Decisions */}
            {keyDecisions.length > 0 && (
              <section>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                  <span className="w-1 h-5 bg-purple-600 rounded-full"></span> Key Decisions
                </h3>
                <ul className="space-y-3">
                  {keyDecisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <section>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                  <span className="w-1 h-5 bg-emerald-500 rounded-full"></span> Action Items
                </h3>
                <ul className="space-y-3">
                  {actionItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-200">
                        {item.text || item}
                        {item.assignee && <span className="text-gray-500 ml-2">— {item.assignee}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Transcript */}
            {meetingData?.transcript && (
              <section>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                  <span className="w-1 h-5 bg-gray-500 rounded-full"></span> Raw Transcript
                </h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {meetingData.transcript}
                  </p>
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-white/5">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                <Download size={18} /> Download Summary
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-blue-600/20"
              >
                <Share2 size={18} /> Share Report
              </button>
              <button
                onClick={handleGenerateSummary}
                disabled={generating}
                className="flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                <Sparkles size={18} /> {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
