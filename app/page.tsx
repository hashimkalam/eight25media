'use client';

import { useState } from 'react';
import axios from 'axios';
import { AuditMetrics } from '@/lib/scraper';
import { AIAnalysisResponse } from '@/lib/ai';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Pick<AIAnalysisResponse, 'insights' | 'recommendations'> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMetrics(null);
    setAiAnalysis(null);
    setError(null);

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      const { data } = await axios.post('/api/analyze', { url: finalUrl });
      setMetrics(data.metrics);
      if (data.insights) {
        setAiAnalysis({
          insights: data.insights,
          recommendations: data.recommendations
        });
      }
      if (data.error) {
        setError(data.error); 
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-16 px-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Professional Header */}
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Website Audit Tool
          </h1>
          <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium">
            Analyze SEO, UX, and structure in seconds.
          </p>
        </header>

        {/* Search Section */}
        <section className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a website URL (e.g. example.com)"
              className="flex-1 px-5 py-4 outline-none text-slate-700 bg-white placeholder:text-slate-400 font-medium"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Run Audit'}
            </button>
          </form>
        </section>

        {error && !metrics && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center max-w-4xl mx-auto font-medium">
            {error}
          </div>
        )}

        {!metrics && !loading && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Awaiting URL Input</p>
          </div>
        )}

        {loading && !metrics && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Capturing Metrics...</p>
          </div>
        )}

        {metrics && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            
            {/* 1. Metrics Card */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">Core Metrics</h2>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                  <MetricStat label="Word Count" value={metrics.wordCount.toLocaleString()} />
                  <MetricStat label="Total Images" value={metrics.images} />
                  <MetricStat label="H1 Count" value={metrics.headings.h1} />
                  <MetricStat label="CTA Count" value={metrics.ctaCount} />
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border-t border-slate-100">
                  <MetricStat label="Internal Links" value={metrics.internalLinks} />
                  <MetricStat label="External Links" value={metrics.externalLinks} />
                  <MetricStat label="Missing Alt Tags" value={metrics.imagesMissingAlt} />
                  <MetricStat label="Missing Alt (%)" value={`${metrics.imagesMissingAltPercentage}%`} />
               </div>
               <div className="p-6 border-t border-slate-100 space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meta Title</p>
                    <p className="text-sm text-slate-700 font-medium">{metrics.metaTitle || 'Missing'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meta Description</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{metrics.metaDescription || 'Missing'}</p>
                  </div>
               </div>
            </section>

            {/* Analysis & Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* 2. Analysis Card */}
              <div className="lg:col-span-2">
                 <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-10">
                    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-50 pb-4">Analysis Breakdown</h2>
                    
                    {aiAnalysis ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <InsightSection title="SEO & Architecture" data={aiAnalysis.insights.seo} />
                        <InsightSection title="Messaging & Clarity" data={aiAnalysis.insights.messaging} />
                        <InsightSection title="Conversion Paths" data={aiAnalysis.insights.cta} />
                        <InsightSection title="User Experience" data={aiAnalysis.insights.ux} />
                        <InsightSection title="Content Depth" data={aiAnalysis.insights.content_depth} className="md:col-span-2" />
                      </div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
                         <div className="w-8 h-8 border-2 border-slate-100 border-t-slate-400 rounded-full animate-spin"></div>
                         <p className="text-[9px] font-bold uppercase tracking-widest">Generating AI Synthesis...</p>
                      </div>
                    )}
                 </section>
              </div>

              {/* 3. Recommendations Card */}
              <div className="space-y-6">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-2">Prioritized Roadmap</h3>
                 <div className="space-y-4">
                    {aiAnalysis?.recommendations.map((rec, i) => (
                       <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 transition-all hover:border-slate-300">
                          <div className="flex justify-between items-start gap-4">
                             <h4 className="font-bold text-slate-900 text-sm leading-tight">{rec.issue}</h4>
                             <PriorityBadge priority={rec.priority} />
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <h5 className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Recommended Action</h5>
                             <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">{rec.action}</p>
                          </div>
                          <div className="text-[10px] text-slate-400 italic flex items-center gap-2">
                             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             {rec.impact}
                          </div>
                       </div>
                    ))}
                    {!aiAnalysis && [1,2,3].map(i => (
                      <div key={i} className="h-44 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MetricStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-6">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: any = {
    high: 'bg-red-50 border-red-100 text-red-600',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    low: 'bg-slate-100 border-slate-200 text-slate-500',
  };
  return (
    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${styles[priority.toLowerCase()] || styles.low}`}>
      {priority}
    </span>
  );
}

function InsightSection({ title, data, className = '' }: { title: string; data: { summary: string, evidence: string[] }; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
        {title}
      </h3>
      <p className="text-sm font-medium text-slate-600 leading-relaxed px-1">
        {data.summary}
      </p>
      <div className="flex flex-wrap gap-2 pt-1 px-1">
        {data.evidence.map((item, i) => (
          <span key={i} className="text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
