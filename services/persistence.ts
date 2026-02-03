import { AuditEvent, BFOObject, Asset } from '../types';

const STORAGE_KEYS = {
  AUDIT_LOG: 'e8_ufos_audit_log_v1',
  BFOS: 'e8_ufos_bfos_v1',
  ASSETS: 'e8_ufos_assets_v1',
  DISCLAIMER: 'e8_disclaimer_accepted'
};

export const persistence = {
  // --- AUDIT LEDGER ---
  saveLedger: (log: AuditEvent[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(log));
    } catch (e) {
      console.error("e8-Persistence: Failed to save Ledger", e);
    }
  },

  loadLedger: (): AuditEvent[] | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("e8-Persistence: Failed to load Ledger", e);
      return null;
    }
  },

  // --- BFOs ---
  saveBFOs: (bfos: BFOObject[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.BFOS, JSON.stringify(bfos));
    } catch (e) {
      console.error("e8-Persistence: Failed to save BFOs", e);
    }
  },

  loadBFOs: (): BFOObject[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BFOS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // --- ASSETS ---
  saveAssets: (assets: Asset[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    } catch (e) {
      console.error("e8-Persistence: Failed to save Assets", e);
    }
  },

  loadAssets: (): Asset[] | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // --- UTILS ---
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
    localStorage.removeItem(STORAGE_KEYS.BFOS);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    // Note: We deliberately do not clear the disclaimer or keys here
    console.log("e8-Persistence: State Wiped");
  }
};