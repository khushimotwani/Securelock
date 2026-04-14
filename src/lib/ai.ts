import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

// Only initialize if we have a key
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// The schema ensures Gemini returns precisely parsable JSON without markdown wrapping.
const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    isMalicious: {
      type: SchemaType.BOOLEAN,
      description: "True if the payload indicates an exploit attempt (XSS, SQLi, Command Injection, etc).",
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: "Confidence percentage (0-100) of this assessment.",
    },
    reasoning: {
      type: SchemaType.STRING,
      description: "A short, 1-2 sentence technical explanation for why this payload is blocked or allowed.",
    },
  },
  required: ["isMalicious", "confidence", "reasoning"],
};

export type AIAnalysisResult = {
  isMalicious: boolean;
  confidence: number;
  reasoning: string;
};

export async function analyzePayload(payload: string, context: string): Promise<AIAnalysisResult> {
  // ---------------------------------------------------------------------------------
  // 1. CONSERVATIVE AI PRE-FILTERING (Save API Quota/Money)
  // ---------------------------------------------------------------------------------
  // If the payload is completely devoid of execution metacharacters (only alphanumeric + basic punctuation),
  // there is mathematically zero chance of injection. Return benign instantly without calling the LLM.
  const isSuperSafe = /^[a-zA-Z0-9\s.\-_@]+$/.test(payload);
  if (isSuperSafe) {
    return {
      isMalicious: false,
      confidence: 100,
      reasoning: "Static WAF Pre-filter: Input contains zero executable metacharacters. Bypassed AI inference to conserve API quota.",
    };
  }

  // Graceful fail-closed or fail-open if the API key is missing. 
  if (!genAI) {
    console.warn("No GEMINI_API_KEY found. Bypassing AI analysis (Fail-Open fallback).");
    const isSuspicious = /[;&|`$\\]|(' OR '1)/i.test(payload);
    return {
      isMalicious: isSuspicious,
      confidence: 100,
      reasoning: isSuspicious ? "Static Fallback: Malicious characters detected." : "Static Fallback: Payload appears benign.",
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `
Context of Input: ${context}
Raw Payload: """${payload}"""

Analyze the payload and determine if it contains malicious exploit signatures based on the context.
`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: "You are The Securelock AI Sentinel WAF. Your job is to analyze incoming network payloads from untrusted clients. Evaluate the input strictly for malicious intent like SQL Injection, Command Injection, XSS, or Directory Traversal. Do not be fooled by obfuscation. You must output JSON matching the required schema." }]
      },
      contents: [
        { parts: [{ text: prompt }] }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API generated an HTTP error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const jsonStr = result.candidates[0].content.parts[0].text;
    const data = JSON.parse(jsonStr) as AIAnalysisResult;
    
    return data;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error("AI Analysis failed. Activating Manual Fallback:", errMessage);
    
    // ---------------------------------------------------------------------------------
    // 2. AUTOMATIC FALLBACK RESILIENCE (If AI is down or rate limited)
    // ---------------------------------------------------------------------------------

    const manualDangerRegex = /[;&|`$\\]|(?:(?:\.\.\/)+)|(?:wget|curl|nc|bash|sh|powershell|cmd)|(?:<script.*?>.*?<\/script>)|(' OR '1'='1'|admin'--|;|UNION)/i;
    const isSuspicious = manualDangerRegex.test(payload);
    
    return {
      isMalicious: isSuspicious,
      confidence: 80,
      reasoning: isSuspicious 
        ? "API Offline Fallback: Manual regex parsing intercepted severe malicious signatures." 
        : "API Offline Fallback: Manual static parsing matched no known threat signatures.",
    };
  }
}
