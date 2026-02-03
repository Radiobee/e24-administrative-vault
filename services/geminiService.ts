// e8-UFOS Local Sovereign AI Service
// Provider: Ollama (Localhost)
// Protocol: REST API via Fetch (No External SDKs)

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.2'; // The "Brain"
const VISION_MODEL = 'llava';    // The "Eyes" (Optional, falls back if missing)

const SYSTEM_INSTRUCTION = `
You are the e8 Co-Fiduciary, an advanced AI component of the Unified Fiduciary Operating System (UFOS).
Your role is to act as a Chief Administrative Officer in a box.
You speak with extreme precision, using legal-tech terminology ("hashing", "immutable", "sovereignty", "deterministic").
You assist the user in managing assets, drafting "Binary Fiduciary Objects" (BFOs), and executing the "Strike" methodology.
You are concise, professional, and authoritative.
`;

// Types (Maintained for App Compatibility)
export interface FiduciaryAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: 'APPROVE' | 'REJECT' | 'REQUIRE_AUDIT';
  reasoning: string;
  suggestedClassification: 'CONTRACT' | 'DEED' | 'AFFIDAVIT' | 'MEMO' | 'AMENDMENT' | 'DISPUTE' | 'CHAINED_RECORD';
  compliance: {
    syntaxValid: boolean;
    assetIdentified: boolean;
    intentUnambiguous: boolean;
  };
  technicalFailure?: boolean;
}

// --- INTERNAL HELPERS ---

async function ollamaRequest(endpoint: string, payload: any): Promise<any> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Fiduciary Link Failure:", error);
        throw error; // Re-throw to be handled by caller
    }
}

// --- EXPORTED SERVICES ---

export const sendMessageToCoFiduciary = async (
  message: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
    try {
        // Map 'model' role to Ollama's 'assistant'
        const formattedHistory = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.text
        }));

        const payload = {
            model: OLLAMA_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                ...formattedHistory,
                { role: 'user', content: message }
            ],
            stream: false,
            options: { temperature: 0.3 }
        };

        const data = await ollamaRequest('/api/chat', payload);
        return data.message?.content || "Error: Empty response from Local Core.";
    } catch (error) {
        return "ERROR: Unable to reach Local Co-Fiduciary Core. Ensure 'ollama serve' is running with OLLAMA_ORIGINS='*'.";
    }
};

export const generateBFOSummary = async (assetName: string, assetType: string): Promise<string> => {
    const prompt = `Task: Generate a short, technical summary (max 30 words) for a new Binary Fiduciary Object.
    Asset: "${assetName}"
    Type: "${assetType}"
    Requirement: Use terms like "hashed", "bonded", "verified". Return ONLY the summary text.`;

    try {
        const payload = {
            model: OLLAMA_MODEL,
            prompt: SYSTEM_INSTRUCTION + "\n\n" + prompt,
            stream: false,
            options: { temperature: 0.2 }
        };

        const data = await ollamaRequest('/api/generate', payload);
        return data.response || "BFO Generation failed.";
    } catch (error) {
        return "System Error during BFO generation (Offline).";
    }
};

export const analyzeFiduciaryIntent = async (intent: string): Promise<FiduciaryAnalysis> => {
    const prompt = `Analyze the following administrative intent for fiduciary risk and mechanical compliance. 
    Intent: "${intent}"
    
    Return a valid JSON object with the following structure (NO MARKDOWN, JUST JSON):
    {
      "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "recommendation": "APPROVE" | "REJECT" | "REQUIRE_AUDIT",
      "reasoning": "string",
      "suggestedClassification": "CONTRACT" | "DEED" | "AFFIDAVIT" | "MEMO" | "AMENDMENT" | "DISPUTE" | "CHAINED_RECORD",
      "compliance": {
        "syntaxValid": boolean,
        "assetIdentified": boolean,
        "intentUnambiguous": boolean
      }
    }`;

    try {
        const payload = {
            model: OLLAMA_MODEL,
            prompt: prompt,
            format: "json",
            stream: false,
            options: { temperature: 0.1 }
        };

        const data = await ollamaRequest('/api/generate', payload);
        let cleanJson = data.response.trim();
        // Remove markdown formatting if present
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Analysis Failed:", error);
        return {
            riskLevel: 'CRITICAL',
            recommendation: 'REQUIRE_AUDIT',
            reasoning: 'CRITICAL FAILURE: Local Analysis Engine Unreachable.',
            suggestedClassification: 'MEMO',
            compliance: {
                syntaxValid: false,
                assetIdentified: false,
                intentUnambiguous: false
            },
            technicalFailure: true
        };
    }
};

export const performOCR = async (base64Data: string, mimeType: string): Promise<{ text: string, summary: string }> => {
    // Note: Standard Llama 3.2 is text-only. This attempts to use 'llava' if available.
    // If 'llava' is not pulled, this will fail. We catch the error and provide the "Administrative Bypass"
    // to ensure the Vault can still ingest the file hash even if OCR fails.
    
    try {
        const payload = {
            model: VISION_MODEL, // Tries to use Llava
            prompt: "Perform rigorous OCR. Return JSON: { \"extractedText\": \"...\", \"legalSummary\": \"...\" }",
            images: [base64Data],
            format: "json",
            stream: false
        };

        const data = await ollamaRequest('/api/generate', payload);
        let cleanJson = data.response.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        const json = JSON.parse(cleanJson);
        
        return {
            text: json.extractedText || "OCR Text Unavailable",
            summary: json.legalSummary || "Summary Unavailable"
        };
    } catch (error) {
        console.warn("Local Vision Model Failed (Llava likely missing):", error);
        
        // ADMINISTRATIVE BYPASS PROTOCOL
        // This ensures the file is still hashed and ingested even if local AI vision is offline.
        return { 
            text: "Administrative Bypass: Image Layer Unreadable by Local Core. Manual Reference Required.", 
            summary: "Administrative Bypass: Manual Entry - Content Hashed & Locked [PENDING HUMAN REVIEW]" 
        };
    }
};

export const classifyDocument = async (ocrText: string, filename: string): Promise<{ path: string, standardizedName: string }> => {
    const prompt = `Analyze this document to suggest a Vault path.
    Filename: ${filename}
    Text Sample: ${ocrText.substring(0, 300)}...
    
    Vault Structure: /Vault/[Category]/[Year]/[Entity/Asset]
    Categories: Contracts, Financials, Legal, IP, Correspondence.
    
    Return JSON: { "path": string, "standardizedName": string }
    Format Name: YYYY-MM-DD_Type_Description.pdf`;

    try {
        const payload = {
            model: OLLAMA_MODEL,
            prompt: prompt,
            format: "json",
            stream: false
        };

        const data = await ollamaRequest('/api/generate', payload);
        let cleanJson = data.response.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        const json = JSON.parse(cleanJson);
        
        return {
            path: json.path || "/Vault/Inbox",
            standardizedName: json.standardizedName || filename
        };
    } catch (e) {
        console.error("Classification Error", e);
        return { path: "/Vault/Inbox", standardizedName: filename };
    }
};