import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

export default function Analytics() {
  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [meetingsRes, productivityRes, engagementRes] = await Promise.all([
        fetch('/api/analytics/meetings-per-week', { headers }),
        fetch('/api/analytics/productivity', { headers }),
        fetch('/api/analytics/engagement', { headers })
      ]);

      if (meetingsRes.ok) {
        const data = await meetingsRes.json();
        setBarData(data);
      } else {
        setBarData([
          { name: 'Mon', meetings: 4 }, { name: 'Tue', meetings: 3 },
          { name: 'Wed', meetings: 7 }, { name: 'Thu', meetings: 5 },
          { name: 'Fri', meetings: 2 }
        ]);
      }

      if (productivityRes.ok) {
        const data = await productivityRes.json();
        setLineData(data);
      } else {
        setLineData([
          { name: 'Week 1', productivity: 400 }, { name: 'Week 2', productivity: 300 },
          { name: 'Week 3', productivity: 550 }, { name: 'Week 4', productivity: 450 },
          { name: 'Week 5', productivity: 600 }
        ]);
      }

      if (engagementRes.ok) {
        const data = await engagementRes.json();
        setPieData(data);
      } else {
        setPieData([{ name: 'Active', value: 30 }, { name: 'Idle', value: 70 }]);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      // Use fallback data
      setBarData([
        { name: 'Mon', meetings: 4 }, { name: 'Tue', meetings: 3 },
        { name: 'Wed', meetings: 7 }, { name: 'Thu', meetings: 5 },
        { name: 'Fri', meetings: 2 }
      ]);
      setLineData([
        { name: 'Week 1', productivity: 400 }, { name: 'Week 2', productivity: 300 },
        { name: 'Week 3', productivity: 550 }, { name: 'Week 4', productivity: 450 },
        { name: 'Week 5', productivity: 600 }
      ]);
      setPieData([{ name: 'Active', value: 30 }, { name: 'Idle', value: 70 }]);
    } finally {
      setLoading(false);
    }
  };

  const engagementRate = pieData.find(d => d.name === 'Active')?.value || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
        <div className="flex items-center gap-1 bg-[#161b22] border border-white/5 p-1 rounded-xl">
          {['overview', 'engagement'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-medium text-lg">Meetings per Week</h3>
              <p className="text-gray-500 text-xs mt-1">Last 4 weeks activity</p>
            </div>
          </div>
          <div className="flex-1 h-64 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="meetings" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line/Area Chart */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-medium text-lg">Productivity</h3>
              <p className="text-gray-500 text-xs mt-1">5-week trend</p>
            </div>
          </div>
          <div className="flex-1 h-64 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="productivity"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-medium text-lg">Engagement</h3>
              <p className="text-gray-500 text-xs mt-1">Meeting participation rate</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell key="cell-0" fill="#3b82f6" />
                  <Cell key="cell-1" fill="#1f2937" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{engagementRate}%</span>
              <span className="text-xs text-gray-500">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
