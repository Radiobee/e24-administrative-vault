
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  BFO_ENGINE = 'BFO_ENGINE',
  VAULT = 'VAULT',
  STRIKE_CONSOLE = 'STRIKE_CONSOLE',
  CO_FIDUCIARY = 'CO_FIDUCIARY',
  DRIVE_SCANNER = 'DRIVE_SCANNER',
  INGESTION = 'INGESTION',
  DOCUMENTATION = 'DOCUMENTATION'
}

export type AuthorityLevel = 'HUMAN_SOLE' | 'AI_RECOMMENDED' | 'JOINT_CONSENSUS' | 'OVERRIDE';
export type FlowStage = 'INTAKE' | 'ANALYSIS' | 'DECISION' | 'SIGNING' | 'COMMITTED';
export type GovernanceMode = 'SOLE_FIDUCIARY' | 'JOINT_COUNCIL';

// LOCKED SCHEMAS V1.0.0 (E24 LEECH)
export interface AuditMetadata {
  schema: '1.0.0';
  
  // Source Integrity
  sourceType?: 'USER_UPLOAD' | 'GOOGLE_DRIVE' | 'SYSTEM_GENERATED' | 'USER_INPUT' | 'AI_GENERATED';
  sourceIdentity?: string; // Filename, MessageID, AssetName
  sourceHash?: string;     // SHA-256 of the input data
  
  // Transformation Logic
  processTool?: string;    // "Ollama Llama 3.2", "SHA-256", "ECDSA", "G24-Code"
  processRisk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Fiduciary State
  governanceMode?: GovernanceMode;
  authorityLevel?: AuthorityLevel;
  
  // Output Artifacts
  targetPath?: string;     // Vault Path
  outputHash?: string;     // SHA-256 of the resulting artifact
  bfoId?: string;          // Linked Binary Fiduciary Object
  
  // Extended Deterministic Context
  context?: Record<string, any>; 
}

// EXHIBIT Z MANIFEST SCHEMA (LOCKED)
export interface ExhibitZArtifact {
  source: string;
  vaultName?: string;
  hash: string;
  path?: string;
}

export interface ExhibitZManifest {
  schema: "EXHIBIT_Z_V1";
  timestamp: string;
  artifactCount: number;
  artifacts: ExhibitZArtifact[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: 'USER' | 'AI_CO_FIDUCIARY' | 'SYSTEM' | 'COUNCIL_MAJORITY' | 'SYSTEM_FAILSAFE' | 'INGESTION_AGENT';
  action: 'INTAKE' | 'ANALYSIS' | 'APPROVAL' | 'OVERRIDE' | 'REJECTION' | 'HASHING' | 'SIGNATURE' | 'RATIFICATION' | 'AUTO_COMMIT' | 'SYSTEM_HALT' | 'MANUAL_INTERVENTION' | 'CHAT_INTERACTION' | 'DRIVE_IMPORT' | 'INTAKE_RECEIVED' | 'OCR_COMPLETED' | 'CLASSIFICATION_PROPOSED' | 'REFILE_COMPLETED' | 'EXHIBIT_Z_BUILT' | 'EXTERNAL_ANCHOR_PUBLISHED';
  details: string;
  hash: string;
  previousHash: string; // Enforces linear audit authority
  rationale?: string; // "Why"
  metadata: AuditMetadata; // LOCKED SCHEMA
  signature?: string; // Cryptographic proof of actor intent (if applicable)
}

export interface BFOObject {
  id: string;
  hash: string;
  timestamp: string;
  type: 'CONTRACT' | 'DEED' | 'AFFIDAVIT' | 'MEMO' | 'AMENDMENT' | 'DISPUTE' | 'CHAINED_RECORD' | 'DIGITAL_ASSET';
  status: 'IMMUTABLE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  contentSummary: string;
  authorityLevel: AuthorityLevel;
  governance: GovernanceMode;
  signatures: string[];
  referenceId?: string; // ID of the BFO being corrected, disputed, or chained (Additive Ledger)
  path?: string; // Virtual Vault Path
}

export interface Asset {
  id: string;
  name: string;
  valuation: number;
  status: 'ACTIVE' | 'ACQUISITION_TARGET' | 'LIQUIDATED';
  type: 'ENTITY' | 'REAL_ESTATE' | 'IP' | 'LIQUID';
  auditTrail?: AuditEvent[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type AudienceType = 'INVESTOR' | 'PARTNER' | 'MARKET';

export interface IngestItem {
  id: string;
  file: File;
  status: 'QUEUED' | 'HASHING' | 'OCR' | 'CLASSIFYING' | 'REVIEW' | 'COMMITTING' | 'COMPLETE';
  originalHash: string;
  finalHash?: string;
  ocrText?: string;
  suggestedPath?: string;
  suggestedName?: string;
  logs: string[];
}