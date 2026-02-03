import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, Scan, FileSearch, FolderInput, CheckCircle, Hash, Play, AlertCircle, ArrowRight, Package, FileCode, Printer, ShieldCheck, Copy, Terminal, Zap } from 'lucide-react';
import { sha256, canonicalize } from '../services/crypto';
import { performOCR, classifyDocument } from '../services/geminiService';
import { BFOObject, AuditEvent, IngestItem, ExhibitZManifest } from '../types';

interface IngestionPipelineProps {
  addBFO: (bfo: BFOObject) => void;
  addAuditEvent: (event: Omit<AuditEvent, 'hash' | 'previousHash' | 'timestamp'>) => void;
}

export const IngestionPipeline: React.FC<IngestionPipelineProps> = ({ addBFO, addAuditEvent }) => {
  const [queue, setQueue] = useState<IngestItem[]>([]);
  // Decouple "Viewed" item from "Processing" item to allow parallel execution
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [sessionArtifacts, setSessionArtifacts] = useState<IngestItem[]>([]); 
  const [exhibitMode, setExhibitMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Derived state for the console view
  const activeDisplayItem = queue.find(i => i.id === viewingItemId) || null;

  useEffect(() => {
    if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [activeDisplayItem?.logs]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newItems: IngestItem[] = [];

    // Pre-calculate hashes and prepare items
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const buffer = await file.arrayBuffer();
        const hash = await sha256(buffer);

        const newItem: IngestItem = {
            id: `ING-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            file: file,
            status: 'QUEUED',
            originalHash: hash,
            logs: [`[INTAKE] RECEIVED: ${file.name}`, `[HASH] SOURCE INTEGRITY: ${hash.substring(0, 16)}...`]
        };

        newItems.push(newItem);
    }
    
    // Add to queue - The useEffect hook below will pick them up immediately
    setQueue(prev => [...prev, ...newItems]);
    
    // Auto-view the first new item if nothing is selected
    if (!viewingItemId && newItems.length > 0) {
        setViewingItemId(newItems[0].id);
    }
    
    // Log batch intake event
    if (files.length > 0) {
        addAuditEvent({
            id: `EVT-${Date.now()}`,
            actor: 'INGESTION_AGENT',
            action: 'INTAKE_RECEIVED',
            details: `Buffered ${files.length} items for Parallel Ingestion`,
            rationale: 'Batch Pipeline Start',
            metadata: { 
                schema: '1.0.0',
                sourceType: 'USER_UPLOAD',
                context: { count: files.length, mode: 'PARALLEL' }
            }
        });
    }
  };

  const processItem = useCallback(async (item: IngestItem) => {
    // Helper to update state for a specific item without overwriting others
    const updateItemLog = (status: IngestItem['status'] | null, log: string) => {
        setQueue(prev => prev.map(i => {
            if (i.id === item.id) {
                return { 
                    ...i, 
                    status: status || i.status, 
                    logs: [...i.logs, log] 
                };
            }
            return i;
        }));
    };

    try {
        updateItemLog('HASHING', '[AUTO] PARALLEL PIPELINE ENGAGED...');

        // --- STEP 1: OCR ---
        updateItemLog('OCR', `[OCR] NORMALIZING PDF/A STRUCTURE...`);
        
        const buffer = await item.file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        const ocrResult = await performOCR(base64, item.file.type);
        updateItemLog('OCR', `[OCR] EXTRACTION: ${ocrResult.summary.substring(0, 40)}...`);

        // --- STEP 2: CLASSIFICATION ---
        updateItemLog('CLASSIFYING', `[AI] ANALYZING ONTOLOGY...`);
        const classification = await classifyDocument(ocrResult.text, item.file.name);
        
        // --- STEP 3: AUTO-COMMIT ---
        updateItemLog('COMMITTING', `[AUTO] PATH CONFIRMED: ${classification.path}`);
        
        // Simulate processing time slightly for visual feedback
        await new Promise(r => setTimeout(r, 600));

        const finalHash = item.originalHash;
        
        const newBFO: BFOObject = {
            id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            hash: finalHash,
            timestamp: new Date().toISOString(),
            type: 'DIGITAL_ASSET',
            status: 'IMMUTABLE',
            contentSummary: `AUTO-INGEST: ${classification.standardizedName}`,
            authorityLevel: 'AI_RECOMMENDED',
            governance: 'SOLE_FIDUCIARY',
            signatures: ['AGENT_PIPELINE_V1'],
            referenceId: 'VAULT_ROOT',
            path: classification.path
        };

        addBFO(newBFO);
        
        addAuditEvent({
             id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
             actor: 'INGESTION_AGENT',
             action: 'AUTO_COMMIT',
             details: `Auto-Ingest: ${classification.standardizedName}`,
             rationale: 'Batch Pipeline Execution',
             metadata: { 
                 schema: '1.0.0',
                 sourceHash: item.originalHash,
                 processTool: 'Gemini 3 Flash',
                 targetPath: classification.path,
                 bfoId: newBFO.id,
                 context: { confidence: 'HIGH', mode: 'AUTO_RUN' } 
             }
        });

        // Add to Session Artifacts & Mark Complete
        const completedItem = {
            ...item,
            status: 'COMPLETE' as const,
            finalHash,
            suggestedPath: classification.path,
            suggestedName: classification.standardizedName,
            ocrText: ocrResult.text,
            logs: [...item.logs, `[COMPLETE] INGESTED: ${classification.standardizedName}`]
        };
        
        // Final State Update
        setQueue(prev => prev.map(i => {
            if (i.id === item.id) {
                return {
                    ...i,
                    status: 'COMPLETE',
                    logs: [...i.logs, `[COMPLETE] INGESTED: ${classification.standardizedName}`]
                };
            }
            return i;
        }));

        setSessionArtifacts(prev => [...prev, completedItem]);

    } catch (e) {
        console.error("Pipeline Error", e);
        updateItemLog(null, `[ERROR] ${e}`);
    }
  }, [addAuditEvent, addBFO]);

  // PARALLEL PROCESSING TRIGGER
  // Watch for any items in 'QUEUED' state and fire them all off immediately
  useEffect(() => {
    const queuedItems = queue.filter(i => i.status === 'QUEUED');
    
    if (queuedItems.length > 0) {
        // 1. Mark them as HASHING immediately to prevent re-triggering
        setQueue(prev => prev.map(i => i.status === 'QUEUED' ? { ...i, status: 'HASHING' } : i));
        
        // 2. Fire async processing for ALL queued items in parallel
        queuedItems.forEach(item => {
            processItem(item);
        });
    }
  }, [queue, processItem]);

  const buildExhibitZ = async () => {
      if (sessionArtifacts.length === 0) {
          alert("No committed artifacts in this session to bundle.");
          return;
      }

      const manifest: ExhibitZManifest = {
          schema: "EXHIBIT_Z_V1",
          timestamp: new Date().toISOString(),
          artifactCount: sessionArtifacts.length,
          artifacts: sessionArtifacts.map(a => ({
              source: a.file.name,
              vaultName: a.suggestedName,
              hash: a.originalHash,
              path: a.suggestedPath
          }))
      };

      const manifestString = canonicalize(manifest);
      const manifestHash = await sha256(manifestString);

      const exhibitBFO: BFOObject = {
            id: `EXZ-${Date.now()}`,
            hash: manifestHash,
            timestamp: new Date().toISOString(),
            type: 'CHAINED_RECORD',
            status: 'IMMUTABLE',
            contentSummary: `EXHIBIT Z: ${sessionArtifacts.length} Artifacts (Crypto-Bundled)`,
            authorityLevel: 'AI_RECOMMENDED',
            governance: 'SOLE_FIDUCIARY',
            signatures: ['SYSTEM_AGENT_EXZ'],
            referenceId: 'SESSION_BUNDLE_ROOT'
      };

      addBFO(exhibitBFO);

      addAuditEvent({
          id: `EVT-${Date.now()}`,
          actor: 'INGESTION_AGENT',
          action: 'EXHIBIT_Z_BUILT',
          details: `Exhibit Z Manifest Locked: ${manifestHash.substring(0,16)}...`,
          rationale: 'Cryptographic Bundle Finalization',
          metadata: { 
              schema: '1.0.0',
              sourceType: 'SYSTEM_GENERATED',
              sourceHash: manifestHash,
              outputHash: manifestHash,
              bfoId: exhibitBFO.id,
              context: { artifact_count: sessionArtifacts.length }
          }
      });

      setSessionArtifacts([]);
      alert(`Exhibit Z Manifest Locked.\nHash: ${manifestHash}\nBFO ID: ${exhibitBFO.id}`);
      setExhibitMode(false);
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-300 p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8 border-b border-e24-border pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-mono">Ingestion Agent</h2>
          <p className="text-e24-flux font-mono text-sm">PARALLEL INTAKE // BATCH PROCESSOR</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setExhibitMode(!exhibitMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold transition-colors ${exhibitMode ? 'bg-e24-node text-black shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'glass-panel hover:text-white'}`}
            >
                <Package size={14} /> EXHIBIT Z BUILDER
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-e24-success/10 border border-e24-success/30 text-e24-success text-xs font-mono animate-pulse">
                <Zap size={14} /> PARALLEL THREADS: {queue.filter(i => i.status !== 'COMPLETE' && i.status !== 'QUEUED').length}
            </div>
        </div>
      </div>

      {exhibitMode ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-cube-enter">
              {/* Exhibit Z Builder UI */}
              <div className="glass-panel border border-e24-border p-8 rounded-lg max-w-2xl w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <Package size={64} className="mx-auto text-e24-node mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                  <h3 className="text-2xl font-bold text-white mb-2">Exhibit Z Deterministic Build</h3>
                  <p className="text-gray-400 text-sm mb-8">
                      Generates a cryptographically verified export package.
                      Locks <strong className="text-white">Session Manifest</strong> as an immutable BFO.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-left mb-8">
                      <div className="bg-e24-void/40 p-4 rounded border border-e24-border">
                          <h4 className="text-xs text-gray-500 uppercase mb-2">Input Scope</h4>
                          <div className="text-e24-flux font-mono text-sm">{sessionArtifacts.length} Artifacts Ready</div>
                      </div>
                      <div className="bg-e24-void/40 p-4 rounded border border-e24-border">
                          <h4 className="text-xs text-gray-500 uppercase mb-2">Output Artifacts</h4>
                          <div className="flex flex-col gap-1 text-xs font-mono text-gray-300">
                              <span className="flex items-center gap-2"><FolderInput size={12} /> Bundle.zip</span>
                              <span className="flex items-center gap-2"><Hash size={12} /> Manifest BFO</span>
                          </div>
                      </div>
                  </div>
                  <button 
                    onClick={buildExhibitZ}
                    disabled={sessionArtifacts.length === 0}
                    className="w-full bg-e24-node text-black font-bold py-4 rounded flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02]"
                  >
                      <Play size={18} /> BUILD & LOCK MANIFEST
                  </button>
              </div>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* COLUMN 1: INTAKE QUEUE */}
            <div className="glass-panel rounded-lg flex flex-col overflow-hidden compiz-card">
                <div className="p-4 border-b border-e24-border bg-e24-void/40 flex justify-between items-center">
                    <h3 className="font-mono text-sm text-gray-400 flex items-center gap-2">
                        <FolderInput size={14} /> BATCH QUEUE
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs bg-e24-flux/20 text-e24-flux px-3 py-1.5 rounded hover:bg-e24-flux/30 transition-colors font-bold border border-e24-flux/30 hover:scale-105"
                        >
                            + ADD FILES
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {queue.length === 0 && (
                        <div className="text-center text-gray-600 py-10 text-xs font-mono">
                            QUEUE EMPTY. READY FOR INTAKE.
                        </div>
                    )}
                    {queue.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setViewingItemId(item.id)}
                            className={`p-3 rounded border flex items-center justify-between group transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                                item.id === viewingItemId 
                                ? 'bg-e24-flux/10 border-e24-flux shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                                : 'bg-transparent border-e24-border hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileText size={16} className={item.id === viewingItemId ? 'text-e24-flux' : 'text-gray-500'} />
                                <div className="text-xs">
                                    <div className="text-gray-300 truncate max-w-[120px] font-bold" title={item.file.name}>{item.file.name}</div>
                                    <div className="text-[10px] text-gray-600 font-mono flex items-center gap-2">
                                        {item.status}
                                        {item.status === 'COMPLETE' && <span className="text-e24-success"><CheckCircle size={10} /></span>}
                                        {(item.status === 'HASHING' || item.status === 'OCR' || item.status === 'CLASSIFYING') && <span className="w-1.5 h-1.5 rounded-full bg-e24-flux animate-pulse"></span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* COLUMN 2: PROCESSING CONSOLE (SHOWS SELECTED ITEM) */}
            <div className="lg:col-span-2 bg-black/80 backdrop-blur-md border border-e24-border rounded-lg flex flex-col font-mono overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                {/* Glowing Top Border */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-e24-flux to-transparent opacity-50"></div>
                
                <div className="p-3 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
                    <Terminal size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400">agent_pipeline_v1.sh</span>
                    {activeDisplayItem && activeDisplayItem.status !== 'COMPLETE' && <span className="text-[10px] bg-e24-flux text-black px-1 rounded animate-pulse">PROCESSING</span>}
                    {activeDisplayItem?.status === 'COMPLETE' && <span className="text-[10px] bg-e24-success text-black px-1 rounded">COMPLETE</span>}
                </div>
                
                <div className="flex-1 p-6 relative">
                    {!activeDisplayItem ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Scan size={64} className="text-e24-flux mb-4" />
                            <p className="text-e24-flux font-mono">SELECT AN ITEM TO MONITOR</p>
                            <p className="text-xs text-gray-500 mt-2">Background processing active for {queue.length} items.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* LIVE LOGS FOR SELECTED ITEM */}
                            <div className="flex-1 overflow-y-auto space-y-1 mb-6 text-xs" ref={consoleRef}>
                                {activeDisplayItem.logs.map((log, i) => (
                                    <div key={i} className="text-e24-flux/80">
                                        <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                                        {log}
                                    </div>
                                ))}
                            </div>

                            {/* PROGRESS INDICATOR FOR SELECTED ITEM */}
                            <div className="flex items-center gap-1 mt-4 border-t border-gray-800 pt-4">
                                {['HASHING', 'OCR', 'CLASSIFYING', 'COMMITTING', 'COMPLETE'].map((stage, idx) => {
                                    const stages = ['HASHING', 'OCR', 'CLASSIFYING', 'COMMITTING', 'COMPLETE'];
                                    const activeIdx = stages.indexOf(activeDisplayItem.status);
                                    const myIdx = idx;
                                    const isPast = activeIdx > myIdx;
                                    const isCurrent = activeIdx === myIdx;

                                    return (
                                        <div key={stage} className="flex items-center gap-1 flex-1">
                                            <div className={`h-1 flex-1 rounded-full ${isPast ? 'bg-e24-success shadow-[0_0_5px_#10b981]' : isCurrent ? 'bg-e24-flux animate-pulse shadow-[0_0_10px_#06b6d4]' : 'bg-gray-800'}`}></div>
                                            <span className={`text-[8px] font-mono ${isCurrent ? 'text-e24-flux' : 'text-gray-600'}`}>{stage}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};