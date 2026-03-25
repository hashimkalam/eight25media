import axios from 'axios';
import { AuditMetrics } from './scraper';

export interface AIInsight {
  summary: string;
  evidence: string[];
}

export interface AIRecommendation {
  issue: string;
  evidence: string;
  impact: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIAnalysisResponse {
  insights: {
    seo: AIInsight;
    messaging: AIInsight;
    cta: AIInsight;
    content_depth: AIInsight;
    ux: AIInsight;
  };
  recommendations: AIRecommendation[];
  logs: {
    systemPrompt: string;
    userPrompt: string;
    inputMetrics: AuditMetrics;
    truncatedContentLength: number;
    rawOutput: string;
    modelUsed: string;
  };
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Reliable free models on OpenRouter (using multiple for redundancy)
const FALLBACK_MODELS = [
  "google/gemma-2-9b-it:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct-v0.1:free",
  "openrouter/auto"
];

export async function analyzeWithAI(
  metrics: AuditMetrics,
  content: string,
  modelIndex: number = 0
): Promise<AIAnalysisResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
  }

  const currentModel = FALLBACK_MODELS[modelIndex] || FALLBACK_MODELS[0];
  const truncatedContent = content.slice(0, 4000);
  const truncatedContentLength = truncatedContent.length;

  const systemPrompt = `You are an expert website audit engine.

Strict rules for your response:
1. DATA-FIRST ONLY: Start every insight with a metric. Avoid conversational filler like "The page has", "It appears", or "Significant issue".
2. DIRECT & CONCISE: Use short, professional sentences. No over-explaining.
3. NO HALLUCINATION: Only use provided metrics and content.
4. METRIC GROUNDING: Every claim must reference a numerical metric or specific text found.
5. NO MARKDOWN: Return strictly valid JSON only.

Tone example: "1 H1, 5 H2s, and 10 H3s form a structured hierarchy. However, 0 external links limit authority signals."

Expected JSON format:
{
  "insights": {
    "seo": { "summary": "...", "evidence": ["..."] },
    "messaging": { "summary": "...", "evidence": ["..."] },
    "cta": { "summary": "...", "evidence": ["..."] },
    "content_depth": { "summary": "...", "evidence": ["..."] },
    "ux": { "summary": "...", "evidence": ["..."] }
  },
  "recommendations": [
    {
      "issue": "Specific issue title (including metric)",
      "evidence": "Numerical evidence",
      "impact": "Concise impact statement",
      "action": "Direct action to take",
      "priority": "high | medium | low"
    }
  ]
}`;

  const userPrompt = `Analyze this webpage:

Metrics:
${JSON.stringify(metrics, null, 2)}

Content:
${truncatedContent}

Tasks:
- SEO & Architecture
- Messaging & Clarity
- Conversion Paths
- Content Depth
- User Experience

Provide 3–5 prioritized recommendations with titles like "Missing alt text (28 images)".`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: currentModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://zenith-audit.vercel.app',
          'X-Title': 'Zenith Audit Tool',
        },
      }
    );

    const rawOutput = response.data.choices?.[0]?.message?.content || "";

    try {
      const jsonString = rawOutput.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(jsonString);

      return {
        insights: parsedData.insights,
        recommendations: parsedData.recommendations,
        logs: {
          systemPrompt,
          userPrompt,
          inputMetrics: metrics,
          truncatedContentLength,
          rawOutput,
          modelUsed: currentModel,
        },
      };
    } catch (parseError) {
      console.error(`AI JSON Parse Error with model ${currentModel}:`, parseError);
      
      // Fallback to next model if parsing fails
      if (modelIndex < FALLBACK_MODELS.length - 1) {
        console.log(`Retrying with next fallback model: ${FALLBACK_MODELS[modelIndex + 1]}`);
        return analyzeWithAI(metrics, content, modelIndex + 1);
      }

      throw new Error('Failed to parse AI response as valid JSON after multiple model attempts');
    }
  } catch (error: any) {
    const status = error.response?.status;
    console.error(`Status ${status} for model ${currentModel}: ${error.response?.data?.error?.message || error.message}`);

    // If 404 or other non-auth errors, try the next model
    if (status === 404 || status >= 500) {
      if (modelIndex < FALLBACK_MODELS.length - 1) {
        console.log(`Status ${status} detected. Retrying with next fallback model: ${FALLBACK_MODELS[modelIndex + 1]}`);
        return analyzeWithAI(metrics, content, modelIndex + 1);
      }
    }

    throw new Error(`AI Analysis failed: ${error.response?.data?.error?.message || error.message}`);
  }
}
