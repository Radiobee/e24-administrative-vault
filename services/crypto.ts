import { AuditEvent } from '../types';

// --- KEYRING & IDENTITY MANAGEMENT ---

const KEY_STORAGE_NAME = 'e8_fiduciary_key_v1';

// Helper to export key to JWK for storage
const exportKey = async (key: CryptoKey): Promise<JsonWebKey> => {
    return await crypto.subtle.exportKey("jwk", key);
}

// Helper to import key from JWK
const importKey = async (jwk: JsonWebKey, type: 'sign' | 'verify'): Promise<CryptoKey> => {
    return await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        [type]
    );
}

// ECDSA Key Generation (P-256) with Persistence
export const generateKeyPair = async (forceNew = false): Promise<CryptoKeyPair> => {
  // 1. Check for existing key
  if (!forceNew) {
      const stored = localStorage.getItem(KEY_STORAGE_NAME);
      if (stored) {
          try {
              const { privateJwk, publicJwk } = JSON.parse(stored);
              const privateKey = await importKey(privateJwk, 'sign');
              const publicKey = await importKey(publicJwk, 'verify');
              console.log("e8-Crypto: Restored Persistent Identity");
              return { privateKey, publicKey };
          } catch (e) {
              console.error("e8-Crypto: Key Corruption Detected. Regenerating.", e);
          }
      }
  }

  // 2. Generate New
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  // 3. Persist
  const privateJwk = await exportKey(keyPair.privateKey);
  const publicJwk = await exportKey(keyPair.publicKey);
  
  localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify({ privateJwk, publicJwk }));
  console.log("e8-Crypto: Generated New Identity");

  return keyPair;
};

// Get a visual fingerprint of the public key (first 8 chars of hash)
export const getIdentityFingerprint = async (publicKey: CryptoKey): Promise<string> => {
    const exported = await exportKey(publicKey);
    const str = JSON.stringify(exported); // Deterministic enough for UI ID
    const hash = await sha256(str);
    return hash.substring(2, 10).toUpperCase();
}

export const clearIdentity = () => {
    localStorage.removeItem(KEY_STORAGE_NAME);
}

// --- STANDARD CRYPTO PRIMITIVES ---

// Deterministic JSON Canonicalization
export const canonicalize = (data: any): string => {
  if (data === undefined || data === null) return 'null';
  
  if (typeof data !== 'object') {
     return JSON.stringify(data);
  }
  
  if (Array.isArray(data)) {
    return '[' + data.map(item => canonicalize(item)).join(',') + ']';
  }

  if (data instanceof Date) {
      return JSON.stringify(data);
  }
  
  const keys = Object.keys(data).sort();
  const parts = [];
  for (const key of keys) {
      const val = data[key];
      if (val === undefined) continue; 
      parts.push(`"${key}":${canonicalize(val)}`);
  }
  return '{' + parts.join(',') + '}';
};

// SHA-256 Hashing via WebCrypto API
export const sha256 = async (data: string | ArrayBuffer | Uint8Array): Promise<string> => {
  let buffer: BufferSource;
  
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else {
    buffer = data;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// High-Level Helper: Compute Hash of Object
export const computeHash = async (data: any): Promise<string> => {
    const json = canonicalize(data);
    return await sha256(json);
};

// Sign Data
export const signData = async (privateKey: CryptoKey, data: string): Promise<string> => {
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" } },
    privateKey,
    enc.encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

// Verify Signature
export const verifySignature = async (publicKey: CryptoKey, signature: string, data: string): Promise<boolean> => {
  const enc = new TextEncoder();
  const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
  return await crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" }
    },
    publicKey,
    signatureBytes,
    enc.encode(data)
  );
};

// Verify Ledger Integrity
export const verifyLedger = async (reverseLog: AuditEvent[]): Promise<{ valid: boolean, errorIndex: number, errorMsg?: string }> => {
  if (reverseLog.length === 0) return { valid: true, errorIndex: -1 };

  const log = [...reverseLog].reverse();

  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    
    const payloadObj = {
          previousHash: entry.previousHash,
          timestamp: entry.timestamp,
          actor: entry.actor,
          action: entry.action,
          details: entry.details,
          rationale: entry.rationale || '', 
          metadata: entry.metadata, 
          signature: entry.signature || ''
    };
    
    const calculatedHash = await computeHash(payloadObj);
    
    if (calculatedHash !== entry.hash) {
      return { 
          valid: false, 
          errorIndex: i, 
          errorMsg: `Hash Mismatch at Block ${i}. Stored: ${entry.hash.substring(0,8)}..., Calc: ${calculatedHash.substring(0,8)}...` 
      };
    }

    if (i === 0) {
        if (entry.previousHash !== 'GENESIS') {
            return { valid: false, errorIndex: i, errorMsg: `Invalid Genesis PreviousHash: ${entry.previousHash}` };
        }
    } else {
        const prevEntry = log[i-1];
        if (entry.previousHash !== prevEntry.hash) {
            return { 
                valid: false, 
                errorIndex: i, 
                errorMsg: `Chain Broken at Block ${i}. PreviousHash ${entry.previousHash.substring(0,8)}... does not match Block ${i-1} Hash ${prevEntry.hash.substring(0,8)}...` 
            };
        }
    }
  }

  return { valid: true, errorIndex: -1 };
};