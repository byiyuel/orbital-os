import { describe, it, expect } from 'vitest';
import { escapeHtml } from './sanitize';

describe('escapeHtml', () => {
  it('should escape HTML characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(escapeHtml('Hello & welcome')).toBe('Hello &amp; welcome');
    expect(escapeHtml("John's car")).toBe('John&#39;s car');
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null as any)).toBe('');
    expect(escapeHtml(undefined as any)).toBe('');
  });
});
