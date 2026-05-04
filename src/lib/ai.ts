import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

// Only initialize if we have a key
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

// The schema ensures Claude returns precisely parsable JSON
const tool: Anthropic.Tool = {
  name: "report_analysis",
  description: "Report the results of the payload analysis.",
  input_schema: {
    type: "object",
    properties: {
      isMalicious: {
        type: "boolean",
        description: "True if the payload indicates an exploit attempt (XSS, SQLi, Command Injection, etc).",
      },
      confidence: {
        type: "number",
        description: "Confidence percentage (0-100) of this assessment.",
      },
      reasoning: {
        type: "string",
        description: "A short, 1-2 sentence technical explanation for why this payload is blocked or allowed.",
      },
    },
    required: ["isMalicious", "confidence", "reasoning"],
  },
};

export type AIAnalysisResult = {
  isMalicious: boolean;
  confidence: number;
  reasoning: string;
};

export async function analyzePayload(payload: string, context: string): Promise<AIAnalysisResult> {
  // Removed static pre-filter to ensure active AI detection blocking on all payloads

  // Graceful fail-closed or fail-open if the API key is missing. 
  if (!anthropic) {
    console.warn("No ANTHROPIC_API_KEY found. Bypassing AI analysis (Fail-Open fallback).");
    const isSuspicious = /[;&|`$\\]|(' OR '1)/i.test(payload);
    return {
      isMalicious: isSuspicious,
      confidence: 100,
      reasoning: isSuspicious ? "Static Fallback: Malicious characters detected." : "Static Fallback: Payload appears benign.",
    };
  }

  try {
    const prompt = `
Context of Input: ${context}
Raw Payload: """${payload}"""

Analyze the payload and determine if it contains malicious exploit signatures based on the context.
`;

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: "You are The Securelock AI Sentinel WAF. Your job is to analyze incoming network payloads from untrusted clients. Evaluate the input strictly for malicious intent like SQL Injection, Command Injection, XSS, or Directory Traversal. Do not be fooled by obfuscation.",
      tools: [tool],
      tool_choice: { type: "tool", name: "report_analysis" },
      messages: [{ role: "user", content: prompt }]
    });

    const toolUse = msg.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("Claude did not return tool use block");
    }
    return toolUse.input as AIAnalysisResult;
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
