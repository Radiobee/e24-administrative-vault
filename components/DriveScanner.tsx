import React, { useState, useRef } from 'react';
import { Cloud, FileText, Hash, CheckCircle, RefreshCcw, Search, Upload, Lock, FileCheck, ArrowRight, Bot } from 'lucide-react';
import { sha256 } from '../services/crypto';
import { performOCR } from '../services/geminiService';
import { BFOObject, AuditEvent } from '../types';

interface DriveScannerProps {
  addBFO: (bfo: BFOObject) => void;
  addAuditEvent: (event: Omit<AuditEvent, 'hash' | 'previousHash' | 'timestamp'>) => void;
}

export const DriveScanner: React.FC<DriveScannerProps> = ({ addBFO, addAuditEvent }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'ANALYZING' | 'COMPLETE'>('IDLE');
  const [scannedFile, setScannedFile] = useState<{name: string, type: string, size: number, hash: string, content: string | null} | null>(null);
  const [ocrResult, setOcrResult] = useState<{text: string, summary: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = () => {
    // Simulating OAuth flow delay
    setTimeout(() => {
        setIsConnected(true);
        addAuditEvent({
            id: `DRV-${Date.now()}`,
            actor: 'SYSTEM',
            action: 'DRIVE_IMPORT',
            details: 'Google Drive API Connection Established',
            rationale: 'External Asset Ingestion',
            metadata: { 
                schema: '1.0.0',
                sourceType: 'GOOGLE_DRIVE',
                sourceIdentity: 'AUTH_TOKEN',
                context: { scope: 'drive.readonly' }
            }
        });
    }, 1500);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanStatus('SCANNING');
    setScannedFile(null);
    setOcrResult(null);

    // 1. ArrayBuffer for Hashing (Optimized)
    const buffer = await file.arrayBuffer();
    const fileHash = await sha256(buffer);

    // 2. Base64 for OCR (Gemini API Requirement)
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    setScannedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        hash: fileHash,
        content: base64Data
    });

    // 3. Perform OCR (AI Analysis)
    setScanStatus('ANALYZING');
    const analysis = await performOCR(base64Data, file.type);
    setOcrResult(analysis);
    setScanStatus('COMPLETE');
  };

  const commitToVault = () => {
      if (!scannedFile || !ocrResult) return;

      // Create BFO
      const newBFO: BFOObject = {
          id: `BFO-DRV-${Math.floor(Math.random() * 10000)}`,
          hash: scannedFile.hash, // The content hash becomes the BFO identity
          timestamp: new Date().toISOString(),
          type: 'DIGITAL_ASSET',
          status: 'IMMUTABLE',
          contentSummary: `DRIVE IMPORT: ${scannedFile.name} // ${ocrResult.summary}`,
          authorityLevel: 'AI_RECOMMENDED',
          governance: 'SOLE_FIDUCIARY',
          signatures: ['DRIVE_CONNECT_BRIDGE'],
          referenceId: 'GOOGLE_DRIVE_ROOT'
      };

      addBFO(newBFO);

      addAuditEvent({
          id: `EVT-${Date.now()}`,
          actor: 'USER',
          action: 'HASHING',
          details: `Drive File Committed: ${scannedFile.name}`,
          rationale: 'Ingestion to Fiduciary Vault',
          metadata: {
              schema: '1.0.0',
              sourceType: 'GOOGLE_DRIVE',
              sourceIdentity: scannedFile.name,
              sourceHash: scannedFile.hash,
              outputHash: scannedFile.hash,
              bfoId: newBFO.id,
              context: {
                  originalSize: scannedFile.size,
                  mimeType: scannedFile.type,
                  ocrSummary: ocrResult.summary
              }
          }
      });

      // Reset
      setScannedFile(null);
      setOcrResult(null);
      setScanStatus('IDLE');
  };

  if (!isConnected) {
      return (
          <div className="flex flex-col h-full items-center justify-center bg-e24-void text-gray-300 p-8 space-y-6">
              <div className="w-20 h-20 bg-e24-lattice border border-e24-border rounded-full flex items-center justify-center animate-pulse">
                  <Cloud size={40} className="text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold font-mono text-white">SCANNER OFFLINE</h2>
              <p className="max-w-md text-center text-sm text-gray-500">
                  ESTABLISH SECURE READ-ONLY LINK.
              </p>
              <button 
                  onClick={handleConnect}
                  className="bg-e24-flux text-black font-bold px-8 py-3 rounded flex items-center gap-2 hover:bg-cyan-400 transition-colors"
              >
                  <RefreshCcw size={18} /> INITIALIZE DRIVE LINK
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-e24-void text-gray-300 p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8 border-b border-e24-border pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-mono">Drive Scanner</h2>
          <p className="text-e24-flux font-mono text-sm">SCAN // HASH // INGEST</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-e24-success border border-e24-success/30 px-3 py-1 rounded bg-e24-success/10">
            <CheckCircle size={14} /> CONNECTION ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* LEFT: INPUT ZONE */}
          <div className="space-y-6">
              <div className="bg-e24-lattice border-2 border-dashed border-e24-border rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-e24-flux/50 transition-colors cursor-pointer group"
                   onClick={() => fileInputRef.current?.click()}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                  />
                  <div className="w-16 h-16 bg-e24-void rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={32} className="text-e24-flux" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">SELECT SOURCE</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                      SIMULATE DRIVE SELECTION.
                  </p>
              </div>

              {scanStatus !== 'IDLE' && (
                  <div className="bg-e24-lattice border border-e24-border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center text-xs font-mono text-gray-400 uppercase">
                          <span>Processing Pipeline</span>
                          <span className="animate-pulse text-e24-node">{scanStatus}...</span>
                      </div>
                      
                      <div className="space-y-3">
                          {/* Step 1: Hashing */}
                          <div className={`flex items-center gap-3 p-3 rounded border ${scannedFile?.hash ? 'border-e24-success/30 bg-e24-success/5 text-e24-success' : 'border-gray-800 text-gray-600'}`}>
                              <Hash size={18} />
                              <div className="flex-1">
                                  <div className="text-xs font-bold">SHA-256 CONTENT HASHING</div>
                                  {scannedFile?.hash && <div className="text-[10px] font-mono mt-1 opacity-80 break-all">{scannedFile.hash}</div>}
                              </div>
                              {scannedFile?.hash && <CheckCircle size={14} />}
                          </div>

                          {/* Step 2: OCR */}
                          <div className={`flex items-center gap-3 p-3 rounded border ${ocrResult ? 'border-e24-success/30 bg-e24-success/5 text-e24-success' : (scanStatus === 'ANALYZING' ? 'border-e24-flux/30 text-e24-flux animate-pulse' : 'border-gray-800 text-gray-600')}`}>
                              <Search size={18} />
                              <div className="flex-1">
                                  <div className="text-xs font-bold">GEMINI 2.5 FLASH OCR</div>
                                  <div className="text-[10px] mt-1 opacity-80">
                                      {ocrResult ? 'TEXT EXTRACTION COMPLETE' : 'EXTRACTING SEMANTIC STRUCTURE...'}
                                  </div>
                              </div>
                              {ocrResult && <CheckCircle size={14} />}
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* RIGHT: RESULTS ZONE */}
          <div className="bg-e24-lattice border border-e24-border rounded-lg flex flex-col overflow-hidden h-full max-h-[600px]">
              <div className="p-4 border-b border-e24-border bg-e24-void/50 flex justify-between items-center">
                  <h3 className="font-mono text-sm text-gray-400 flex items-center gap-2">
                      <FileCheck size={14} /> ARTIFACT ANALYSIS
                  </h3>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                  {!scannedFile ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                          <FileText size={48} className="opacity-20" />
                          <p className="text-sm font-mono">NO DOCUMENT LOADED</p>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <div>
                              <label className="text-xs text-gray-500 uppercase mb-2 block">File Metadata</label>
                              <div className="grid grid-cols-2 gap-4 text-sm font-mono text-gray-300">
                                  <div className="bg-e24-void p-2 rounded border border-e24-border">
                                      <span className="block text-[10px] text-gray-500">NAME</span>
                                      {scannedFile.name}
                                  </div>
                                  <div className="bg-e24-void p-2 rounded border border-e24-border">
                                      <span className="block text-[10px] text-gray-500">SIZE</span>
                                      {(scannedFile.size / 1024).toFixed(2)} KB
                                  </div>
                              </div>
                          </div>

                          {ocrResult && (
                              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <label className="text-xs text-e24-flux uppercase mb-2 block flex items-center gap-2">
                                      <Bot size={12} /> Legal Summary (Generated)
                                  </label>
                                  <div className="bg-e24-flux/10 border border-e24-flux/30 p-4 rounded text-sm text-gray-200 leading-relaxed italic">
                                      "{ocrResult.summary}"
                                  </div>

                                  <label className="text-xs text-gray-500 uppercase mb-2 block mt-6">Extracted Text Payload</label>
                                  <div className="bg-black/30 border border-e24-border p-4 rounded text-xs font-mono text-gray-400 h-40 overflow-y-auto whitespace-pre-wrap">
                                      {ocrResult.text}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {ocrResult && (
                  <div className="p-4 border-t border-e24-border bg-e24-void/30">
                      <button 
                          onClick={commitToVault}
                          className="w-full bg-e24-flux text-black font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors"
                      >
                          <Lock size={16} /> COMMIT TO VAULT (BFO) <ArrowRight size={16} />
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};