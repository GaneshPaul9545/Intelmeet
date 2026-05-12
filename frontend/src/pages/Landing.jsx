import { Link } from 'react-router-dom';
import { Play, Link2, Mic, Video, CheckSquare, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0f25]">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/30 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white font-bold">
            <Sparkles size={18} />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">IntelliMeet</span>
        </div>



        <Link to="/app" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors hidden md:block">
          Get Started
        </Link>
      </header>

      {/* Hero Content */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
          IntelliMeet – AI Meeting Platform
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Real-Time Meetings <span className="text-blue-400">+</span> AI Summaries
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link to="/app" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
            <Play size={20} fill="currentColor" />
            Start Meeting
          </Link>
          <Link to="/pre-join" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2">
            <Link2 size={20} />
            Join Meeting
          </Link>
        </div>

        {/* Hero Mockup Image Area */}
        <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#161b22]/50 backdrop-blur-xl shadow-2xl p-4 overflow-hidden">
          <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative border border-white/5">
            {/* Mocked grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 h-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-800 rounded-lg relative overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 5}`} alt="Participant" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">Participant {i}</div>
                </div>
              ))}
            </div>

            {/* Floating controls mock */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><Mic size={14} className="text-white" /></div>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><Video size={14} className="text-white" /></div>
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-sm"></div></div>
            </div>
          </div>
        </div>

        {/* Features bar */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-12">
          {[
            { icon: Sparkles, text: "AI Summaries", color: "text-purple-400", bg: "bg-purple-400/10" },
            { icon: Video, text: "HD Video Conferencing", color: "text-blue-400", bg: "bg-blue-400/10" },
            { icon: CheckSquare, text: "Task Management", color: "text-emerald-400", bg: "bg-emerald-400/10" }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/5 px-6 py-3 rounded-full">
                <div className={`p-1.5 rounded-md ${item.bg}`}>
                  <Icon size={16} className={item.color} />
                </div>
                <span className="text-sm font-medium text-white">{item.text}</span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
