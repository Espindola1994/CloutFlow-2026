import { describe, it, expect } from 'vitest';
import { maskEmail } from '../mask';

describe('maskEmail utility', () => {
  it('masks standard email correctly', () => {
    expect(maskEmail('lojadasplantas@gmail.com')).toBe('loj*****@gmail.com');
    expect(maskEmail('guilhermeterraaa@gmail.com')).toBe('gui*****@gmail.com');
  });

  it('masks shorter local parts gracefully', () => {
    expect(maskEmail('ab@gmail.com')).toBe('a*@gmail.com');
    expect(maskEmail('abc@gmail.com')).toBe('a**@gmail.com');
    expect(maskEmail('john@gmail.com')).toBe('jo***@gmail.com');
    expect(maskEmail('david@gmail.com')).toBe('da***@gmail.com');
  });

  it('handles empty or invalid inputs', () => {
    expect(maskEmail('')).toBe('');
    expect(maskEmail(null)).toBe('');
    expect(maskEmail(undefined)).toBe('');
    expect(maskEmail('invalid-email')).toBe('invalid-email');
  });
});
