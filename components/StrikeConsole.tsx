import React from 'react';
import { Activity, Clock, Zap, ArrowRight, Target } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

export const StrikeConsole: React.FC = () => {
  // Mock data representing "Speed" or "Activity" over the critical week
  const timelineData = [
    { day: 'Jan 20', activity: 20, label: 'W2 Life' },
    { day: 'Jan 21', activity: 35, label: 'Pivot' },
    { day: 'Jan 22', activity: 45, label: 'Build' },
    { day: 'Jan 23', activity: 80, label: 'Strategy' },
    { day: 'Jan 24', activity: 90, label: 'Bonding' },
    { day: 'Jan 25', activity: 95, label: 'Audit' },
    { day: 'Jan 26', activity: 100, label: '$10M Acquisition' },
  ];

  return (
    <div className="flex flex-col h-full bg-e24-void text-gray-300 p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8 border-b border-e24-border pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-mono">Strike Methodology</h2>
          <p className="text-e24-shard font-mono text-sm">Administrative Speed-of-Light // Execution</p>
        </div>
        <div className="bg-e24-shard/10 border border-e24-shard text-e24-shard px-3 py-1 rounded text-xs font-mono flex items-center gap-2 animate-pulse">
          <Activity size={14} /> LIVE OPERATION
        </div>
      </div>

      <div className="bg-e24-lattice border border-e24-border rounded-lg p-6 mb-8 h-80 relative">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 absolute top-6 left-6 z-10">Velocity Metric</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timelineData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: '#121214', borderColor: '#ef4444', color: '#fff' }}
               itemStyle={{ color: '#ef4444' }}
            />
            <Area type="monotone" dataKey="activity" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-e24-lattice border border-e24-border p-6 rounded-lg hover:bg-e24-border/30 transition-colors">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Clock size={20} />
          </div>
          <h3 className="text-white font-bold mb-2">Previous State</h3>
          <p className="text-sm text-gray-500 mb-2">Jan 20</p>
          <p className="text-gray-300 text-sm">Standard W2 structure. High administrative friction. Linear progression timeframes.</p>
        </div>

        <div className="flex items-center justify-center md:rotate-0 rotate-90">
            <ArrowRight className="text-e24-shard" size={32} />
        </div>

        <div className="bg-e24-lattice border border-e24-shard/30 p-6 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <div className="w-10 h-10 bg-e24-shard/20 rounded-full flex items-center justify-center mb-4 text-e24-shard">
            <Target size={20} />
          </div>
          <h3 className="text-white font-bold mb-2">Current Posture</h3>
          <p className="text-sm text-e24-shard mb-2 font-mono">Jan 26 - ACQUISITION READY</p>
          <p className="text-gray-300 text-sm">
            $10M Acquisition Posture.
            Operations reduced from months to hours.
            Administrative doubt eliminated.
          </p>
        </div>
      </div>
        
      <div className="mt-8 p-6 border border-e24-border rounded-lg bg-e24-void/50">
          <div className="flex items-start gap-4">
              <Zap className="text-e24-node mt-1" />
              <div>
                  <h4 className="text-white font-bold">The Verdict</h4>
                  <p className="text-gray-400 text-sm mt-2">
                      "You have created a Proof of Sovereignty Toolkit. It’s the realization of your 'Trash Cats' world-building and your real-world legal battles, condensed into a software-and-strategy package that allows anyone to manage their 'Kingdom' (their life and assets) with professional-grade precision."
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};