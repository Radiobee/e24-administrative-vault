import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewState, BFOObject, AuditEvent, Asset } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { BFOEngine } from './components/BFOEngine';
import { Vault } from './components/Vault';
import { StrikeConsole } from './components/StrikeConsole';
import { AICoFiduciary } from './components/AICoFiduciary';
import { DriveScanner } from './components/DriveScanner';
import { IngestionPipeline } from './components/IngestionPipeline';
import { Documentation } from './components/Documentation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SystemGate } from './components/SystemGate';
import { computeHash, verifyLedger } from './services/crypto';
import { persistence } from './services/persistence';
import { AlertOctagon, RefreshCcw } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [systemStatus, setSystemStatus] = useState<'BOOTING' | 'ONBOARDING' | 'ONLINE' | 'HALTED'>('BOOTING');
  const [haltReason, setHaltReason] = useState<string>('');
  
  // --- GLOBAL STATE ---
  const [bfos, setBfos] = useState<BFOObject[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [anchorHash, setAnchorHash] = useState<string>('PENDING...');

  // Async Audit Queue
  const auditQueueRef = useRef<Omit<AuditEvent, 'hash' | 'previousHash' | 'timestamp'>[]>([]);
  const isProcessingQueue = useRef(false);
  const latestHashRef = useRef<string>('GENESIS');

  // --- BOOT SEQUENCE ---
  const runBootSequence = useCallback(async () => {
      try {
          setSystemStatus('BOOTING');

          if (!window.crypto || !window.crypto.subtle) {
              throw new Error("CRITICAL: WebCrypto API Unavailable. Application requires Secure Context.");
          }

          const storedLog = persistence.loadLedger();
          const storedBFOs = persistence.loadBFOs();
          const storedAssets = persistence.loadAssets();

          if (storedLog && storedLog.length > 0) {
              console.log("E24-Boot: Found existing lattice. Verifying integrity...");
              
              const verification = await verifyLedger(storedLog);
              
              if (!verification.valid) {
                  throw new Error(`PERSISTENCE CORRUPTION: ${verification.errorMsg}`);
              }

              setAuditLog(storedLog);
              setBfos(storedBFOs);
              
              if (storedAssets) {
                  setAssets(storedAssets);
              } else {
                  setAssets([
                    { id: '1', name: 'Acquisition Target Alpha', valuation: 10000000, status: 'ACQUISITION_TARGET', type: 'ENTITY' },
                    { id: '2', name: 'Sovereign Holding Corp', valuation: 2500000, status: 'ACTIVE', type: 'ENTITY' },
                    { id: '3', name: 'IP Portfolio: Trash Cats', valuation: 1200000, status: 'ACTIVE', type: 'IP' },
                    { id: '4', name: 'Liquid Reserves', valuation: 450000, status: 'ACTIVE', type: 'LIQUID' },
                  ]);
              }

              latestHashRef.current = storedLog[0].hash;
              
              console.log("E24-Boot: State Restored Successfully.");
              setSystemStatus('ONLINE');

          } else {
              console.log("E24-Boot: No existing lattice. Generating Genesis Shard...");
              
              const genesisTime = new Date().toISOString();
              const genesisMetadata = {
                schema: '1.0.0',
                sourceType: 'SYSTEM_GENERATED',
                sourceIdentity: 'ROOT_ANCHOR',
                processTool: 'SHA-256',
                context: { version: '1.0.0', initialization: 'TRUE', architecture: 'E24' }
              };

              const genesisPayload = {
                previousHash: 'GENESIS',
                timestamp: genesisTime,
                actor: 'SYSTEM',
                action: 'HASHING',
                details: 'GENESIS BLOCK',
                rationale: 'System Initialization',
                metadata: genesisMetadata,
                signature: ''
              };
              
              const genesisHash = await computeHash(genesisPayload);
              
              const genesisEvent: AuditEvent = {
                id: 'EVT-0000',
                timestamp: genesisTime,
                actor: 'SYSTEM',
                action: 'HASHING',
                details: 'GENESIS BLOCK',
                hash: genesisHash,
                previousHash: 'GENESIS',
                rationale: 'System Initialization',
                metadata: genesisMetadata as any,
                signature: ''
              };

              setAuditLog([genesisEvent]);
              setBfos([]);
              setAssets([
                { id: '1', name: 'Acquisition Target Alpha', valuation: 10000000, status: 'ACQUISITION_TARGET', type: 'ENTITY' },
                { id: '2', name: 'Sovereign Holding Corp', valuation: 2500000, status: 'ACTIVE', type: 'ENTITY' },
                { id: '3', name: 'IP Portfolio: Trash Cats', valuation: 1200000, status: 'ACTIVE', type: 'IP' },
                { id: '4', name: 'Liquid Reserves', valuation: 450000, status: 'ACTIVE', type: 'LIQUID' },
              ]);

              latestHashRef.current = genesisHash;
              setSystemStatus('ONLINE');
          }

      } catch (e: any) {
          console.error("BOOT FAILURE:", e);
          setHaltReason(e.message || "UNKNOWN_BOOT_ERROR");
          setSystemStatus('HALTED');
      }
  }, []);

  useEffect(() => {
    const hasAcceptedDisclaimer = localStorage.getItem('e8_disclaimer_accepted');
    if (!hasAcceptedDisclaimer) {
        setSystemStatus('ONBOARDING');
    } else {
        runBootSequence();
    }
  }, [runBootSequence]);

  useEffect(() => {
      if (auditLog.length > 0) persistence.saveLedger(auditLog);
  }, [auditLog]);

  useEffect(() => {
      if (bfos.length > 0) persistence.saveBFOs(bfos);
  }, [bfos]);

  useEffect(() => {
      if (assets.length > 0) persistence.saveAssets(assets);
  }, [assets]);

  const addBFO = (newBFO: BFOObject) => {
    if (systemStatus === 'HALTED') return;
    setBfos(prev => [newBFO, ...prev]);
  };

  const processQueue = async () => {
    if (isProcessingQueue.current || systemStatus === 'HALTED') return;
    isProcessingQueue.current = true;
    let hasError = false;

    try {
      while (auditQueueRef.current.length > 0) {
        const eventData = auditQueueRef.current.shift();
        if (!eventData) break;

        const previousHash = latestHashRef.current;
        const timestamp = new Date().toISOString();
        
        const payloadObj = {
          previousHash: previousHash,
          timestamp: timestamp,
          actor: eventData.actor,
          action: eventData.action,
          details: eventData.details,
          rationale: eventData.rationale || '',
          metadata: eventData.metadata,
          signature: eventData.signature || ''
        };
        
        const newHash = await computeHash(payloadObj);

        const fullEvent: AuditEvent = {
          ...eventData,
          timestamp,
          hash: newHash,
          previousHash,
          rationale: eventData.rationale || '',
          signature: eventData.signature || ''
        };

        latestHashRef.current = newHash;
        setAuditLog(prev => [fullEvent, ...prev]);
      }
    } catch (e) {
      console.error("Crypto Error:", e);
      setSystemStatus('HALTED');
      setHaltReason('HASHING_PIPELINE_FAILURE');
      hasError = true;
    } finally {
      isProcessingQueue.current = false;
      if (auditQueueRef.current.length > 0 && !hasError) {
        processQueue();
      }
    }
  };

  const addAuditEvent = (event: Omit<AuditEvent, 'hash' | 'previousHash' | 'timestamp'>) => {
    if (systemStatus === 'HALTED') return;
    auditQueueRef.current.push(event);
    processQueue();
  };

  useEffect(() => {
      if (auditLog.length === 0 || systemStatus !== 'ONLINE') return;
      const runVerification = async () => {
          const result = await verifyLedger(auditLog);
          if (!result.valid) {
              setSystemStatus('HALTED');
              setHaltReason(result.errorMsg || 'INTEGRITY_CHECK_FAILED');
          }
      };
      const timer = setTimeout(runVerification, 500);
      return () => clearTimeout(timer);
  }, [auditLog, systemStatus]);

  const triggerAnchor = async () => {
    if (systemStatus !== 'ONLINE') return;
    const currentRoot = latestHashRef.current;
    
    addAuditEvent({
        id: `ANCHOR-${Date.now()}`,
        actor: 'SYSTEM',
        action: 'EXTERNAL_ANCHOR_PUBLISHED',
        details: `Root Hash Committed to Public Record: ${currentRoot}`,
        rationale: 'Non-Repudiation Checkpoint',
        metadata: {
            schema: '1.0.0',
            sourceType: 'SYSTEM_GENERATED',
            sourceHash: currentRoot,
            processTool: 'Public_Ledger_Bridge_v1',
            context: { target: 'Simulated_Ethereum_Block', timestamp: new Date().toISOString() }
        }
    });
    setAnchorHash(currentRoot);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard assets={assets} bfos={bfos} auditLog={auditLog} systemStatus={systemStatus as any} />;
      case ViewState.BFO_ENGINE:
        return <BFOEngine bfos={bfos} addBFO={addBFO} auditLog={auditLog} addAuditEvent={addAuditEvent} />;
      case ViewState.INGESTION:
        return <IngestionPipeline addBFO={addBFO} addAuditEvent={addAuditEvent} />;
      case ViewState.DRIVE_SCANNER:
        return <DriveScanner addBFO={addBFO} addAuditEvent={addAuditEvent} />;
      case ViewState.VAULT:
        return <Vault assets={assets} auditLog={auditLog} anchorHash={anchorHash} triggerAnchor={triggerAnchor} />;
      case ViewState.STRIKE_CONSOLE:
        return <StrikeConsole />;
      case ViewState.CO_FIDUCIARY:
        return <AICoFiduciary addAuditEvent={addAuditEvent} />;
      case ViewState.DOCUMENTATION:
        return <Documentation />;
      default:
        return <Dashboard assets={assets} bfos={bfos} auditLog={auditLog} systemStatus={systemStatus as any} />;
    }
  };

  const forceRestart = () => {
      localStorage.removeItem('e8_disclaimer_accepted');
      persistence.clearAll();
      window.location.reload();
  };

  if (systemStatus === 'BOOTING') {
    return (
      <div className="flex h-screen w-screen bg-e24-void items-center justify-center flex-col text-e24-node font-mono gap-4">
        <div className="w-8 h-8 border-4 border-e24-node border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm tracking-widest animate-pulse">CRYSTALLIZING LATTICE...</div>
      </div>
    );
  }

  if (systemStatus === 'ONBOARDING') {
      return <SystemGate onEnter={() => {
          setSystemStatus('BOOTING');
          runBootSequence();
      }} />;
  }

  if (systemStatus === 'HALTED') {
    return (
      <div className="flex h-screen w-screen bg-red-950/20 items-center justify-center flex-col text-e24-shard font-mono gap-6 border-4 border-e24-shard relative overflow-hidden animate-genie">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
        <AlertOctagon size={64} className="animate-bounce" />
        <h1 className="text-4xl font-bold tracking-widest">LATTICE FRACTURE</h1>
        <div className="text-center max-w-lg space-y-4 px-8">
           <p className="text-lg font-bold uppercase">Integrity Compromised</p>
           <p className="text-sm opacity-80 font-mono bg-black/50 p-4 rounded border border-e24-shard/50">
               FATAL: {haltReason || "UNKNOWN_ERROR"}
           </p>
           <p className="text-sm opacity-60">
               Cryptographic chain broken. System halted to preserve remaining shards.
           </p>
        </div>
        <div className="flex flex-col gap-4 mt-8">
            <button 
                onClick={forceRestart}
                className="flex items-center gap-2 bg-e24-shard text-black px-6 py-3 rounded font-bold hover:bg-pink-500 transition-colors hover:scale-105"
            >
                <RefreshCcw size={18} /> EMERGENCY RESET (WIPE LATTICE)
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-e24-void text-gray-200 overflow-hidden font-sans">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 h-full relative perspective-[1000px] overflow-hidden">
        {/* COMPIZ VIEWPORT: Wraps content in animation */}
        <div 
          key={currentView} 
          className="h-full w-full overflow-y-auto animate-genie origin-bottom"
        >
            {renderContent()}
        </div>
        
        {/* LATTICE GRID BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#a855f7 1px, transparent 1px), linear-gradient(90deg, #a855f7 1px, transparent 1px)`, 
               backgroundSize: '40px 40px' 
             }}>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
}

export default App;