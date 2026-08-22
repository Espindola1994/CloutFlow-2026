/**
 * Sanitizes inbound email HTML to prevent XSS, malicious script execution,
 * or dangerous embedded tags before storing or rendering in Admin UI.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let sanitized = html
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags (optional, prevent CSS injection/overlay attacks)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove iframe, object, embed, applet tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    // Remove event handlers (e.g. onload=, onclick=, onerror=)
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: URLs
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"')
    .replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'src=""');

  return sanitized;
}

/**
 * Extracts plain text from an HTML string for preview rendering.
 */
export function extractTextSnippet(textOrHtml: string, maxLength = 140): string {
  if (!textOrHtml) return '';
  const plain = textOrHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trim() + '...';
}
