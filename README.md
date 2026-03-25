# AI Website Audit Tool

A tool that combines web scraping with AI-based analysis to audit SEO, UX, and content structure. It extracts metrics from a URL and generates actionable, data-driven recommendations.

## 🚀 Architecture

- **Next.js (App Router)**: Orchestrates frontend and API routes.
- **Cheerio Scraper**: Extracts visibility metrics and metadata from HTML.
- **AI Engine**: Uses OpenRouter with fallback between available free models (Gemma, Llama, Mistral).
- **Modular Structure**: Separate logic for data extraction (`scraper.ts`), AI processing (`ai.ts`), and UI.

## 🧠 AI Design Decisions

- **Structured Output**: Uses JSON schemas for deterministic, machine-readable results.
- **Decision Intelligence**: AI calculates an overall Audit Score (0-100) and identifies the Critical Path (Top 3 Issues).
- **Grounded Analysis**: Rules enforce that every insight references specific metrics (e.g., "H1 count is 1").
- **Rationale Mapping**: Every recommendation includes a "Rationale" explaining the business impact and why it matters.

## 🛠️ Prompt Engineering

The analysis uses a balanced prompt structure:
1. **System Prompt**: Defines the persona (Expert Audit Engine) and enforces operational rules (JSON-only, no hallucinations, mandatory metric references).
2. **User Prompt**: Provides structured metrics JSON and provides the context for scoring and prioritization.

### 🧾 Prompt Logs
The system captures the following logs for transparency and auditing:
- **System & User Prompts**: Exact instructions sent to the model.
- **Input Metrics**: Raw data extracted by the scraper.
- **Content Excerpt**: Portions of page text used as context (truncated for length).
- **Raw Response**: The exact text returned by the model before parsing.
*Sensitive data is excluded from these logs.*

## ✅ Evaluation Alignment

- **AI-Native Implementation**: Relies on structured patterns and grounded evidence.
- **Orchestration**: Separation between scraping (data acquisition) and AI (synthesis).
- **Practicality**: Every recommendation is tied to a specific metric and a clear rationale.

## 📄 Example Output

```json
{
  "auditScore": 62,
  "topIssues": ["100% images missing alt text", "0 external links detected"],
  "insights": {
    "seo": {
      "summary": "1 H1 is present, but 0 external links limit authority signals.",
      "evidence": ["H1 count: 1", "External links: 0"]
    }
  },
  "recommendations": [
    {
      "issue": "Missing external links",
      "action": "Add authoritative outbound links to improve credibility.",
      "rationale": "Improves domain authority and helps search engines verify site relevancy.",
      "priority": "medium"
    }
  ]
}
```

## ⚠️ Limitations

- **Heuristic-based Detection**: CTA detection uses text patterns and may miss some visually styled buttons.
- **Context Filtering**: Content extraction may occasionally include non-visible elements.
- **Model Latency**: Using free-tier LLMs may introduce slight latency or outcome variations.

## ⚖️ Trade-offs

- **Single-Page Scraping**: Only audits the provided URL to maintain speed.
- **Text Truncation**: Page content is capped at ~4,000 characters to fit model context limits.
- **Free Model Fallback**: Automatically rotates between free models if an endpoint is unavailable.

## 💻 Running Locally

1. **Install**: `npm install`
2. **Configure**: Add `OPENROUTER_API_KEY=your_key` to `.env.local`
3. **Run**: `npm run dev`
4. **Access**: Navigate to `http://localhost:3000`
