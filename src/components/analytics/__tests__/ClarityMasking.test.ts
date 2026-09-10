import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('C1 Sensitive Input Masking Audit', () => {
  it('GrowthPackageBuilder masks identifier input and email input with data-clarity-mask and clarity-mask class', () => {
    const filePath = path.resolve(__dirname, '../../growth-package-builder.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Verify identifier input has masking
    expect(content).toContain('data-clarity-mask="true"');
    expect(content).toContain('className="clarity-mask"');

    // Check occurrences - at least 2 in growth-package-builder (identifier & email)
    const occurrences = (content.match(/data-clarity-mask="true"/g) || []).length;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it('Offer Experience search and email inputs have masking applied', () => {
    const lookupPath = path.resolve(__dirname, '../../offer-experience/OfferLookupStage.tsx');
    const lookupContent = fs.readFileSync(lookupPath, 'utf-8');
    expect(lookupContent).toContain('data-clarity-mask="true"');

    const o10Path = path.resolve(__dirname, '../../offer-experience/OfferOption10Experience.tsx');
    const o10Content = fs.readFileSync(o10Path, 'utf-8');
    expect(o10Content).toContain('data-clarity-mask="true"');

    const hubPath = path.resolve(__dirname, '../../offer-experience/OfferProfileHubStage.tsx');
    const hubContent = fs.readFileSync(hubPath, 'utf-8');
    expect(hubContent).toContain('data-clarity-mask="true"');
  });
});
