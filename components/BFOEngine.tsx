import React, { useState, useEffect, useRef } from 'react';
import { BFOObject, FlowStage, AuthorityLevel, AuditEvent, GovernanceMode, AuditMetadata } from '../types';
import { Shield, CheckCircle, Hash, AlertTriangle, ArrowRight, Play, Server, PenTool, Lock, ListChecks, Check, X, Users, User, Clock, GitBranch, Link, RotateCcw, Eye, FileCheck, Timer, Siren, RefreshCcw, Key, Fingerprint, FileSignature, Zap, Snowflake, TrendingUp, Cpu, Gavel } from 'lucide-react';
import { analyzeFiduciaryIntent, FiduciaryAnalysis } from '../services/geminiService';
import { generateKeyPair, signData, computeHash, getIdentityFingerprint } from '../services/crypto';

interface BFOEngineProps {
  bfos: BFOObject[];
  addBFO: (bfo: BFOObject) => void;
  auditLog: AuditEvent[];
  addAuditEvent: (event: Omit<AuditEvent, 'hash' | 'previousHash' | 'timestamp'>) => void;
}

export const BFOEngine: React.FC<BFOEngineProps> = ({ bfos, addBFO, auditLog, addAuditEvent }) => {
  // Config State
  const [governanceMode, setGovernanceMode] = useState<GovernanceMode>('SOLE_FIDUCIARY');

  // Key Management (Persistent)
  const userKeys = useRef<CryptoKeyPair | null>(null);
  const [keyStatus, setKeyStatus] = useState<'GENERATING' | 'READY'>('GENERATING');
  const [keyFingerprint, setKeyFingerprint] = useState<string>('...');

  // OPINIONATED PRESETS
  const PRESETS = [
    { label: 'Board Resolution', icon: Users, text: 'Draft a binding Board Resolution to authorize the acquisition of [ASSET] for [AMOUNT], appointing [OFFICER] as signatory.' },
    { label: 'IP Assignment', icon: Cpu, text: 'Irrevocable assignment of all Intellectual Property rights regarding project [PROJECT_NAME] from [CREATOR] to [HOLDING_COMPANY].' },
    { label: 'Emergency Freeze', icon: Snowflake, text: 'EXECUTE IMMEDIATE ADMINISTRATIVE FREEZE on all liquid assets held by [ENTITY] due to suspected security compromise.' },
    { label: 'Capital Call', icon: TrendingUp, text: 'Issue a formal Capital Call to shareholders of [ENTITY] for the total amount of [AMOUNT], payable by [DATE].' },
  ];

  useEffect(() => {
    const initKeys = async () => {
      userKeys.current = await generateKeyPair(false); // False = Try to load existing first
      if (userKeys.current) {
          const fp = await getIdentityFingerprint(userKeys.current.publicKey);
          setKeyFingerprint(fp);
      }
      setKeyStatus('READY');
    };
    initKeys();
  }, []);

  // Canonical Flow State
  const [flowStage, setFlowStage] = useState<FlowStage>('INTAKE');
  const [intentInput, setIntentInput] = useState('');
  const [analysis, setAnalysis] = useState<FiduciaryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeReferenceId, setActiveReferenceId] = useState<string | undefined>(undefined);
  
  // Signing State
  const [soleSignature, setSoleSignature] = useState('');
  const [safetyInterlock, setSafetyInterlock] = useState(false); // UX Hardening
  const [councilSignatures, setCouncilSignatures] = useState<{id: string, name: string, signed: boolean, sig: string}[]>([
      { id: '1', name: 'Chair (You)', signed: false, sig: '' },
      { id: '2', name: 'Member A', signed: false, sig: '' },
      { id: '3', name: 'Member B', signed: false, sig: '' }
  ]);
  const [pendingAuthority, setPendingAuthority] = useState<AuthorityLevel | null>(null);

  // MAXIMAL CAPTURE HELPER (Updated for Locked Schema)
  const addEntry = (action: AuditEvent['action'], details: string, rationale: string, context: Record<string, any> = {}, signature?: string, authorityLevel?: AuthorityLevel) => {
    const metadata: AuditMetadata = {
        schema: '1.0.0',
        sourceType: 'USER_INPUT',
        sourceIdentity: `KEY-${keyFingerprint}`,
        governanceMode: governanceMode,
        authorityLevel: authorityLevel,
        context: {
            ...context,
            flowStage: flowStage,
            referenceId: activeReferenceId || null,
            councilStatus: governanceMode === 'JOINT_COUNCIL' ? councilSignatures : 'N/A'
        }
    };

    addAuditEvent({
      id: `EVT-${Math.floor(Math.random() * 100000)}`,
      actor: action === 'ANALYSIS' ? 'AI_CO_FIDUCIARY' : (governanceMode === 'JOINT_COUNCIL' && action === 'RATIFICATION' ? 'COUNCIL_MAJORITY' : 'USER'),
      action,
      details,
      rationale,
      metadata: metadata,
      signature // Pass signature if available
    });
  };

  const handleAnalyze = async () => {
    if (!intentInput.trim()) return;
    
    setFlowStage('ANALYSIS');
    setIsAnalyzing(true);
    addEntry('INTAKE', `Intent captured: "${intentInput.substring(0, 30)}..."`, 'User Initiation', { fullIntent: intentInput });

    const result = await analyzeFiduciaryIntent(intentInput);
    
    if (result.technicalFailure) {
        addEntry('SYSTEM_HALT', 'Critical Failure in Analysis Engine. Workflow Suspended.', 'Safety Protocol Triggered', { error: 'GenAI Malfunction', fullAnalysisResult: result });
    } else {
        const complianceScore = [result.compliance.syntaxValid, result.compliance.assetIdentified, result.compliance.intentUnambiguous].filter(Boolean).length;
        addEntry('ANALYSIS', `Compliance: ${complianceScore}/3 // Risk: ${result.riskLevel}`, 'Automated Gatekeeper Assessment', { 
            compliance: result.compliance, 
            processRisk: result.riskLevel,
            suggestedClassification: result.suggestedClassification,
            reasoning: result.reasoning
        });
    }
    
    setAnalysis(result);
    setIsAnalyzing(false);
    setFlowStage('DECISION');
  };

  const handleRefine = () => {
      addEntry('INTAKE', 'Loop Back: User requested refinement.', 'Iterative Correction', { previousStage: 'DECISION', currentIntent: intentInput });
      setFlowStage('INTAKE');
      setAnalysis(null);
  };
  
  const handleManualIntervention = () => {
      addEntry('MANUAL_INTERVENTION', 'Human Operator cleared system halt. Reseting flow.', 'Administrator Override', { resetTarget: 'INTAKE', previousState: 'SYSTEM_HALT' });
      setAnalysis(null);
      setFlowStage('INTAKE');
  };

  const initiateSigning = (override: boolean) => {
      if (!analysis) return;
      const authority: AuthorityLevel = override ? 'OVERRIDE' : (analysis.recommendation === 'APPROVE' ? 'JOINT_CONSENSUS' : 'HUMAN_SOLE');
      setPendingAuthority(authority);
      setFlowStage('SIGNING');
      setSoleSignature('');
      setSafetyInterlock(false);
      setCouncilSignatures(prev => prev.map(m => ({...m, signed: false, sig: ''})));
  };

  const signForCouncilMember = (id: string, initials: string) => {
      setCouncilSignatures(prev => prev.map(m => m.id === id ? { ...m, signed: true, sig: initials.toUpperCase() } : m));
  };

  const initiateLinkedMatter = (targetId: string) => {
      setActiveReferenceId(targetId);
      setIntentInput(`LINKED MATTER to ${targetId}: [Enter details of correction, dispute, or follow-on action]`);
      setFlowStage('INTAKE');
  };

  const handleCommit = async () => {
    if (!analysis || !pendingAuthority || !userKeys.current || !safetyInterlock) return;

    let finalSignatures: string[] = [];
    
    // 1. Determine signatures for BFO
    if (governanceMode === 'SOLE_FIDUCIARY') {
        if (!soleSignature.trim()) return;
        finalSignatures = [soleSignature];
    } else {
        const signedCount = councilSignatures.filter(m => m.signed).length;
        if (signedCount < 2) return; 
        finalSignatures = councilSignatures.filter(m => m.signed).map(m => m.sig);
    }

    // 2. CONSTRUCT PAYLOAD
    // We create a "Content Object" separate from the BFO to hash it cleanly
    const timestamp = new Date().toISOString();
    const bfoContent = {
        id: `BFO-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // Time-bound ID
        timestamp: timestamp.slice(0, 16).replace('T', ' '),
        type: analysis.suggestedClassification,
        status: 'IMMUTABLE' as const,
        contentSummary: intentInput.substring(0, 100), // Summary for list view
        authorityLevel: pendingAuthority,
        governance: governanceMode,
        signatures: finalSignatures,
        referenceId: activeReferenceId,
    };

    // 3. CRYPTOGRAPHIC BINDING
    // Hash the *entire content* of the BFO
    const contentHash = await computeHash(bfoContent);

    const newBFO: BFOObject = {
      ...bfoContent,
      id: bfoContent.id,
      hash: contentHash, // The ID of the record is its Content Hash
    };

    // 4. SIGNING THE HASH
    // The user signs the hash of the BFO, proving they authorized THIS specific state
    let digitalSignature = '';
    try {
        digitalSignature = await signData(userKeys.current.privateKey, contentHash);
    } catch (e) {
        console.error("Signing failed", e);
        return;
    }

    addBFO(newBFO);
    
    // 5. Log Audit with Signature
    addEntry(
        pendingAuthority === 'OVERRIDE' ? 'OVERRIDE' : 'APPROVAL', 
        `Committed to Vault. Authority: ${pendingAuthority}`, 
        'Final Execution (Digitally Signed)', 
        { bfoId: newBFO.id, finalHash: contentHash, fullObjectSnapshot: newBFO },
        digitalSignature,
        pendingAuthority
    );
    
    setFlowStage('COMMITTED');
  };

  const discardFlow = () => {
    addEntry('REJECTION', 'User discarded BFO draft.', 'User Cancellation', { abandonedState: { intentInput, analysis } });
    resetFlow();
  };

  const resetFlow = () => {
    setFlowStage('INTAKE');
    setIntentInput('');
    setAnalysis(null);
    setSoleSignature('');
    setPendingAuthority(null);
    setActiveReferenceId(undefined);
  };

  const isCompliant = analysis && analysis.compliance.syntaxValid && analysis.compliance.assetIdentified && analysis.compliance.intentUnambiguous;
  const councilSignedCount = councilSignatures.filter(m => m.signed).length;
  const councilMajorityReached = councilSignedCount >= 2;
  
  // Lifecycle visual helper
  const getStepStatus = (step: number) => {
      let currentStep = 1;
      if (flowStage === 'ANALYSIS') currentStep = 2;
      if (flowStage === 'DECISION') currentStep = 3;
      if (flowStage === 'SIGNING') currentStep = 4;
      if (flowStage === 'COMMITTED') currentStep = 5;

      if (step < currentStep) return 'completed';
      if (step === currentStep) return 'active';
      return 'pending';
  };

  return (
    <div className="flex flex-col h-full bg-e24-void text-gray-300 p-8 overflow-y-auto relative">
      {/* Key Status Indicator */}
      <div className="absolute top-8 right-8 flex items-center gap-2 text-[10px] font-mono border border-e24-border px-3 py-1 rounded bg-e24-lattice/50">
         <Key size={12} className={keyStatus === 'READY' ? 'text-e24-success' : 'text-gray-500 animate-pulse'} />
         <span className="text-gray-500">IDENTITY:</span>
         <span className="text-e24-flux font-bold">{keyFingerprint}</span>
      </div>

      {/* Lifecycle Header */}
      <div className="flex flex-col mb-8 pb-6">
        <div className="flex justify-between items-start mb-6">
            <div>
            <h2 className="text-3xl font-bold text-white mb-2 font-mono">BFO Protocol Engine</h2>
            <div className="flex items-center gap-2">
                <p className="text-e24-flux font-mono text-sm">LIFECYCLE ENFORCEMENT</p>
                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">Schema v1.0.0 (Locked)</span>
            </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-gray-500 uppercase">Governance Mode</div>
                <div className="flex bg-e24-lattice border border-e24-border rounded p-1">
                    <button 
                        onClick={() => setGovernanceMode('SOLE_FIDUCIARY')}
                        disabled={flowStage !== 'INTAKE'}
                        className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-2 transition-colors ${governanceMode === 'SOLE_FIDUCIARY' ? 'bg-e24-node text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                    >
                        <User size={12} /> SOLE
                    </button>
                    <button 
                        onClick={() => setGovernanceMode('JOINT_COUNCIL')}
                        disabled={flowStage !== 'INTAKE'}
                        className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-2 transition-colors ${governanceMode === 'JOINT_COUNCIL' ? 'bg-e24-flux text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Users size={12} /> COUNCIL
                    </button>
                </div>
            </div>
        </div>

        {/* COMPRESSION: GLASS CHEVRON PIPELINE */}
        <div className="grid grid-cols-5 gap-0 w-full max-w-5xl mx-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            {[
                { label: 'Intake', icon: PenTool },
                { label: 'AI Logic', icon: Server },
                { label: 'Review', icon: Eye },
                { label: 'Signing', icon: FileSignature },
                { label: 'Ledger', icon: Lock }
            ].map((step, idx) => {
                const status = getStepStatus(idx + 1);
                // Glass-step styling hack for chevron effect using z-index and negative margin
                return (
                    <div 
                        key={idx} 
                        className={`
                            relative h-14 flex items-center justify-center gap-2 transition-all duration-500 overflow-hidden
                            ${idx === 0 ? 'rounded-l-lg' : ''} 
                            ${idx === 4 ? 'rounded-r-lg' : ''}
                            ${status === 'active' ? 'bg-e24-flux/20 border-t border-b border-e24-flux/50 text-white shadow-[0_0_30px_rgba(6,182,212,0.2)] z-10 scale-105' : ''}
                            ${status === 'completed' ? 'bg-e24-success/10 border-t border-b border-e24-success/30 text-e24-success' : ''}
                            ${status === 'pending' ? 'bg-e24-lattice border-t border-b border-e24-border text-gray-600' : ''}
                        `}
                        style={{ marginLeft: idx === 0 ? 0 : '-10px', zIndex: status === 'active' ? 20 : 10 - idx }}
                    >
                        {/* Background Gloss */}
                        {status === 'active' && <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 pointer-events-none"></div>}
                        
                        <step.icon size={16} className={`${status === 'active' ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{step.label}</span>
                        
                        {/* Right Chevron Edge Visual Mockup using border (Alternative to clip-path for cleaner text rendering) */}
                        {idx !== 4 && (
                            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/50"></div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: THE CANONICAL FLOW */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STAGE 1: INTAKE */}
          <div className={`glass-panel rounded-lg p-6 transition-all duration-300 compiz-card ${flowStage === 'INTAKE' ? 'border-e24-flux/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'opacity-60 grayscale'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="bg-e24-flux/20 text-e24-flux w-6 h-6 rounded flex items-center justify-center text-xs font-mono">1</span>
                    Intake & Definition
                </h3>
            </div>

            {/* OPINIONATED PRESETS */}
            {flowStage === 'INTAKE' && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PRESETS.map((p) => (
                        <button 
                            key={p.label}
                            onClick={() => setIntentInput(p.text)}
                            className="bg-e24-void hover:bg-e24-flux/10 border border-e24-border hover:border-e24-flux text-xs p-2 rounded text-left transition-colors group flex flex-col gap-1 h-full"
                        >
                            <span className="flex items-center gap-1 text-gray-400 group-hover:text-e24-flux font-bold">
                                <p.icon size={12} /> {p.label}
                            </span>
                            <span className="text-[9px] text-gray-600 truncate w-full">{p.text}</span>
                        </button>
                    ))}
                </div>
            )}
            
            {activeReferenceId && (
                <div className="mb-4 bg-e24-flux/10 border border-e24-flux/30 p-2 rounded flex items-center gap-2 text-e24-flux text-xs font-mono">
                    <Link size={12} />
                    <span>CHAINING NEW RECORD TO: {activeReferenceId}</span>
                </div>
            )}

            <textarea
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                disabled={flowStage !== 'INTAKE'}
                placeholder={activeReferenceId ? "DEFINE FOLLOW-ON ACTION..." : "DECLARE ADMINISTRATIVE INTENT OR SELECT A PRESET..."}
                className="w-full bg-black/40 border border-e24-border rounded p-4 text-sm font-mono focus:border-e24-flux focus:outline-none transition-colors h-32 resize-none mb-4"
            />
            {flowStage === 'INTAKE' && (
                <button 
                    onClick={handleAnalyze}
                    disabled={!intentInput.trim()}
                    className="bg-e24-flux text-black font-bold px-4 py-3 rounded text-sm hover:bg-cyan-400 transition-colors flex items-center gap-2 disabled:opacity-50 w-full justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                >
                    <Play size={16} /> INITIATE ANALYSIS
                </button>
            )}
          </div>

          {/* STAGE 2: ANALYSIS & DECISION (HUMAN REVIEW) */}
          {(flowStage === 'ANALYSIS' || flowStage === 'DECISION' || flowStage === 'SIGNING' || flowStage === 'COMMITTED') && (
             <div className={`glass-panel rounded-lg p-6 transition-all duration-300 compiz-card ${flowStage === 'DECISION' ? 'border-e24-node/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : (flowStage === 'SIGNING' ? 'opacity-50' : '')}`}>
                 <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <span className="bg-e24-node/20 text-e24-node w-6 h-6 rounded flex items-center justify-center text-xs font-mono">{flowStage === 'ANALYSIS' ? '2' : '3'}</span>
                    {flowStage === 'ANALYSIS' ? 'AI Processing' : 'Human Review & Decision'}
                </h3>
                
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="w-12 h-12 border-4 border-e24-node border-t-transparent rounded-full animate-spin"></div>
                        <div className="flex items-center gap-3 text-e24-flux animate-pulse font-mono text-sm">
                            <Server size={18} /> PROCESSING LOGIC GATES...
                        </div>
                    </div>
                ) : analysis ? (
                    <div className="space-y-4 animate-genie">
                        
                        {/* FAIL-CLOSED STATE: TECHNICAL FAILURE */}
                        {analysis.technicalFailure ? (
                            <div className="bg-e24-void/80 border-2 border-e24-shard p-6 rounded flex flex-col items-center justify-center text-center animate-pulse shadow-[0_0_30px_rgba(244,114,182,0.1)]">
                                <AlertTriangle size={48} className="text-e24-shard mb-4" />
                                <h4 className="text-xl font-bold text-e24-shard uppercase mb-2">System Halted</h4>
                                <p className="text-gray-300 max-w-md mb-6">
                                    Critical failure in Analysis Engine. Fiduciary chain broken. 
                                    Progression stopped to prevent state corruption.
                                </p>
                                <button 
                                    onClick={handleManualIntervention}
                                    className="bg-e24-shard text-black font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-pink-500 transition-colors"
                                >
                                    <RefreshCcw size={18} /> MANUAL INTERVENTION: RESET
                                </button>
                                <p className="text-[10px] text-e24-shard/60 mt-3 font-mono">
                                    LOGGED AS 'MANUAL_INTERVENTION'
                                </p>
                            </div>
                        ) : (
                            /* STANDARD DECISION UI */
                            <>
                                {/* Compliance Gatekeeper UI */}
                                <div className="bg-black/30 p-4 rounded border border-e24-border flex flex-col gap-3">
                                    <h4 className="text-xs text-gray-500 uppercase flex items-center gap-2">
                                        <ListChecks size={14} /> MECHANICAL COMPLIANCE
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className={`flex items-center gap-2 text-xs p-2 rounded border ${analysis.compliance.syntaxValid ? 'border-e24-success/30 bg-e24-success/10 text-e24-success' : 'border-e24-shard/30 bg-e24-shard/10 text-e24-shard'}`}>
                                            {analysis.compliance.syntaxValid ? <Check size={12} /> : <X size={12} />} Syntax
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs p-2 rounded border ${analysis.compliance.assetIdentified ? 'border-e24-success/30 bg-e24-success/10 text-e24-success' : 'border-e24-shard/30 bg-e24-shard/10 text-e24-shard'}`}>
                                            {analysis.compliance.assetIdentified ? <Check size={12} /> : <X size={12} />} Asset ID
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs p-2 rounded border ${analysis.compliance.intentUnambiguous ? 'border-e24-success/30 bg-e24-success/10 text-e24-success' : 'border-e24-shard/30 bg-e24-shard/10 text-e24-shard'}`}>
                                            {analysis.compliance.intentUnambiguous ? <Check size={12} /> : <X size={12} />} Clarity
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 bg-black/20 p-3 rounded border border-e24-border">
                                        <span className="text-xs text-gray-500 uppercase block mb-1">Risk Level</span>
                                        <span className={`font-mono font-bold ${analysis.riskLevel === 'LOW' ? 'text-e24-success' : analysis.riskLevel === 'MEDIUM' ? 'text-e24-node' : 'text-e24-shard'}`}>
                                            {analysis.riskLevel}
                                        </span>
                                    </div>
                                    <div className="flex-1 bg-black/20 p-3 rounded border border-e24-border">
                                        <span className="text-xs text-gray-500 uppercase block mb-1">Classification</span>
                                        <span className="font-mono text-e24-flux font-bold">{analysis.suggestedClassification}</span>
                                    </div>
                                </div>
                                <div className="bg-e24-node/5 border-l-2 border-e24-node p-3">
                                    <p className="text-sm text-gray-300 italic">
                                        "{analysis.reasoning}"
                                    </p>
                                </div>

                                {flowStage === 'DECISION' && (
                                    <div className="flex flex-col gap-3 pt-4 border-t border-e24-border/50">
                                        <div className="flex gap-3">
                                            {/* REFINE ACTION - LOOP BACK */}
                                            <button 
                                                onClick={handleRefine}
                                                className="flex-1 bg-transparent border border-gray-600 text-gray-300 hover:border-white hover:text-white py-2 rounded text-sm font-bold transition-colors flex justify-center items-center gap-2"
                                            >
                                                <RotateCcw size={16} /> REFINE
                                            </button>

                                            {/* PROCEED ACTION */}
                                            <button 
                                                onClick={() => initiateSigning(false)}
                                                disabled={!isCompliant}
                                                className="flex-[2] bg-e24-success/10 border border-e24-success text-e24-success hover:bg-e24-success/20 py-2 rounded text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                            >
                                                {isCompliant ? <CheckCircle size={16} /> : <Lock size={16} />}
                                                {isCompliant ? (governanceMode === 'JOINT_COUNCIL' ? 'PROCEED TO VOTE' : 'PROCEED TO FINALIZATION') : 'VALIDATION FAILED'}
                                            </button>
                                        </div>
                                        
                                        <div className="flex gap-3 justify-end">
                                            <button 
                                                onClick={() => initiateSigning(true)}
                                                className="text-xs text-e24-shard hover:underline flex items-center gap-1"
                                            >
                                                <AlertTriangle size={12} /> FORCE OVERRIDE
                                            </button>
                                            <button 
                                                onClick={discardFlow}
                                                className="text-xs text-gray-500 hover:text-white transition-colors"
                                            >
                                                Discard Draft
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : null}
             </div>
          )}

          {/* STAGE 3: FINALIZATION (SIGNING) */}
          {(flowStage === 'SIGNING' || flowStage === 'COMMITTED') && (
            <div className={`glass-panel rounded-lg p-6 transition-all duration-300 compiz-card ${flowStage === 'SIGNING' ? 'border-e24-flux shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-e24-flux' : 'bg-e24-lattice/30 border-e24-border'}`}>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <span className="bg-e24-flux text-black w-6 h-6 rounded flex items-center justify-center text-xs font-mono">4</span>
                    {governanceMode === 'SOLE_FIDUCIARY' ? 'Finalization (Sign & Record)' : 'Council Ratification'}
                </h3>
                
                {flowStage === 'SIGNING' && (
                    <div className="space-y-4 animate-genie">
                        {/* CRYPTOGRAPHIC VISUALIZER (HARDENING) */}
                        <div className="bg-black/50 p-4 rounded border border-e24-border flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-e24-node/10 rounded-full text-e24-node"><Key size={20} /></div>
                                <div className="h-1 w-8 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-e24-node animate-pulse w-full"></div>
                                </div>
                                <div className="p-2 bg-e24-flux/10 rounded-full text-e24-flux"><Hash size={20} /></div>
                                <div className="h-1 w-8 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-e24-flux animate-pulse w-full"></div>
                                </div>
                                <div className="p-2 bg-e24-success/10 rounded-full text-e24-success"><Lock size={20} /></div>
                            </div>
                            <div className="text-right text-[10px] font-mono text-gray-400">
                                <div className="text-e24-node">KEY: {keyFingerprint}</div>
                                <div className="text-e24-flux">SIG: PENDING...</div>
                            </div>
                        </div>

                        {/* COUNCIL MODE UI */}
                        {governanceMode === 'JOINT_COUNCIL' && (
                            <div className="bg-e24-void/50 p-4 rounded border border-e24-border space-y-4">
                                <div className="flex justify-between items-center bg-e24-flux/10 p-2 rounded border border-e24-flux/20 text-e24-flux text-xs font-mono">
                                    <span className="flex items-center gap-2"><Clock size={14} /> 24-HOUR REVIEW WINDOW ACTIVE</span>
                                    <span>MAJORITY REQUIRED: 2/3</span>
                                </div>

                                <div className="space-y-2">
                                    {councilSignatures.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-2 bg-e24-lattice rounded border border-e24-border">
                                            <span className="text-sm text-gray-300">{member.name}</span>
                                            {member.signed ? (
                                                <span className="font-mono text-e24-success font-bold px-3">{member.sig}</span>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        maxLength={3}
                                                        placeholder="Initials"
                                                        className="bg-e24-void border border-e24-border text-white text-center font-mono w-16 p-1 rounded text-sm focus:border-e24-flux focus:outline-none"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') signForCouncilMember(member.id, e.currentTarget.value);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SOLE MODE UI */}
                        {governanceMode === 'SOLE_FIDUCIARY' && (
                            <div className="bg-e24-shard/10 border border-e24-shard/40 p-3 rounded text-e24-shard text-xs font-mono flex items-start gap-2">
                                 <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                 <div>
                                     <strong>WARNING: IMMUTABLE ACTION.</strong><br/>
                                     Signing this BFO permanently locks the record.
                                 </div>
                            </div>
                        )}
                        
                        <div>
                            {governanceMode === 'SOLE_FIDUCIARY' ? (
                                <>
                                    <label className="text-xs text-gray-500 uppercase block mb-2">RATIFICATION INITIALS</label>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                maxLength={3}
                                                value={soleSignature}
                                                onChange={(e) => setSoleSignature(e.target.value.toUpperCase())}
                                                placeholder="XXX"
                                                className="bg-black/50 border-2 border-e24-flux text-white text-center font-mono text-xl w-24 p-2 rounded tracking-widest focus:outline-none focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-shadow"
                                                autoFocus
                                            />
                                        </div>

                                        {/* SAFETY INTERLOCK */}
                                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-white/5 rounded transition-colors">
                                            <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${safetyInterlock ? 'bg-e24-flux border-e24-flux text-black' : 'border-gray-500'}`}>
                                                {safetyInterlock && <Check size={14} />}
                                            </div>
                                            <input type="checkbox" className="hidden" onChange={() => setSafetyInterlock(!safetyInterlock)} />
                                            <span className={`text-xs ${safetyInterlock ? 'text-e24-flux font-bold' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                I confirm this action is irreversible and binds the Fiduciary Ledger.
                                            </span>
                                        </label>

                                        <button 
                                            onClick={handleCommit}
                                            disabled={!soleSignature || keyStatus !== 'READY' || !safetyInterlock}
                                            className="w-full bg-e24-flux text-black font-bold p-3 rounded flex items-center justify-center gap-2 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                        >
                                            <PenTool size={16} /> 
                                            {keyStatus === 'READY' ? 'EXECUTE & LOCK' : 'WAITING FOR KEYS...'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button 
                                    onClick={handleCommit}
                                    disabled={!councilMajorityReached || keyStatus !== 'READY'}
                                    className="w-full bg-e24-flux text-black font-bold p-3 rounded flex items-center justify-center gap-2 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                                >
                                    <PenTool size={16} /> 
                                    {councilMajorityReached ? 'FINALIZE MAJORITY DECISION' : 'WAITING FOR MAJORITY...'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {flowStage === 'COMMITTED' && (
                    <div className="flex flex-col gap-2">
                         <div className="bg-e24-success/10 border border-e24-success/30 p-3 rounded flex items-center gap-2 text-e24-success">
                             <CheckCircle size={18} />
                             <span className="font-bold text-sm">CRYPTOGRAPHICALLY COMMITTED</span>
                         </div>
                    </div>
                )}
            </div>
          )}

          {/* STAGE 5: RECORD (IMMUTABLE) */}
          {flowStage === 'COMMITTED' && (
             <div className="bg-e24-success/5 border border-e24-success/30 rounded-lg p-6 flex flex-col items-center justify-center text-center animate-genie">
                <div className="w-16 h-16 bg-e24-success/20 rounded-full flex items-center justify-center text-e24-success mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <Hash size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Step 5: Record Locked</h3>
                <p className="text-e24-success font-mono text-sm mb-4">Immutable State Generated</p>
                <button 
                    onClick={resetFlow} 
                    className="text-gray-400 text-sm hover:text-white flex items-center gap-1 border border-gray-700 px-4 py-2 rounded hover:border-white transition-colors"
                >
                    Start New Flow <ArrowRight size={14} />
                </button>
             </div>
          )}

        </div>

        {/* RIGHT COLUMN: AUDIT & LEDGER */}
        <div className="space-y-6 flex flex-col h-full">
            {/* Live Audit Stream */}
            <div className="glass-panel border border-e24-border rounded-lg p-0 overflow-hidden flex flex-col max-h-[400px]">
                <div className="p-4 border-b border-e24-border bg-e24-void/50 flex justify-between items-center">
                     <h3 className="font-mono text-sm text-gray-400 flex items-center gap-2">
                        <Server size={14} /> LIVE AUDIT STREAM
                     </h3>
                     <div className="w-2 h-2 rounded-full bg-e24-node animate-pulse"></div>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 font-mono text-xs">
                    {auditLog.length === 0 && (
                        <div className="text-gray-600 text-center py-4">Waiting for events...</div>
                    )}
                    {auditLog.map((evt) => (
                        <div key={evt.id} className="border-l-2 border-gray-700 pl-3 py-1">
                            <div className="flex justify-between text-gray-500 mb-1">
                                <span>{evt.timestamp.split('T')[1].split('.')[0]}</span>
                                <span className={
                                    evt.actor === 'AI_CO_FIDUCIARY' ? 'text-e24-flux' : 
                                    (evt.actor === 'COUNCIL_MAJORITY' ? 'text-e24-success' : 
                                    (evt.actor === 'SYSTEM_FAILSAFE' ? 'text-e24-shard' : 'text-e24-node'))
                                }>{evt.actor}</span>
                            </div>
                            <div className={`font-bold mb-1 ${
                                evt.action === 'OVERRIDE' || evt.action === 'AUTO_COMMIT' || evt.action === 'SYSTEM_HALT' || evt.action === 'MANUAL_INTERVENTION' ? 'text-e24-shard' : 
                                evt.action === 'APPROVAL' || evt.action === 'RATIFICATION' ? 'text-e24-success' : 
                                evt.action === 'SIGNATURE' ? 'text-white underline decoration-e24-flux' : 'text-white'
                            }`}>
                                {evt.action}
                            </div>
                            <div className="text-gray-400">{evt.details}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Committed Ledger (Visual Only) */}
            <div className="glass-panel border border-e24-border rounded-lg flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-e24-border bg-e24-void/50">
                     <h3 className="font-mono text-sm text-gray-400">LEDGER STATE</h3>
                </div>
                <div className="p-2 overflow-y-auto space-y-2">
                    {bfos.map((bfo) => (
                        <div key={bfo.id} className="bg-black/30 p-3 rounded border border-e24-border/30 hover:border-e24-flux/30 transition-colors group relative">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-e24-flux text-xs font-mono group-hover:underline cursor-pointer">{bfo.id}</span>
                                <span className={`text-[10px] px-1 rounded border ${
                                    bfo.authorityLevel === 'OVERRIDE' ? 'border-e24-shard text-e24-shard' : 
                                    bfo.authorityLevel === 'JOINT_CONSENSUS' ? 'border-e24-success text-e24-success' : 
                                    'border-gray-600 text-gray-400'
                                }`}>
                                    {bfo.type === 'AMENDMENT' || bfo.type === 'DISPUTE' || bfo.type === 'CHAINED_RECORD' ? bfo.type : bfo.authorityLevel}
                                </span>
                            </div>
                            <div className="text-xs text-gray-300 truncate mb-1">{bfo.contentSummary}</div>
                            {bfo.referenceId && (
                                <div className="flex items-center gap-1 text-[10px] text-e24-flux/80 mb-1">
                                    <Link size={10} /> Links to: {bfo.referenceId}
                                </div>
                            )}
                            {bfo.signatures && bfo.signatures.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Lock size={10} className="text-e24-node" /> 
                                    {bfo.signatures.length > 1 ? `Signed: ${bfo.signatures.join(', ')}` : `Signed: ${bfo.signatures[0]}`}
                                </div>
                            )}
                            
                            {/* Create Linked Matter Button */}
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); initiateLinkedMatter(bfo.id); }}
                                    className="bg-e24-void border border-e24-flux/50 text-e24-flux p-1 rounded hover:bg-e24-flux hover:text-black transition-colors"
                                    title="Create Linked Matter (Chain New Record)"
                                >
                                    <GitBranch size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};