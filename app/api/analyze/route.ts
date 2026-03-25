import { NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/scraper';
import { analyzeWithAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    const { metrics, content } = await scrapeWebsite(url);
    
    // Attempt AI Analysis
    try {
      const aiResult = await analyzeWithAI(metrics, content);
      
      return NextResponse.json({
        metrics,
        insights: aiResult.insights,
        recommendations: aiResult.recommendations,
        logs: { ...aiResult.logs, modelUsed: aiResult.logs.modelUsed },
      });
    } catch (aiError: any) {
      console.error('AI analysis warning:', aiError.message);
      // Still return metrics even if AI fails, but include the error
      return NextResponse.json({
        metrics,
        error: `Website scraped, but AI analysis failed: ${aiError.message}`,
        content, // Re-expose content if AI fails for debugging if needed
      });
    }

  } catch (error: any) {
    console.error('Audit tool error:', error.message);
    const message = error.response ? `Failed to fetch URL: ${error.code || error.message}` : error.message;
    return NextResponse.json(
      { error: message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
