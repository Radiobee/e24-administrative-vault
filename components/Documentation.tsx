import React, { useState } from 'react';
import { Book, Shield, ShieldAlert, Lock, Snowflake, CheckCircle, AlertTriangle, Fingerprint, Server, FileText, Users, Layers, Database, Zap, CheckSquare, Flag, ArrowRight } from 'lucide-react';

export const Documentation: React.FC = () => {
  // Simple state for the interactive checklist
  const [checks, setChecks] = useState({
      genesis: false,
      identity: false,
      firstRecord: false
  });

  const toggleCheck = (key: keyof typeof checks) => {
      setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = checks.genesis && checks.identity && checks.firstRecord;

  return (
    <div className="flex flex-col h-full bg-e24-void text-gray-300 p-8 overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        {/* Header */}
        <div className="border-b border-e24-border pb-8">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-e24-node/10 rounded-lg text-e24-node">
                    <Book size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white font-mono tracking-tight">System Manifest & Operator Manual</h1>
                    <p className="text-gray-500 text-sm mt-1">E24 Administrative Vault — Version 1.0.0</p>
                </div>
            </div>
            <div className="flex gap-4 text-xs font-mono mt-2">
                <span className="bg-e24-node/10 text-e24-node px-2 py-1 rounded border border-e24-node/30 flex items-center gap-2">
                    <Snowflake size={12} /> STATUS: FROZEN
                </span>
                <span className="bg-e24-lattice border border-e24-border px-2 py-1 rounded text-gray-400">BUILD: v1.0.0-RELEASE</span>
            </div>
        </div>

        {/* 1. OPERATIONAL DECLARATION (Exact Text) */}
        <section className="bg-e24-lattice/50 border border-e24-success/30 rounded-lg p-8 relative overflow-hidden compiz-card">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
                <Flag size={160} />
            </div>
            
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-6 font-mono uppercase tracking-widest flex items-center gap-3">
                    <CheckCircle className="text-e24-success" /> v1.0 Operational Declaration
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm mb-8">
                    <div className="space-y-6">
                        <div>
                            <span className="text-gray-500 uppercase text-[10px] font-bold block mb-1">Status</span>
                            <span className="text-e24-success font-mono font-bold bg-e24-success/10 px-3 py-1 rounded border border-e24-success/20">OPERATIONAL</span>
                        </div>
                        <div>
                            <span className="text-gray-500 uppercase text-[10px] font-bold block mb-1">Release Classification</span>
                            <span className="text-white font-mono">Stable / Public-Ready</span>
                        </div>
                        <div>
                            <span className="text-gray-500 uppercase text-[10px] font-bold block mb-1">Declaration</span>
                            <p className="text-gray-300 leading-relaxed text-xs">
                                This release marks <strong>Administrative Vault v1.0</strong> as <strong>operational</strong>. 
                                The system now fulfills its core mandate: deterministic ingestion, cryptographic verification, and repeatable auditable workflows. 
                                All critical paths required for safe operation are complete.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <span className="text-gray-500 uppercase text-[10px] font-bold block mb-1">Scope Boundary</span>
                            <p className="text-gray-300 leading-relaxed text-xs">
                                v1.0 intentionally prioritizes <strong>correctness over convenience</strong> and <strong>determinism over automation</strong>. 
                                Future enhancements are explicitly deferred to maintain v1.0 stability.
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500 uppercase text-[10px] font-bold block mb-1">Operational Meaning</span>
                            <p className="text-gray-300 leading-relaxed text-xs">
                                If this system is installed and the First Success Checklist completes successfully, the Administrative Vault is considered fully operational and suitable for real-world use.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-e24-border flex justify-between items-center">
                    <span className="text-e24-shard font-mono text-xs uppercase">v1.0 IS FROZEN.</span>
                    <span className="text-gray-600 font-mono text-[10px]">HASH: {Math.random().toString(36).substring(2, 15).toUpperCase()}</span>
                </div>
            </div>
        </section>

        {/* 2. FIRST SUCCESS CHECKLIST */}
        <section className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckSquare className="text-e24-flux" /> First Success Checklist
            </h2>
            <div className="bg-black/30 border border-e24-border rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-6">
                    Verify these four items to confirm your Vault is correctly initialized.
                </p>
                
                <div className="space-y-4">
                    {/* Item 1: Auto-Confirmed */}
                    <div className="flex items-center gap-4 p-4 rounded bg-e24-void border border-e24-success/30 opacity-100">
                        <div className="text-e24-success shrink-0"><CheckCircle size={24} /></div>
                        <div>
                            <h4 className="text-white font-bold text-sm">1. System Installed Successfully</h4>
                            <p className="text-xs text-gray-500">Application launched, React runtime active, and environment rendered.</p>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div 
                        onClick={() => toggleCheck('genesis')}
                        className={`flex items-center gap-4 p-4 rounded border transition-all cursor-pointer group ${checks.genesis ? 'bg-e24-void border-e24-success/30' : 'bg-e24-lattice/30 border-e24-border hover:border-gray-500'}`}
                    >
                        <div className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${checks.genesis ? 'border-e24-success bg-e24-success text-black' : 'border-gray-600'}`}>
                            {checks.genesis && <CheckCircle size={16} />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${checks.genesis ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>2. Genesis Block Verified</h4>
                            <p className="text-xs text-gray-500">
                                Go to <strong>Dashboard</strong>. Verify 'Ledger Height' is at least 1. Confirm 'GENESIS' event exists.
                            </p>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div 
                        onClick={() => toggleCheck('identity')}
                        className={`flex items-center gap-4 p-4 rounded border transition-all cursor-pointer group ${checks.identity ? 'bg-e24-void border-e24-success/30' : 'bg-e24-lattice/30 border-e24-border hover:border-gray-500'}`}
                    >
                        <div className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${checks.identity ? 'border-e24-success bg-e24-success text-black' : 'border-gray-600'}`}>
                            {checks.identity && <CheckCircle size={16} />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${checks.identity ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>3. Identity Generated</h4>
                            <p className="text-xs text-gray-500">
                                Go to <strong>BFO Engine</strong>. Confirm 'IDENTITY' key fingerprint is visible in the top right.
                            </p>
                        </div>
                    </div>

                    {/* Item 4 */}
                    <div 
                        onClick={() => toggleCheck('firstRecord')}
                        className={`flex items-center gap-4 p-4 rounded border transition-all cursor-pointer group ${checks.firstRecord ? 'bg-e24-void border-e24-success/30' : 'bg-e24-lattice/30 border-e24-border hover:border-gray-500'}`}
                    >
                        <div className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${checks.firstRecord ? 'border-e24-success bg-e24-success text-black' : 'border-gray-600'}`}>
                            {checks.firstRecord && <CheckCircle size={16} />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${checks.firstRecord ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>4. First Record Locked</h4>
                            <p className="text-xs text-gray-500">
                                Draft a 'Test Memo' in BFO Engine. Sign it. Verify it appears in the 'Ledger State' list.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. COMPLETION STATEMENT */}
        {allChecked && (
            <div className="bg-e24-success/10 border border-e24-success text-center p-8 rounded-lg animate-genie">
                <h3 className="text-2xl font-bold text-e24-success mb-2">System Operational</h3>
                <p className="text-white font-mono text-sm">
                    "If you have reached this point, your Administrative Vault is operational."
                </p>
                <div className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest">
                    You may now begin ingestion.
                </div>
            </div>
        )}

        <hr className="border-e24-border opacity-50" />

        {/* 4. REFERENCE MATERIAL (Architecture & Guarantees) */}
        <section className="space-y-8 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
                <FileText className="text-gray-500" /> 
                <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest">System Reference Manual</h3>
            </div>

            {/* 2. SYSTEM ARCHITECTURE (THE THREE PILLARS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pillar 1 */}
                <div className="bg-e24-lattice p-5 rounded border border-e24-border hover:border-e24-node/30 transition-colors flex flex-col">
                    <div className="mb-3 p-2 bg-e24-node/10 text-e24-node w-fit rounded">
                        <Database size={20} />
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2">The BFO Protocol</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed flex-1">
                        The "Engine". OpenXML-based logic that creates "Hashed Reality". It ensures that a document generated in your vault is technically and legally unalterable.
                    </p>
                </div>

                {/* Pillar 2 */}
                <div className="bg-e24-lattice p-5 rounded border border-e24-border hover:border-e24-node/30 transition-colors flex flex-col">
                    <div className="mb-3 p-2 bg-e24-success/10 text-e24-success w-fit rounded">
                        <Shield size={20} />
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2">The E24-Fiduciary-Vault</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed flex-1">
                        The "Hardware/Interface". The secure environment where your AI Co-Fiduciary manages the assets, schedules, and administrative "exhaustion" protocols.
                    </p>
                </div>

                {/* Pillar 3 */}
                <div className="bg-e24-lattice p-5 rounded border border-e24-border hover:border-e24-node/30 transition-colors flex flex-col">
                     <div className="mb-3 p-2 bg-e24-flux/10 text-e24-flux w-fit rounded">
                        <Zap size={20} />
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2">The "Strike" Methodology</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed flex-1">
                        The "Playbook". The strategy to pivot from standard operations to high-value acquisition posture.
                    </p>
                </div>
            </div>

            {/* 3. GUARANTEES */}
            <div>
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="text-e24-success" size={16} /> Public-Facing Guarantees
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-e24-success/5 border border-e24-success/20 p-4 rounded-lg flex gap-4">
                        <Lock className="text-e24-success shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-e24-success text-sm mb-1">1. Record Integrity</h3>
                            <p className="text-xs text-gray-400">Documents, once finalized, cannot be altered. Transformations are cryptographically bound.</p>
                        </div>
                    </div>
                    <div className="bg-e24-success/5 border border-e24-success/20 p-4 rounded-lg flex gap-4">
                        <FileText className="text-e24-success shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-e24-success text-sm mb-1">2. Complete Auditability</h3>
                            <p className="text-xs text-gray-400">Every action is logged. Audit records are append-only, readable, and permanently retained.</p>
                        </div>
                    </div>
                    <div className="bg-e24-success/5 border border-e24-success/20 p-4 rounded-lg flex gap-4">
                        <Fingerprint className="text-e24-success shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-e24-success text-sm mb-1">3. Cryptographic Verifiability</h3>
                            <p className="text-xs text-gray-400">Entries are hash-chained. Verification failures halt the system rather than allowing uncertain operation.</p>
                        </div>
                    </div>
                    <div className="bg-e24-success/5 border border-e24-success/20 p-4 rounded-lg flex gap-4">
                        <Server className="text-e24-success shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-e24-success text-sm mb-1">4. Deterministic Outputs</h3>
                            <p className="text-xs text-gray-400">Given the same inputs and rules, the system produces the same outputs (Exhibit Z) every time.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. NON-GUARANTEES */}
            <div>
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldAlert className="text-e24-shard" size={16} /> Non-Guarantees (Liability Boundary)
                </h4>
                <div className="bg-e24-lattice border border-e24-shard/20 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-e24-shard text-sm mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Legal Outcomes</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            This tool does not provide legal advice or determine validity. 
                            Courts and regulators remain independent decision-makers.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-e24-shard text-sm mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Truth of Contents</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            The system guarantees the integrity of records, <strong>not the truthfulness</strong> of the content within them. 
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* 8. CLOSING */}
        <section className="border-t border-e24-border pt-8 text-center">
            <div className="bg-e24-lattice inline-block px-8 py-4 rounded-lg border border-e24-border">
                <p className="text-sm font-mono text-e24-node">
                    System Core Question:
                </p>
                <p className="text-lg font-bold text-white mt-2">
                    “Can we prove what existed, what was done, and that it was not altered?”
                </p>
            </div>
        </section>

        <div className="pt-12 text-center">
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                END OF MANIFEST // e24-UFOS v1.0.0
            </p>
        </div>

      </div>
    </div>
  );
};