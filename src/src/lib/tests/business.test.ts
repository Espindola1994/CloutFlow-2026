import { test, expect, describe } from 'vitest';

describe('Username Normalization', () => {
  function normalizeUsername(input: string): string {
    if (!input) return '';
    let username = input.trim();
    
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    
    if (username.includes('instagram.com/')) {
      const urlParts = username.split('instagram.com/');
      if (urlParts.length > 1) {
        username = urlParts[1].split('/')[0].split('?')[0];
      }
    }
    
    return username;
  }

  test('normalizes @username to username', () => {
    expect(normalizeUsername('@testuser')).toBe('testuser');
  });

  test('normalizes full URL to username', () => {
    expect(normalizeUsername('https://instagram.com/testuser')).toBe('testuser');
    expect(normalizeUsername('https://www.instagram.com/testuser/')).toBe('testuser');
    expect(normalizeUsername('https://www.instagram.com/testuser/?hl=en')).toBe('testuser');
  });

  test('handles plain username', () => {
    expect(normalizeUsername('testuser')).toBe('testuser');
  });
});

describe('Price Calculation', () => {
  function calculateTotal(regularPrice: number, quantity: number, discountPercentage = 0): number {
    const total = regularPrice;
    if (discountPercentage > 0) {
      return Math.round(total * (1 - discountPercentage / 100));
    }
    return total;
  }

  test('calculates correct total without discount', () => {
    expect(calculateTotal(1000, 1)).toBe(1000);
  });

  test('calculates correct total with percentage discount', () => {
    expect(calculateTotal(1000, 1, 20)).toBe(800); // 20% off
    expect(calculateTotal(1500, 1, 10)).toBe(1350); // 10% off
  });
});
