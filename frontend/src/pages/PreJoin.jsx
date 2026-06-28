import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Settings, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function PreJoin() {
  const [roomId, setRoomId] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Initialize camera preview
  useEffect(() => {
    let currentStream = null;

    const initCamera = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(currentStream);
      } catch (err) {
        console.warn('Camera access denied:', err);
      }
    };

    initCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream && isVideoOn) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOn]);

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setError('Please enter a meeting code');
      return;
    }

    // Stop preview stream before navigating
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Try to find meeting by code first
    try {
      const res = await api.get(`/api/meetings/code/${roomId.trim()}`);
      const meeting = res.data;
      navigate(`/meeting/${meeting.meetingCode || meeting._id}`, { state: { isVideoOn, isMicOn } });
      return;
    } catch (err) {
      // Fall through to direct navigation
    }

    navigate(`/meeting/${roomId.trim()}`, { state: { isVideoOn, isMicOn } });
  };

  return (
    <div className="min-h-screen bg-[#0a0f25] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-3xl relative z-10">
        <button
          onClick={() => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            navigate('/');
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="glass-card p-1">
          <div className="bg-[#161b22] rounded-2xl p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Join a Meeting</h1>
              <p className="text-gray-400">Enter the meeting code to join</p>
            </div>

            <div className="max-w-md mx-auto mb-6">
              <input
                type="text"
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Enter meeting code (e.g., abc-1234-def)"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-500 text-center text-lg"
              />
              {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
            </div>

            {/* Camera Preview */}
            <div className="relative mx-auto max-w-lg aspect-video bg-[#0d1117] rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-6">
              {isVideoOn && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <VideoOff size={32} className="text-white" />
                  </div>
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
                <button
                  onClick={toggleMic}
                  className={`p-2.5 rounded-full transition-colors ${
                    isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-full transition-colors ${
                    isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (stream) stream.getTracks().forEach(track => track.stop());
                  navigate('/app');
                }}
                className="w-full sm:w-auto px-8 py-3 bg-[#161b22] hover:bg-[#1a1f2e] border border-white/10 rounded-xl text-white font-medium transition-colors text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={!roomId.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors text-center shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Video size={18} />
                Join Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
