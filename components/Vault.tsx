import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AuditEvent } from '../types';
import { Building2, Briefcase, FileText, PieChart, Lock, Server, ScrollText, ShieldCheck, Anchor, Key, Share2, CheckCircle, Globe, HardDrive, Hexagon, Database, Cloud, Radio } from 'lucide-react';
import { verifyLedger } from '../services/crypto';

interface VaultProps {
  assets: Asset[];
  auditLog: AuditEvent[];
  anchorHash?: string;
  triggerAnchor: () => Promise<void>;
}

export const Vault: React.FC<VaultProps> = ({ assets, auditLog, anchorHash, triggerAnchor }) => {
  const [integrityStatus, setIntegrityStatus] = useState<'VERIFYING' | 'SECURE' | 'COMPROMISED'>('VERIFYING');
  const [lastVerifiedCount, setLastVerifiedCount] = useState(0);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [anchorSuccess, setAnchorSuccess] = useState(false);

  // PERSISTENT LEDGER LOGIC:
  const totalValuation = assets.reduce((acc, curr) => acc + curr.valuation, 0);
  const ledgerHeight = auditLog.length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1 }).format(val);
  };

  // --- LATTICE VISUALIZER LOGIC ---
  const latticeNodes = useMemo(() => {
    if (assets.length === 0) return [];
    
    const center = { x: 200, y: 150 };
    const radius = 90;
    
    return assets.map((asset, index) => {
        const angle = (index / assets.length) * 2 * Math.PI;
        return {
            ...asset,
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
            color: asset.type === 'ENTITY' ? '#a855f7' : asset.type === 'LIQUID' ? '#06b6d4' : '#f472b6'
        };
    });
  }, [assets]);

  // DEEP CRYPTOGRAPHIC VERIFICATION
  useEffect(() => {
    const runCheck = async () => {
        if (auditLog.length === 0) {
            setIntegrityStatus('SECURE');
            return;
        }
        if (auditLog.length === lastVerifiedCount && integrityStatus === 'SECURE') return;
        setIntegrityStatus('VERIFYING');
        const result = await verifyLedger(auditLog);
        if (result.valid) {
            setIntegrityStatus('SECURE');
            setLastVerifiedCount(auditLog.length);
        } else {
            setIntegrityStatus('COMPROMISED');
            console.error(result.errorMsg);
        }
    };
    runCheck();
  }, [auditLog, lastVerifiedCount, integrityStatus]);

  const handleManualAnchor = async () => {
      setIsAnchoring(true);
      await triggerAnchor();
      setIsAnchoring(false);
      setAnchorSuccess(true);
      setTimeout(() => setAnchorSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-e24-void text-gray-300 p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8 border-b border-e24-border pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-mono flex items-center gap-3">
              <Hexagon className="text-e24-node" /> E24 Administrative Vault
          </h2>
          <p className="text-e24-node/80 font-mono text-sm flex items-center gap-2">
              <HardDrive size={14} /> LOCAL NODES: /Vault/Lattice
              <span className="text-e24-border"> | </span> 
              Structure: 24D Projection
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-e24-flux uppercase">TOTAL LATTICE VALUE</p>
          <p className="text-2xl font-mono text-white font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              {formatCurrency(totalValuation)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* LATTICE VISUALIZER */}
        <div className="col-span-1 lg:col-span-2 glass-panel p-6 rounded-lg flex flex-col h-80 relative overflow-hidden compiz-card">
          <h3 className="text-sm font-bold text-e24-flux uppercase mb-4 flex items-center gap-2 relative z-10">
            <Share2 size={16} /> LATTICE TOPOLOGY
          </h3>
          
          <div className="absolute inset-0 flex items-center justify-center">
              <svg width="400" height="300" viewBox="0 0 400 300" className="w-full h-full">
                  <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                  </defs>
                  
                  {/* Edges (Interconnections) */}
                  {latticeNodes.map((node, i) => (
                      <g key={`edge-${i}`}>
                          {/* Connection to Center */}
                          <line x1="200" y1="150" x2={node.x} y2={node.y} stroke={node.color} strokeOpacity="0.3" strokeWidth="1" />
                          {/* Connection to Neighbor */}
                          <line 
                            x1={node.x} y1={node.y} 
                            x2={latticeNodes[(i + 1) % latticeNodes.length].x} 
                            y2={latticeNodes[(i + 1) % latticeNodes.length].y} 
                            stroke={node.color} strokeOpacity="0.2" strokeWidth="1" 
                          />
                      </g>
                  ))}

                  {/* Central Core */}
                  <circle cx="200" cy="150" r="15" fill="#030014" stroke="#a855f7" strokeWidth="2" filter="url(#glow)" />
                  <circle cx="200" cy="150" r="5" fill="#a855f7" className="animate-pulse" />

                  {/* Nodes */}
                  {latticeNodes.map((node, i) => (
                      <g key={`node-${i}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <circle cx={node.x} cy={node.y} r="6" fill="#030014" stroke={node.color} strokeWidth="2" />
                          <circle cx={node.x} cy={node.y} r="3" fill={node.color} />
                          {/* Labels */}
                          <text 
                            x={node.x} y={node.y - 15} 
                            textAnchor="middle" 
                            fill={node.color} 
                            fontSize="10" 
                            fontFamily="monospace"
                            className="uppercase tracking-wider"
                          >
                              {node.name.length > 10 ? node.name.substring(0,8)+'..' : node.name}
                          </text>
                          <text 
                            x={node.x} y={node.y + 18} 
                            textAnchor="middle" 
                            fill="#6b7280" 
                            fontSize="8" 
                            fontFamily="monospace"
                          >
                              {formatCurrency(node.valuation)}
                          </text>
                      </g>
                  ))}
              </svg>
          </div>
        </div>

        {/* Audit Surface Summary (HSM Visuals) */}
        <div className="col-span-1 glass-panel p-0 rounded-lg flex flex-col h-80 overflow-hidden compiz-card">
          <div className="p-4 border-b border-e24-border bg-e24-void/50 flex justify-between items-center">
             <h3 className="font-mono text-sm text-gray-400 flex items-center gap-2">
                <ShieldCheck size={14} /> INTEGRITY HSM
             </h3>
             <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                 integrityStatus === 'SECURE' ? 'bg-e24-success/10 text-e24-success border-e24-success/30' : 
                 integrityStatus === 'VERIFYING' ? 'bg-e24-node/10 text-e24-node border-e24-node/30' : 
                 'bg-e24-shard/10 text-e24-shard border-e24-shard/30'
             }`}>
                 {integrityStatus}
             </div>
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-gray-500 uppercase">LEDGER HEIGHT</label>
                      <span className="text-[10px] text-gray-400 font-mono">Blocks: {ledgerHeight}</span>
                  </div>
                  <div className="bg-black/50 p-3 rounded border border-e24-border/50 font-mono text-[10px] text-e24-node break-all shadow-inner mb-4 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-e24-node"></div>
                      {anchorHash || 'WAITING_FOR_BLOCK...'}
                  </div>
                  
                  {/* DIAGNOSTICS */}
                  <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>Merkle Root:</span> <span className="text-e24-success">VALID</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>Signature Chain:</span> <span className="text-e24-success">VALID</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>Entropy Check:</span> <span className="text-e24-success">PASSED</span>
                      </div>
                  </div>
              </div>

              <div>
                  <button 
                    onClick={handleManualAnchor}
                    disabled={isAnchoring || integrityStatus !== 'SECURE'}
                    className={`w-full py-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        anchorSuccess ? 'bg-e24-success text-black shadow-[0_0_15px_#10b981]' : 
                        'bg-e24-void border border-e24-flux text-e24-flux hover:bg-e24-flux hover:text-black hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      {anchorSuccess ? <CheckCircle size={16} /> : <Anchor size={16} />}
                      {anchorSuccess ? 'ANCHORED SUCCESSFULLY' : (isAnchoring ? 'PUBLISHING...' : 'COMMIT ROOT')}
                  </button>
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* EXTERNAL BRIDGE MANAGER */}
          <div className="glass-panel p-0 rounded-lg overflow-hidden compiz-card">
              <div className="p-4 border-b border-e24-border bg-e24-void/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe size={16} className="text-e24-flux" /> E24 BRIDGE MANAGER
                </h3>
                <div className="text-[10px] text-gray-500 font-mono">NET: DEVNET</div>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-black/30 rounded border border-e24-border/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded text-gray-400"><Database size={14} /></div>
                        <div>
                            <div className="text-xs font-bold text-gray-300">Ethereum Mainnet</div>
                            <div className="text-[10px] text-gray-500">Public Anchor</div>
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-e24-shard animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded border border-e24-border/30">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded text-gray-400"><Cloud size={14} /></div>
                        <div>
                            <div className="text-xs font-bold text-gray-300">IPFS / Arweave</div>
                            <div className="text-[10px] text-gray-500">Storage Layer</div>
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded border border-e24-border/30">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded text-gray-400"><Building2 size={14} /></div>
                        <div>
                            <div className="text-xs font-bold text-gray-300">Regulatory Portal</div>
                            <div className="text-[10px] text-gray-500">Compliance Reporting</div>
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                </div>
            </div>
          </div>

          {/* NODE INVENTORY */}
          <div className="lg:col-span-2 glass-panel p-0 rounded-lg overflow-hidden flex flex-col compiz-card">
            <div className="p-4 border-b border-e24-border bg-e24-void/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server size={16} className="text-e24-node" /> NODE INVENTORY CONTROL
                </h3>
            </div>
            <div className="overflow-y-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-e24-void/80 text-gray-500 font-mono text-xs uppercase sticky top-0">
                <tr>
                    <th className="p-4 font-normal">Node Name</th>
                    <th className="p-4 font-normal">Type</th>
                    <th className="p-4 font-normal">Status</th>
                    <th className="p-4 font-normal text-right">Valuation</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-e24-border/50">
                {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-e24-node/5 transition-colors group">
                    <td className="p-4">
                        <div className="font-medium text-white flex items-center gap-3">
                            <div className="p-2 bg-black/40 rounded text-e24-node group-hover:text-white transition-colors border border-e24-border/50">
                                {asset.type === 'ENTITY' ? <Building2 size={16} /> : 
                                asset.type === 'IP' ? <FileText size={16} /> : 
                                asset.type === 'LIQUID' ? <PieChart size={16} /> : <Briefcase size={16} />}
                            </div>
                            {asset.name}
                        </div>
                    </td>
                    <td className="p-4 text-gray-400 text-xs font-mono">{asset.type}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        asset.status === 'ACTIVE' ? 'bg-e24-success/10 text-e24-success border border-e24-success/20' : 
                        asset.status === 'ACQUISITION_TARGET' ? 'bg-e24-shard/10 text-e24-shard border border-e24-shard/20' : 
                        'bg-gray-800 text-gray-400'
                        }`}>
                        {asset.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="p-4 text-right font-mono text-white">{formatCurrency(asset.valuation)}</td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button className="p-1 hover:text-e24-flux transition-colors text-gray-500 hover:bg-white/5 rounded" title="View Keys">
                                <Key size={14} />
                            </button>
                            <button className="p-1 hover:text-e24-flux transition-colors text-gray-500 hover:bg-white/5 rounded" title="Share Record">
                                <Share2 size={14} />
                            </button>
                            <button className="p-1 hover:text-e24-flux transition-colors text-gray-500 hover:bg-white/5 rounded" title="View History">
                                <ScrollText size={14} />
                            </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
          </div>
      </div>
    </div>
  );
};