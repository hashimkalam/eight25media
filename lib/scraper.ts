import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanText, getDomain, isInternalLink } from './utils';

export interface AuditMetrics {
  wordCount: number;
  headings: { h1: number; h2: number; h3: number };
  ctaCount: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
  imagesMissingAlt: number;
  imagesMissingAltPercentage: number;
  metaTitle: string;
  metaDescription: string;
}

export interface ScraperResponse {
  metrics: AuditMetrics;
  content: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CTA_KEYWORDS = ["buy", "start", "get", "try", "contact", "sign up", "subscribe", "order"];

export async function scrapeWebsite(url: string): Promise<ScraperResponse> {
  const { data: html } = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000,
  });

  const $ = cheerio.load(html);
  const domain = getDomain(url) || '';

  // Remove unwanted elements before counting text
  $('script, style, nav, footer, iframe, noscript').remove();

  const bodyText = $('body').text();
  const cleanedText = cleanText(bodyText);
  const wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;

  const headings = {
    h1: $('h1').length,
    h2: $('h2').length,
    h3: $('h3').length,
  };

  const buttons = $('button').length;
  let ctaLinks = 0;
  $('a').each((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    if (CTA_KEYWORDS.some(keyword => text.includes(keyword))) {
      ctaLinks++;
    }
  });

  const ctaCount = buttons + ctaLinks;

  let internalLinks = 0;
  let externalLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      if (isInternalLink(href, domain)) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    }
  });

  const images = $('img');
  const imageCount = images.length;
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (!alt || alt.trim().length === 0) {
      imagesMissingAlt++;
    }
  });

  const imagesMissingAltPercentage = imageCount > 0 
    ? parseFloat(((imagesMissingAlt / imageCount) * 100).toFixed(2))
    : 0;

  const metaTitle = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
  const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

  return {
    metrics: {
      wordCount,
      headings,
      ctaCount,
      internalLinks,
      externalLinks,
      images: imageCount,
      imagesMissingAlt,
      imagesMissingAltPercentage,
      metaTitle,
      metaDescription,
    },
    content: cleanedText,
  };
}
