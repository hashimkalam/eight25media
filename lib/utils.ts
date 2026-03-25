/**
 * Cleans visible text by removing extra whitespaces and newlines.
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Extracts the domain from a URL string.
 */
export function getDomain(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Checks if a link is internal or external based on the base domain.
 */
export function isInternalLink(link: string, baseDomain: string): boolean {
  if (!link) return false;
  if (link.startsWith('/') || link.startsWith('#')) return true;

  try {
    const linkDomain = new URL(link).hostname.replace('www.', '');
    return linkDomain === baseDomain;
  } catch {
    // If it's not a valid URL (e.g. mailto:, tel:), we can treat it as external or ignore it.
    // For this audit tool, we'll return false for non-http/absolute links that aren't relative.
    return false;
  }
}
