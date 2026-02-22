/**
 * Web browsing helpers — free, no API keys required.
 * - DuckDuckGo HTML endpoint for search
 * - Fetch + cheerio for page content extraction
 */

import * as cheerio from 'cheerio';

const USER_AGENT = 'Orca/1.0';
const MAX_CONTENT_LENGTH = 4000;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface BrowseResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Search the web using DuckDuckGo's HTML endpoint.
 */
export async function webSearch(
  query: string,
  maxResults: number = 5
): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
  try {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return { success: false, error: `DuckDuckGo error: ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: SearchResult[] = [];

    $('.result').each((_i, el) => {
      if (results.length >= maxResults) return false;

      const linkEl = $(el).find('.result__a');
      const snippetEl = $(el).find('.result__snippet');

      const title = linkEl.text().trim();
      let url = linkEl.attr('href') || '';
      const snippet = snippetEl.text().trim();

      // DuckDuckGo wraps URLs in a redirect — extract the actual URL
      if (url.includes('uddg=')) {
        try {
          const parsed = new URL(url, 'https://duckduckgo.com');
          url = decodeURIComponent(parsed.searchParams.get('uddg') || url);
        } catch {
          // keep original url
        }
      }

      if (title && url) {
        results.push({ title, url, snippet });
      }
    });

    return { success: true, results };
  } catch (err) {
    console.error('Web search error:', err);
    return { success: false, error: 'Failed to search the web' };
  }
}

/**
 * Browse a URL and extract readable text content.
 */
export async function browseUrl(
  url: string
): Promise<{ success: boolean; page?: BrowseResult; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch URL: ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return { success: false, error: `Unsupported content type: ${contentType}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').first().text().trim() || url;

    // Remove non-content elements
    $('script, style, nav, footer, header, aside, iframe, noscript, svg').remove();

    // Prefer article or main content, fall back to body
    let contentEl = $('article');
    if (!contentEl.length) contentEl = $('main');
    if (!contentEl.length) contentEl = $('body');

    // Get text and clean up whitespace
    let content = contentEl.text();
    content = content.replace(/\s+/g, ' ').trim();

    // Truncate to avoid flooding LLM context
    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.slice(0, MAX_CONTENT_LENGTH) + '... [truncated]';
    }

    return {
      success: true,
      page: { title, url, content },
    };
  } catch (err) {
    console.error('Browse URL error:', err);
    const message = err instanceof Error ? err.message : 'Failed to browse URL';
    return { success: false, error: message };
  }
}
