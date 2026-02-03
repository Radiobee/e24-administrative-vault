import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Terminal, Lock, Globe } from 'lucide-react';

interface SystemGateProps {
  onEnter: () => void;
}

export const SystemGate: React.FC<SystemGateProps> = ({ onEnter }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [agreed, setAgreed] = useState({
      notLegalAdvice: false,
      operatorResponsibility: false,
      failClosed: false
  });

  const allAgreed = agreed.notLegalAdvice && agreed.operatorResponsibility && agreed.failClosed;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 font-mono">
        <div className="max-w-2xl w-full bg-e24-lattice/20 border border-e24-border rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="p-6 border-b border-e24-border bg-e24-void/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-e24-node/10 rounded-full flex items-center justify-center text-e24-node">
                    <Globe size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tighter">E24 Administrative Vault</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-e24-node uppercase tracking-widest">UFOS v1.0.0</span>
                        <span className="text-[10px] bg-e24-success/10 text-e24-success px-1.5 py-0.5 rounded border border-e24-success/20">CORE FROZEN</span>
                    </div>
                </div>
            </div>

            {/* Content Step 1: Definition */}
            {step === 1 && (
                <div className="p-8 space-y-6">
                    <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                        <p className="font-bold text-white">SYSTEM DEFINITION</p>
                        <p>
                            This is a <strong>Proof of Sovereignty Toolkit</strong> structured on the <strong>E24 Leech Lattice</strong>.
                        </p>
                        <p>
                            It is a deterministic integrity engine designed to bridge <strong>Private Law</strong> (your intent) and <strong>Public Record</strong> (demonstrable proof).
                            It creates a "Hashed Reality" where administrative actions are mathematically linked, time-stamped, and signed.
                        </p>
                        <div className="bg-e24-void p-4 rounded border border-e24-border text-xs">
                            <strong className="text-e24-flux block mb-2">CORE GUARANTEES (v1.0):</strong>
                            <ul className="list-disc pl-4 space-y-1 text-gray-400">
                                <li><strong>Immutability:</strong> Once signed, records cannot be altered without breaking the G24 code.</li>
                                <li><strong>Fail-Closed:</strong> If integrity checks fail, the system halts operations immediately.</li>
                                <li><strong>Sovereignty:</strong> Private keys are generated locally. Your identity never leaves this machine.</li>
                            </ul>
                        </div>
                    </div>
                    <button 
                        onClick={() => setStep(2)}
                        className="w-full bg-e24-node text-black font-bold py-4 rounded flex items-center justify-center gap-2 hover:bg-purple-400 transition-colors"
                    >
                        INITIALIZE BOOT SEQUENCE <Terminal size={16} />
                    </button>
                </div>
            )}

            {/* Content Step 2: Liability & Responsibility */}
            {step === 2 && (
                <div className="p-8 space-y-6">
                    <div className="bg-e24-shard/10 border border-e24-shard/30 p-4 rounded flex items-start gap-3">
                        <ShieldAlert size={20} className="text-e24-shard shrink-0 mt-0.5" />
                        <div className="text-xs text-e24-shard">
                            <strong>OPERATOR ACKNOWLEDGMENT REQUIRED</strong><br/>
                            You are the sole Fiduciary. The system enforces your rules; it does not replace your judgment.
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 rounded border border-e24-border hover:bg-e24-void cursor-pointer transition-colors">
                            <div className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center ${agreed.notLegalAdvice ? 'bg-e24-node border-e24-node text-black' : 'border-gray-600'}`}>
                                {agreed.notLegalAdvice && <CheckCircle size={12} />}
                            </div>
                            <input type="checkbox" className="hidden" onChange={() => setAgreed(prev => ({...prev, notLegalAdvice: !prev.notLegalAdvice}))} />
                            <div className="text-sm text-gray-300">
                                <strong className="text-white block">Not Legal Advice</strong>
                                This tool provides cryptographic certainty, not legal counsel. Its outputs (BFOs) are evidence of intent, not court rulings.
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded border border-e24-border hover:bg-e24-void cursor-pointer transition-colors">
                            <div className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center ${agreed.operatorResponsibility ? 'bg-e24-node border-e24-node text-black' : 'border-gray-600'}`}>
                                {agreed.operatorResponsibility && <CheckCircle size={12} />}
                            </div>
                            <input type="checkbox" className="hidden" onChange={() => setAgreed(prev => ({...prev, operatorResponsibility: !prev.operatorResponsibility}))} />
                            <div className="text-sm text-gray-300">
                                <strong className="text-white block">Fiduciary Responsibility</strong>
                                I verify that I have authority to bind the assets managed within this Vault.
                            </div>
                        </label>

                         <label className="flex items-start gap-3 p-3 rounded border border-e24-border hover:bg-e24-void cursor-pointer transition-colors">
                            <div className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center ${agreed.failClosed ? 'bg-e24-node border-e24-node text-black' : 'border-gray-600'}`}>
                                {agreed.failClosed && <CheckCircle size={12} />}
                            </div>
                            <input type="checkbox" className="hidden" onChange={() => setAgreed(prev => ({...prev, failClosed: !prev.failClosed}))} />
                            <div className="text-sm text-gray-300">
                                <strong className="text-white block">Fail-Closed Architecture</strong>
                                I understand that if I alter the audit log externally, the system will permanently lock to preserve integrity.
                            </div>
                        </label>
                    </div>

                    <button 
                        onClick={() => {
                            if (allAgreed) {
                                localStorage.setItem('e8_disclaimer_accepted', 'true');
                                onEnter();
                            }
                        }}
                        disabled={!allAgreed}
                        className="w-full bg-e24-success text-black font-bold py-4 rounded flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Lock size={16} /> ACCEPT & ENTER VAULT
                    </button>
                </div>
            )}
            
            <div className="p-4 border-t border-e24-border bg-black text-center text-[10px] text-gray-600 font-mono">
                SECURE BOOTLOADER <span className="text-gray-800 mx-2">//</span> ID: {Math.floor(Math.random() * 1000000)}
            </div>
        </div>
    </div>
  );
};