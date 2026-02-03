import React from 'react';
import { Asset, BFOObject, AuditEvent } from '../types';
import { Users, Hexagon, Globe, Activity, ShieldCheck, Database, FileText, ArrowUpRight, Clock, Lock, Network, Share2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  assets: Asset[];
  bfos: BFOObject[];
  auditLog: AuditEvent[];
  systemStatus: 'BOOTING' | 'ONLINE' | 'HALTED';
}

export const Dashboard: React.FC<DashboardProps> = ({ assets, bfos, auditLog, systemStatus }) => {
  // 1. Calculate Live Metrics
  const totalValuation = assets.reduce((acc, curr) => acc + curr.valuation, 0);
  const ledgerHeight = auditLog.length;
  const immutableRecords = bfos.filter(b => b.status === 'IMMUTABLE').length;
  const recentEvents = auditLog.slice(0, 5);

  // 2. Mock Trend Data
  const activityData = auditLog.slice(0, 20).map((_, i) => ({
    val: 10 + Math.random() * 50 + (i * 2)
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1 }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-300 p-8 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-e24-border pb-6">
        <div>
          <h1 className="text-4xl font-bold text-white font-mono tracking-tighter mb-2 flex items-center gap-3">
            <Hexagon className="text-e24-node animate-pulse-slow" size={32} />
            <span><span className="text-e24-node">E24</span> Administrative Vault</span>
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-e24-flux">
            <span className={`w-2 h-2 rounded-full ${systemStatus === 'ONLINE' ? 'bg-e24-success animate-pulse' : 'bg-e24-shard'}`}></span>
            STATE: {systemStatus} // GOLAY CODE: ACTIVE
          </div>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-e24-node/70 text-xs uppercase mb-1">TOTAL LATTICE VALUATION</p>
          <p className="text-3xl font-bold text-white font-mono drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            {formatCurrency(totalValuation)}
          </p>
        </div>
      </div>

      {/* KPI Grid - Compiz 3D Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: Nodes (Assets) */}
        <div className="glass-panel p-5 rounded-lg compiz-card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-e24-node/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-2 bg-e24-node/10 text-e24-node rounded-lg group-hover:bg-e24-node/20 transition-colors">
              <Network size={20} />
            </div>
            <ArrowUpRight size={16} className="text-gray-600 group-hover:text-e24-node" />
          </div>
          <div className="text-2xl font-bold text-white font-mono relative z-10">{assets.length}</div>
          <div className="text-xs text-gray-500 uppercase relative z-10">ACTIVE VERTICES</div>
        </div>

        {/* Metric 2: Ledger Height */}
        <div className="glass-panel p-5 rounded-lg compiz-card group relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-e24-flux/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-2 bg-e24-flux/10 text-e24-flux rounded-lg group-hover:bg-e24-flux/20 transition-colors">
              <Database size={20} />
            </div>
             <Activity size={16} className="text-gray-600 group-hover:text-e24-flux" />
          </div>
          <div className="text-2xl font-bold text-white font-mono relative z-10">{ledgerHeight}</div>
          <div className="text-xs text-gray-500 uppercase relative z-10">LATTICE HEIGHT</div>
        </div>

        {/* Metric 3: Immutable Records */}
        <div className="glass-panel p-5 rounded-lg compiz-card group relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-e24-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-2 bg-e24-success/10 text-e24-success rounded-lg group-hover:bg-e24-success/20 transition-colors">
              <ShieldCheck size={20} />
            </div>
            <Lock size={16} className="text-gray-600 group-hover:text-e24-success" />
          </div>
          <div className="text-2xl font-bold text-white font-mono relative z-10">{immutableRecords}</div>
          <div className="text-xs text-gray-500 uppercase relative z-10">LOCKED SHARDS</div>
        </div>

        {/* Metric 4: System Load (Chart) */}
        <div className="glass-panel p-0 rounded-lg compiz-card overflow-hidden relative h-40">
          <div className="absolute top-5 left-5 z-20">
             <div className="text-lg font-bold text-white font-mono">100%</div>
             <div className="text-xs text-gray-500 uppercase">PARITY CHECK</div>
          </div>
          {/* Chart Background */}
          <div className="absolute left-0 right-0 bottom-0 top-8 opacity-30 z-10">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={activityData}>
                 <Area type="monotone" dataKey="val" stroke="#a855f7" fill="#a855f7" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Mission Control */}
        <div className="lg:col-span-2 flex flex-col gap-8">
            {/* System Philosophy Card */}
            <div className="bg-gradient-to-r from-e24-lattice via-e24-void to-e24-lattice border border-e24-border rounded-xl p-8 relative overflow-hidden flex flex-col justify-center min-h-[200px] shadow-[0_0_30px_rgba(49,46,129,0.2)] hover:shadow-[0_0_50px_rgba(49,46,129,0.4)] transition-shadow duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-e24-node animate-spin-slow">
                    <Hexagon size={140} />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-e24-flux font-mono text-xs uppercase tracking-widest">E24 DEFINITION</h3>
                    <div className="px-2 py-0.5 rounded border border-e24-flux/30 bg-e24-flux/10 text-[10px] text-e24-flux font-bold">
                        FROZEN CORE v2.0
                    </div>
                </div>
                <p className="text-xl md:text-2xl font-light text-white max-w-2xl leading-relaxed z-10">
                   "A 24-dimensional Fail-Closed environment where administrative noise is filtered through quantum-grade error correction (G24)."
                </p>
                <div className="mt-6 flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Users size={14} className="text-e24-node" /> Deterministic State-Vectors
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FileText size={14} className="text-e24-flux" /> Holographic Redundancy
                    </div>
                </div>
            </div>

            {/* Quick Actions / Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-lg compiz-card">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-e24-shard" /> TEMPORAL AXIS
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">72-HOUR GRACE WINDOW MONITORED.</p>
                    <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                        <div className="bg-e24-shard w-3/4 h-full shadow-[0_0_10px_#f472b6]"></div>
                    </div>
                </div>
                 <div className="glass-panel p-4 rounded-lg compiz-card">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <Lock size={16} className="text-e24-success" /> FAIL-CLOSED SYMMETRY
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">ZERO-TRUST ENFORCED. DISHONOR = LOCK.</p>
                     <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                        <div className="bg-e24-success w-full h-full shadow-[0_0_10px_#10b981]"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="glass-panel rounded-lg flex flex-col overflow-hidden compiz-card h-full">
             <div className="p-4 border-b border-e24-border bg-e24-void/50 flex justify-between items-center">
                <h3 className="font-mono text-sm text-white flex items-center gap-2">
                    <Activity size={14} className="text-e24-flux" /> LATTICE EVENTS
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {recentEvents.length === 0 && (
                    <div className="text-center text-xs text-gray-600 py-10">Initializing Leech Lattice...</div>
                )}
                {recentEvents.map((evt) => (
                    <div key={evt.id} className="relative pl-4 border-l border-e24-border pb-1 group/item">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-e24-void border border-e24-border group-hover/item:bg-e24-node transition-colors"></div>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                evt.actor === 'SYSTEM' ? 'bg-e24-flux/10 text-e24-flux' : 
                                evt.actor === 'USER' ? 'bg-e24-shard/10 text-e24-shard' : 
                                'bg-gray-800 text-gray-400'
                            }`}>
                                {evt.actor}
                            </span>
                            <span className="text-[10px] text-gray-600 font-mono">
                                {evt.timestamp.split('T')[1].substr(0,5)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-300 mb-1">{evt.details}</p>
                        <p className="text-[10px] text-e24-node/60 font-mono truncate">{evt.hash}</p>
                    </div>
                ))}
             </div>
             <div className="p-3 border-t border-e24-border bg-e24-void/50 text-center">
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest">END OF STREAM</span>
             </div>
        </div>
      </div>
    </div>
  );
};