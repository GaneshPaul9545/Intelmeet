import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Phone, MessageSquare, Users, Grid, Send, Copy, Check, Disc, BrainCircuit, ListTodo } from 'lucide-react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useWebRTC from '../hooks/useWebRTC';
import api from '../services/api';

export default function MeetingRoom() {
  const { id: meetingId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const initialMediaState = location.state || { isVideoOn: true, isMicOn: true };
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [meetingData, setMeetingData] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const {
    localStream,
    remoteStreams,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isConnected,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage: socketSendMessage,
    leaveRoom,
    socket
  } = useWebRTC(meetingId, user, initialMediaState);

  // Fetch meeting data
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        let res;
        try {
          res = await api.get(`/api/meetings/${meetingId}`);
        } catch (e) {
          res = await api.get(`/api/meetings/code/${meetingId}`);
        }
        const data = res.data;
        setMeetingData(data);
        if (data.chatHistory && data.chatHistory.length > 0) {
          setMessages(data.chatHistory.map(msg => ({
            text: msg.text,
            sender: msg.sender,
            time: msg.time,
            isMine: msg.senderId === (user?._id || user?.id)
          })));
        }
      } catch (err) {
        console.error('Failed to fetch meeting:', err);
      }
    };
    fetchMeeting();
  }, [meetingId]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Listen for incoming messages
  useEffect(() => {
    if (socket.current) {
      const handler = (data) => {
        setMessages(prev => [...prev, data]);
      };
      socket.current.on('receive-message', handler);
      return () => socket.current?.off('receive-message', handler);
    }
  }, [socket.current]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const msgData = {
      text: messageInput,
      sender: user?.name || 'Guest',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socketSendMessage(msgData);
    setMessages(prev => [...prev, { ...msgData, isMine: true }]);
    setMessageInput('');
  };

  const startRecording = async () => {
    try {
      let screenStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } catch (err) {
        console.warn('Could not get display media with audio, trying video only:', err);
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      }

      let audioStream = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.warn('Could not get local mic for recording:', e);
      }
      
      const tracks = [...screenStream.getVideoTracks()];
      
      // Combine screen audio and local mic audio
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = audioContext.createMediaStreamSource(new MediaStream(screenStream.getAudioTracks()));
        screenSource.connect(destination);
      }
      
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(new MediaStream(audioStream.getAudioTracks()));
        micSource.connect(destination);
      }
      
      if (destination.stream.getAudioTracks().length > 0) {
        tracks.push(destination.stream.getAudioTracks()[0]);
      }
      
      const combinedStream = new MediaStream(tracks);
      
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(combinedStream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setIsRecording(false);
        
        // Upload to backend
        try {
          toast?.success('Processing recording...');
          const formData = new FormData();
          const targetId = meetingData?._id || meetingId;
          formData.append('meetingId', targetId);
          formData.append('recording', blob, `Meeting_Recording_${targetId}.webm`);
          
          await api.post(`/api/recordings/upload`, formData);
          
          toast?.success('Recording uploaded successfully!');
          console.log('Recording uploaded successfully to begin AI processing.');
        } catch (uploadErr) {
          console.error('Error uploading recording:', uploadErr);
          toast?.error('Upload failed. Downloading locally...');
          // Fallback: download locally if upload fails
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.style = 'display: none';
          a.href = url;
          a.download = `Meeting_Recording_${new Date().toISOString().slice(0,10)}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
        
        recordedChunksRef.current = [];
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Listen for user stopping screen share via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
        if (audioStream) {
          audioStream.getTracks().forEach(t => t.stop());
        }
      };

    } catch (err) {
      console.error("Error starting recording:", err);
      toast?.error("Failed to start recording. Please grant screen share permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleEndCall = async () => {
    if (isRecording) {
      stopRecording();
    }
    leaveRoom();

    // Update meeting status
    try {
      const duration = Math.ceil(elapsedTime / 60);

      if (meetingData?._id) {
        await api.put(`/api/meetings/${meetingData._id}/end`, { duration, notes: meetingNotes });
      }
    } catch (err) {
      console.error('Failed to end meeting:', err);
    }

    navigate(`/app/summary/${meetingData?._id || meetingId}`);
  };

  const handleCopyCode = () => {
    const code = meetingData?.meetingCode || meetingId;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build video grid items
  const videoItems = [];

  // Local user
  videoItems.push({
    key: 'local',
    name: user?.name || 'You',
    isLocal: true,
    stream: localStream,
    isAudioEnabled,
    isVideoEnabled,
    isSpeaking: false
  });

  // Remote users
  remoteStreams.forEach((stream, socketId) => {
    const participant = participants.get(socketId);
    videoItems.push({
      key: socketId,
      name: participant?.userName || 'Participant',
      isLocal: false,
      stream,
      isAudioEnabled: participant?.isAudioEnabled ?? true,
      isVideoEnabled: participant?.isVideoEnabled ?? true,
      isSpeaking: false
    });
  });

  // Determine grid layout
  const getGridClass = () => {
    const count = videoItems.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="h-screen w-full bg-[#0d111a] flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 md:px-6 py-3 flex items-center justify-between bg-[#161b22]/50 border-b border-white/5 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="bg-white/10 p-2 rounded-lg text-white hover:bg-white/20 transition-colors relative"
          >
            <Users size={18} />
            <span className="absolute -top-1 -right-1 bg-blue-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{videoItems.length}</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg text-white hover:bg-white/20 transition-colors text-xs"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {meetingData?.meetingCode || meetingId}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h2 className="text-white font-medium text-sm md:text-base truncate max-w-[200px]">
            {meetingData?.title || 'Meeting Room'}
          </h2>
          <span className="text-gray-400 bg-white/5 px-2 py-1 rounded text-xs font-mono">
            {formatTime(elapsedTime)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="text-emerald-400 text-xs hidden md:block">Connected</span>
          )}
          <button
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Video Grid */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto">
          <div className={`grid ${getGridClass()} gap-3 h-full auto-rows-fr`}>
            {videoItems.map((item) => (
              <div
                key={item.key}
                className={`relative rounded-2xl overflow-hidden bg-[#1a1f2e] ${
                  item.isSpeaking ? 'ring-2 ring-blue-500' : 'border border-white/5'
                } min-h-[180px]`}
              >
                {item.isVideoEnabled && item.stream ? (
                  <VideoTile stream={item.stream} isLocal={item.isLocal} muted={item.isLocal} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a1f2e]">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  {!item.isAudioEnabled ? (
                    <MicOff size={14} className="text-red-400" />
                  ) : (
                    <Mic size={14} className="text-emerald-400" />
                  )}
                  <span className="text-white text-sm font-medium">
                    {item.isLocal ? 'You' : item.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-72 bg-[#161b22] border-l border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-white font-medium">Participants ({videoItems.length})</h3>
              <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {videoItems.map(item => (
                <div key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-sm flex-1">{item.isLocal ? 'You' : item.name}</span>
                  {!item.isAudioEnabled && <MicOff size={14} className="text-red-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-[#161b22] border-l border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-white font-medium">In-Call Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-sm text-center mt-8">No messages yet</div>
              ) : messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col gap-1 ${msg.isMine ? 'items-end' : 'items-start'}`}>
                  <span className={`text-xs ${msg.isMine ? 'text-blue-400' : 'text-gray-500'}`}>
                    {msg.isMine ? 'You' : msg.sender} · {msg.time}
                  </span>
                  <div className={`p-3 text-sm text-white rounded-2xl max-w-[85%] ${
                    msg.isMine
                      ? 'bg-blue-600 rounded-br-sm'
                      : 'bg-white/10 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Notes (hidden but functional) */}
      <textarea
        className="hidden"
        value={meetingNotes}
        onChange={(e) => setMeetingNotes(e.target.value)}
      />

      {/* Bottom Controls */}
      <div className="py-4 flex items-center justify-center gap-3 md:gap-4 bg-[#0d111a] border-t border-white/5 relative z-10 shrink-0 px-4">
        <ControlButton
          icon={isAudioEnabled ? Mic : MicOff}
          label={isAudioEnabled ? "Mute" : "Unmute"}
          active={isAudioEnabled}
          onClick={toggleAudio}
        />
        <ControlButton
          icon={isVideoEnabled ? Video : VideoOff}
          label={isVideoEnabled ? "Camera" : "Camera Off"}
          active={isVideoEnabled}
          onClick={toggleVideo}
        />
        <ControlButton
          icon={MonitorUp}
          label={isScreenSharing ? "Stop Share" : "Share"}
          active={!isScreenSharing}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        />
        <ControlButton
          icon={MessageSquare}
          label="Chat"
          active={!showChat}
          onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
          badge={messages.length > 0 ? messages.length : null}
        />
        <ControlButton
          icon={Users}
          label="People"
          active={true}
          onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
          badge={videoItems.length}
        />
        <ControlButton
          icon={Disc}
          label={isRecording ? "Stop Rec" : "Record"}
          active={!isRecording}
          onClick={toggleRecording}
          className={isRecording ? "text-red-500 animate-pulse" : ""}
        />
        <ControlButton
          icon={BrainCircuit}
          label="Summary"
          active={true}
          onClick={() => navigate(`/app/summary/${meetingData?._id || meetingId}`)}
        />
        <ControlButton
          icon={ListTodo}
          label="Tasks"
          active={true}
          onClick={() => navigate('/app/projects')}
        />
        <button
          onClick={handleEndCall}
          className="flex flex-col items-center gap-1 ml-2"
        >
          <div className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">
            <Phone size={20} className="rotate-[135deg]" />
          </div>
          <span className="text-xs text-red-400">End</span>
        </button>
      </div>
    </div>
  );
}

// Video tile component
function VideoTile({ stream, isLocal, muted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full h-full object-cover ${isLocal ? 'transform -scale-x-100' : ''}`}
    />
  );
}

// Control button component
function ControlButton({ icon: Icon, label, active, onClick, badge, className }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 group relative ${className || ''}`}>
      <div className={`p-3 md:p-4 rounded-full transition-all ${
        active && !className?.includes('text-red-500')
          ? 'bg-[#161b22] hover:bg-[#1e2430] border border-white/10 text-white'
          : className?.includes('text-red-500')
          ? 'bg-red-500/20 border border-red-500/50 text-red-500'
          : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
      }`}>
        <Icon size={20} />
      </div>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
      <span className="text-[11px] text-gray-400 group-hover:text-gray-200">{label}</span>
    </button>
  );
}
