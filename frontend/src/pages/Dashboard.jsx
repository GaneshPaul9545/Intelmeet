import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Users, Video, ArrowUpRight, Plus, CheckSquare, Clock, Calendar, ArrowRight, Play, Download, X, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API_BASE_URL from '../config';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [playingRecording, setPlayingRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, meetingsRes, recordingsRes] = await Promise.all([
        fetch('/api/analytics/dashboard', { headers }),
        fetch('/api/meetings', { headers }),
        fetch('/api/recordings/user/all', { headers })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setRecentMeetings(meetingsData.slice(0, 8));
      }

      if (recordingsRes && recordingsRes.ok) {
        const recordingsData = await recordingsRes.json();
        setRecordings(recordingsData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `${user?.name || 'Team'}'s Meeting`,
          scheduledTime: new Date()
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast?.success('Meeting created successfully!');
        navigate(`/meeting/${data.meetingCode || data._id}`);
      }
    } catch (err) {
      toast?.error('Failed to create meeting');
    }
  };

  const handleDownloadRecording = async (recordingUrl) => {
    if (!recordingUrl) return;
    try {
      toast?.success('Starting download...');
      const url = recordingUrl.startsWith('http') ? recordingUrl : `${API_BASE_URL}${recordingUrl}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `meeting-recording-${Date.now()}.webm`;
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

  const overviewCards = [
    {
      label: stats?.completedMeetings || 0,
      sublabel: 'Completed',
      title: 'Meetings',
      color: 'border-blue-500',
      text: 'text-blue-500',
      bg: 'bg-blue-500',
      icon: Video
    },
    {
      label: stats?.pendingTasks || 0,
      sublabel: 'Pending',
      title: 'Tasks',
      color: 'border-orange-500',
      text: 'text-orange-500',
      bg: 'bg-orange-500',
      icon: CheckSquare
    },
    {
      label: stats?.totalSummaries || 0,
      sublabel: 'Generated',
      title: 'AI Summaries',
      color: 'border-purple-500',
      text: 'text-purple-500',
      bg: 'bg-purple-500',
      icon: BarChart2
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Here's what's happening with your meetings.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateMeeting}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} /> New Meeting
          </button>
          <button
            onClick={() => navigate('/pre-join')}
            className="bg-[#161b22] border border-white/10 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
          >
            Join Meeting
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card p-6 flex items-center gap-4 hover:border-white/10 transition-all">
              <div className={`w-12 h-12 rounded-xl ${card.bg}/20 flex items-center justify-center`}>
                <Icon size={22} className={card.text} />
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm">{card.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${card.text}`}>{card.label}</span>
                  <span className="text-xs text-gray-500">{card.sublabel}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full border-4 border-t-transparent ${card.color} animate-spin`} style={{ animationDuration: '3s' }} />
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 flex items-center justify-between bg-gradient-to-r from-blue-900/30 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Total Users</div>
              <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-xs font-medium">
            <ArrowUpRight size={14} /> {stats?.completionRate || 0}%
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Total Meetings</div>
              <div className="text-2xl font-bold text-white">{stats?.totalMeetings || 0}</div>
            </div>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 10}`} className="w-8 h-8 rounded-full border-2 border-[#161b22]" alt="" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Recent Meetings</h2>
        <button
          onClick={() => navigate('/app/meetings')}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        {recentMeetings.length === 0 ? (
          <div className="p-12 text-center">
            <Video size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No meetings yet. Start your first meeting!</p>
          </div>
        ) : recentMeetings.map((meeting, i) => (
          <div key={i} className="p-4 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                meeting.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                meeting.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                <Video size={18} />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">{meeting.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    meeting.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    meeting.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {meeting.status}
                  </span>
                  {meeting.meetingCode && (
                    <span className="text-xs text-gray-600">{meeting.meetingCode}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-white text-sm">{new Date(meeting.scheduledTime).toLocaleDateString()}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={10} /> {meeting.duration || 0} min
                </div>
              </div>
              <div className="flex items-center gap-2">
                {meeting.recordingUrl && (
                  <button
                    onClick={() => handleDownloadRecording(meeting.recordingUrl)}
                    className="px-4 py-1.5 rounded-lg text-sm transition-all font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
                  >
                    Recording
                  </button>
                )}
                <button
                  onClick={() => navigate(
                    meeting.status === 'completed'
                      ? `/app/summary/${meeting._id}`
                      : `/meeting/${meeting.meetingCode || meeting._id}`
                  )}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all font-medium ${
                    meeting.status === 'completed'
                      ? 'text-purple-400 bg-purple-400/10 hover:bg-purple-400/20'
                      : 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                  }`}
                >
                  {meeting.status === 'completed' ? 'Summary' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Recordings Section */}
      <div className="flex items-center justify-between mt-8">
        <h2 className="text-lg font-bold text-white">Meeting Recordings</h2>
      </div>
      <div className="glass-card overflow-hidden">
        {recordings.length === 0 ? (
          <div className="p-12 text-center">
            <Film size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No Recordings Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {recordings.map((recording, i) => (
              <div key={i} className="glass-card bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Film size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm line-clamp-1" title={recording.meetingId?.title || 'Unknown Meeting'}>
                        {recording.meetingId?.title || 'Unknown Meeting'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(recording.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {recording.meetingId?.duration || 0} min</span>
                  <span className="truncate max-w-[120px]" title={recording.fileUrl.split('/').pop()}>
                    {recording.fileUrl.split('/').pop()}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                  <button
                    onClick={() => setPlayingRecording(recording)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                  >
                    <Play size={16} /> Play
                  </button>
                  <button
                    onClick={() => handleDownloadRecording(recording.fileUrl)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {playingRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Film size={18} className="text-blue-400" />
                {playingRecording.meetingId?.title || 'Meeting Recording'}
              </h3>
              <button
                onClick={() => setPlayingRecording(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-black/50">
              <video
                src={playingRecording.fileUrl.startsWith('http') ? playingRecording.fileUrl : `${API_BASE_URL}${playingRecording.fileUrl}`}
                controls
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '70vh' }}
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
