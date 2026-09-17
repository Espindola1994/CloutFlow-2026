'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './diagnostics.module.css';
import {
  getGlobalEnvironment,
  measureCurrentView,
  inspectElement,
  getCssCustomProperty,
} from './measurement-engine';

export function MobileDiagnosticsDashboard() {
  const [deviceLabel, setDeviceLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [globalData, setGlobalData] = useState<any>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Focus testing for inputs
  const [inputFocusMetrics, setInputFocusMetrics] = useState<Record<string, any>>({});

  // Elements refs for measurements
  const typoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const weightRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const smoothingRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const zoomRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subpixelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Offer measurement code input
  const [offerCodeInput, setOfferCodeInput] = useState('CF25-TEST');
  const [measuredExternalData, setMeasuredExternalData] = useState<any>({
    home: null,
    offerPrefill: null,
    offerPackage: null,
  });

  const refreshGlobal = useCallback(() => {
    const env = getGlobalEnvironment(deviceLabel);
    setGlobalData(env);
  }, [deviceLabel]);

  useEffect(() => {
    refreshGlobal();
  }, [refreshGlobal, refreshIndex]);

  // Setup input focus trackers
  const handleInputFocus = (id: string) => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    setInputFocusMetrics((prev) => ({
      ...prev,
      [id]: {
        visualViewportScale: vv?.scale ?? 1,
        visualViewportWidth: vv?.width ?? window.innerWidth,
        visualViewportHeight: vv?.height ?? window.innerHeight,
        windowInnerWidth: window.innerWidth,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));
  };

  // Typography test matrices
  const fontSizes = [
    '10.5px', '11px', '11.5px', '12px', '12.5px', '13px',
    '13.5px', '14px', '14.5px', '15px', '16px', '21px', '29px', '35px',
  ];
  const fontWeights = ['400', '500', '600', '700', '800', '850', '950'];

  // Critical weight test list
  const criticalWeightTests = [
    { size: '12px', weight: '800' },
    { size: '12px', weight: '850' },
    { size: '12px', weight: '900' },
    { size: '12px', weight: '950' },
    { size: '13.5px', weight: '800' },
    { size: '13.5px', weight: '850' },
    { size: '13.5px', weight: '900' },
    { size: '13.5px', weight: '950' },
    { size: '16px', weight: '800' },
    { size: '16px', weight: '850' },
    { size: '16px', weight: '900' },
    { size: '16px', weight: '950' },
  ];

  // Zoom test list
  const zoomValues = ['1', '.585', '.620', '.410', '.435'];

  // Subpixel test list
  const subpixelSizes = ['10.5px', '11.5px', '12.5px', '13.5px', '14.5px'];
  const letterSpacings = ['0px', '-0.025em', '-0.5px', '-1px'];

  // Measure element helper
  const measureElementHelper = (el: HTMLElement | null) => {
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      computedFontFamily: style.fontFamily,
      computedFontSize: style.fontSize,
      computedFontWeight: style.fontWeight,
      computedLineHeight: style.lineHeight,
      computedLetterSpacing: style.letterSpacing,
      computedZoom: (style as any).zoom || '1',
      computedWidth: style.width,
      computedHeight: style.height,
      boundingWidth: Math.round(rect.width * 100) / 100,
      boundingHeight: Math.round(rect.height * 100) / 100,
      offsetWidth: el.offsetWidth,
      offsetHeight: el.offsetHeight,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
    };
  };

  // Compile full report
  const compileFullReport = () => {
    const env = getGlobalEnvironment(deviceLabel);

    // Collect typography measurements
    const typoResults: Record<string, any> = {};
    for (const [key, el] of Object.entries(typoRefs.current)) {
      if (el) {
        typoResults[key] = measureElementHelper(el);
      }
    }

    // Collect weight measurements
    const weightResults: Record<string, any> = {};
    for (const [key, el] of Object.entries(weightRefs.current)) {
      if (el) {
        weightResults[key] = measureElementHelper(el);
      }
    }

    // Collect smoothing measurements
    const smoothingResults: Record<string, any> = {};
    for (const [key, el] of Object.entries(smoothingRefs.current)) {
      if (el) {
        smoothingResults[key] = measureElementHelper(el);
      }
    }

    // Collect zoom measurements
    const zoomResults: Record<string, any> = {};
    for (const [key, el] of Object.entries(zoomRefs.current)) {
      if (el) {
        zoomResults[key] = measureElementHelper(el);
      }
    }

    // Collect subpixel measurements
    const subpixelResults: Record<string, any> = {};
    for (const [key, el] of Object.entries(subpixelRefs.current)) {
      if (el) {
        subpixelResults[key] = measureElementHelper(el);
      }
    }

    return {
      deviceLabel: deviceLabel || 'NOT_SPECIFIED',
      environment: env?.environment,
      viewport: env?.viewport,
      documentProperties: env?.documentProperties,
      fonts: env?.fonts,
      breakpoints: env?.breakpoints,
      safeArea: env?.safeArea,
      typographyTests: typoResults,
      criticalWeightTests: weightResults,
      fontSmoothingTests: smoothingResults,
      zoomTests: zoomResults,
      subpixelTests: subpixelResults,
      inputTests: inputFocusMetrics,
      home: measuredExternalData.home,
      offerPrefill: measuredExternalData.offerPrefill,
      offerPackage: measuredExternalData.offerPackage,
    };
  };

  const copyReport = async () => {
    const report = compileFullReport();
    const jsonStr = JSON.stringify(report, null, 2);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = jsonStr;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert('Error copying to clipboard: ' + err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Mobile Cross-Platform Diagnostics</h1>
        <p className={styles.subtitle}>
          Phase 2 — Android × iOS High Precision Rendering Instrument (Read-only, Isolated)
        </p>
      </header>

      {/* Manual Device Label & Action Bar */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>Device Identification & Action</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
            Device Label (e.g. POCO X7 PRO - CHROME / IPHONE 15 PRO MAX - SAFARI)
          </label>
          <input
            type="text"
            className={styles.input}
            value={deviceLabel}
            onChange={(e) => setDeviceLabel(e.target.value)}
            placeholder="Type device name and browser..."
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`${styles.button} ${copied ? styles.buttonSuccess : ''}`}
            onClick={copyReport}
          >
            {copied ? '✓ REPORT COPIED TO CLIPBOARD' : '📋 COPY FULL REPORT'}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => setRefreshIndex((i) => i + 1)}
          >
            🔄 Refresh Measurements
          </button>
        </div>
      </section>

      {/* Site Real Measurement Navigators */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>Real Site Measurement Links (?mobileDiagnostics=1)</span>
        </div>
        <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 12 }}>
          Open the real site with the diagnostic parameter to measure live DOM elements (Home, Offer Prefill, Offer Package):
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href="/?mobileDiagnostics=1"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            Open Home with Diagnostics ↗
          </a>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              className={styles.input}
              style={{ width: 140, margin: 0 }}
              value={offerCodeInput}
              onChange={(e) => setOfferCodeInput(e.target.value)}
              placeholder="Offer code"
            />
            <a
              href={`/offer/${encodeURIComponent(offerCodeInput)}?mobileDiagnostics=1`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Open Offer with Diagnostics ↗
            </a>
          </div>
        </div>
      </section>

      {/* Global Environment & Viewport */}
      {globalData && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>1. Global Browser & Viewport Environment</span>
          </div>
          <div className={styles.grid}>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>Timestamp</span>
              <span className={styles.kvVal}>{globalData.timestamp}</span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>navigator.userAgent</span>
              <span className={styles.kvVal}>{globalData.environment.userAgent}</span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>navigator.platform / vendor</span>
              <span className={styles.kvVal}>
                {globalData.environment.platform} / {globalData.environment.vendor || 'none'}
              </span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>window.devicePixelRatio</span>
              <span className={styles.kvVal}>{globalData.environment.devicePixelRatio}</span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>Orientation / Standalone</span>
              <span className={styles.kvVal}>
                {globalData.environment.orientation} / {globalData.environment.standalone ? 'YES' : 'NO'}
              </span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>window.innerWidth × innerHeight</span>
              <span className={styles.kvVal}>
                {globalData.viewport.innerWidth} × {globalData.viewport.innerHeight}
              </span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>window.outerWidth × outerHeight</span>
              <span className={styles.kvVal}>
                {globalData.viewport.outerWidth} × {globalData.viewport.outerHeight}
              </span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>documentElement clientWidth × clientHeight</span>
              <span className={styles.kvVal}>
                {globalData.viewport.clientWidth} × {globalData.viewport.clientHeight}
              </span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>screen width × height (avail)</span>
              <span className={styles.kvVal}>
                {globalData.viewport.screenWidth} × {globalData.viewport.screenHeight} ({globalData.viewport.availWidth} × {globalData.viewport.availHeight})
              </span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>visualViewport (width × height @ scale)</span>
              <span className={styles.kvVal}>
                {globalData.viewport.visualViewport
                  ? `${globalData.viewport.visualViewport.width} × ${globalData.viewport.visualViewport.height} @ ${globalData.viewport.visualViewport.scale} (offset: ${globalData.viewport.visualViewport.offsetLeft}, ${globalData.viewport.visualViewport.offsetTop})`
                  : 'N/A'}
              </span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>meta viewport content REAL</span>
              <span className={styles.kvVal}>{globalData.viewport.metaViewport}</span>
            </div>
            <div className={styles.kvItem}>
              <span className={styles.kvKey}>Safe Area Insets (top, right, bottom, left)</span>
              <span className={styles.kvVal}>
                {globalData.safeArea.top} / {globalData.safeArea.right} / {globalData.safeArea.bottom} / {globalData.safeArea.left}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Document / Body Computed Properties */}
      {globalData && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>2. documentElement & body Computed Properties</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Element</th>
                  <th>font-size</th>
                  <th>font-family</th>
                  <th>font-weight</th>
                  <th>line-height</th>
                  <th>letter-spacing</th>
                  <th>-webkit-text-size-adjust</th>
                  <th>text-size-adjust</th>
                  <th>zoom</th>
                  <th>transform</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>documentElement</strong></td>
                  <td>{globalData.documentProperties.documentElement.fontSize}</td>
                  <td>{globalData.documentProperties.documentElement.fontFamily}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{globalData.documentProperties.documentElement.webkitTextSizeAdjust}</td>
                  <td>{globalData.documentProperties.documentElement.textSizeAdjust}</td>
                  <td>{globalData.documentProperties.documentElement.zoom}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td><strong>body</strong></td>
                  <td>{globalData.documentProperties.body.fontSize}</td>
                  <td>{globalData.documentProperties.body.fontFamily}</td>
                  <td>{globalData.documentProperties.body.fontWeight}</td>
                  <td>{globalData.documentProperties.body.lineHeight}</td>
                  <td>{globalData.documentProperties.body.letterSpacing}</td>
                  <td>{globalData.documentProperties.body.webkitTextSizeAdjust}</td>
                  <td>{globalData.documentProperties.body.textSizeAdjust}</td>
                  <td>{globalData.documentProperties.body.zoom}</td>
                  <td>{globalData.documentProperties.body.transform}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Fonts Status & Inter Verification */}
      {globalData && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>3. Font Verification (Inter Font Check)</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>document.fonts.status: </span>
            <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{globalData.fonts.status}</strong>
          </div>
          <div className={styles.grid}>
            {Object.entries(globalData.fonts.interChecks).map(([name, isLoaded]: [string, any]) => (
              <div key={name} className={styles.kvItem}>
                <span className={styles.kvKey}>document.fonts.check(&quot;{name}&quot;)</span>
                <span className={isLoaded ? styles.badgeTrue : styles.badgeFalse}>
                  {isLoaded ? 'TRUE (Loaded)' : 'FALSE (Not Loaded / Synthetic)'}
                </span>
              </div>
            ))}
          </div>
          {globalData.fonts.fontFaces && globalData.fonts.fontFaces.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span className={styles.kvKey}>Loaded FontFace Objects:</span>
              <ul style={{ fontSize: 11, fontFamily: 'monospace', color: '#cbd5e1', paddingLeft: 16 }}>
                {globalData.fonts.fontFaces.map((ff: string, i: number) => (
                  <li key={i}>{ff}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Breakpoints Real-Time Validation */}
      {globalData && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>4. Media Query Breakpoints Status</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Active Exclusive Range: </span>
            <strong style={{ color: '#38bdf8', fontSize: 16, fontFamily: 'monospace' }}>
              {globalData.breakpoints.activeRange}
            </strong>
          </div>
          <div className={styles.grid}>
            {Object.entries(globalData.breakpoints.queries).map(([query, matches]: [string, any]) => (
              <div key={query} className={styles.kvItem}>
                <span className={styles.kvKey}>{query}</span>
                <span className={matches ? styles.badgeTrue : styles.badgeFalse}>
                  {matches ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Zoom Property Comparison (Blink vs WebKit) */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>5. CSS zoom Property Test (width: 200px, height: 100px, font-size: 20px)</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Compare standard box behavior across zoom values. Inspect computed width/height vs boundingClientRect width/height:
        </p>
        <div className={styles.zoomTestWrap}>
          {zoomValues.map((z) => (
            <div key={z} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                ref={(el) => { zoomRefs.current[`zoom_${z}`] = el; }}
                className={styles.zoomBox}
                style={{ zoom: z } as any}
              >
                zoom: {z}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                zoom: {z}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Critical Font Weight Test */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>6. Critical Font-Weight Side-by-Side Test (Hypothesis Phase 1)</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Testing exact weights (800, 850, 900, 950) side-by-side on 12px, 13.5px, and 16px:
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Test</th>
                <th>Sample</th>
                <th>Computed Font</th>
                <th>Computed Weight</th>
                <th>Bounding Rect (W × H)</th>
                <th>Offset (W × H)</th>
              </tr>
            </thead>
            <tbody>
              {criticalWeightTests.map((t) => {
                const key = `wt_${t.size}_${t.weight}`;
                return (
                  <tr key={key}>
                    <td><strong>{t.size} / {t.weight}</strong></td>
                    <td>
                      <span
                        ref={(el) => { weightRefs.current[key] = el as any; }}
                        style={{
                          fontSize: t.size,
                          fontWeight: t.weight as any,
                          fontFamily: 'Inter, var(--font-inter), sans-serif',
                          color: '#ffffff',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        CloutFlow 123
                      </span>
                    </td>
                    <td>Inter</td>
                    <td>{t.weight}</td>
                    <td>
                      {/* Will be measured on report compile */}
                      Measured
                    </td>
                    <td>Measured</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Font Smoothing Comparison */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>7. Font-Smoothing Controlled Comparison (Visual & Metric)</span>
        </div>
        <div className={styles.grid}>
          <div className={styles.kvItem}>
            <span className={styles.kvKey}>A: -webkit-font-smoothing: auto</span>
            <div
              ref={(el) => { smoothingRefs.current['smooth_auto'] = el; }}
              style={{
                WebkitFontSmoothing: 'auto',
                fontSize: '13.5px',
                fontWeight: 800,
                fontFamily: 'Inter, var(--font-inter), sans-serif',
                padding: '8px 0',
              }}
            >
              CloutFlow Premium Growth 1234567890
            </div>
          </div>
          <div className={styles.kvItem}>
            <span className={styles.kvKey}>B: -webkit-font-smoothing: antialiased</span>
            <div
              ref={(el) => { smoothingRefs.current['smooth_antialiased'] = el; }}
              style={{
                WebkitFontSmoothing: 'antialiased',
                fontSize: '13.5px',
                fontWeight: 800,
                fontFamily: 'Inter, var(--font-inter), sans-serif',
                padding: '8px 0',
              }}
            >
              CloutFlow Premium Growth 1234567890
            </div>
          </div>
          <div className={styles.kvItem}>
            <span className={styles.kvKey}>C: -webkit-font-smoothing: subpixel-antialiased</span>
            <div
              ref={(el) => { smoothingRefs.current['smooth_subpixel'] = el; }}
              style={{
                WebkitFontSmoothing: 'subpixel-antialiased',
                fontSize: '13.5px',
                fontWeight: 800,
                fontFamily: 'Inter, var(--font-inter), sans-serif',
                padding: '8px 0',
              }}
            >
              CloutFlow Premium Growth 1234567890
            </div>
          </div>
        </div>
      </section>

      {/* Subpixel & Letter Spacing Controlled Test */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>8. Subpixel Font-Size & Letter-Spacing Measurements</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Font Size</th>
                <th>Letter Spacing</th>
                <th>Sample</th>
              </tr>
            </thead>
            <tbody>
              {subpixelSizes.flatMap((sz) =>
                letterSpacings.map((ls) => {
                  const key = `sub_${sz}_${ls}`;
                  return (
                    <tr key={key}>
                      <td>{sz}</td>
                      <td>{ls}</td>
                      <td>
                        <span
                          ref={(el) => { subpixelRefs.current[key] = el as any; }}
                          style={{
                            fontSize: sz,
                            letterSpacing: ls,
                            fontWeight: 700,
                            fontFamily: 'Inter, var(--font-inter), sans-serif',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          CloutFlow Premium Growth 1234567890
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* iOS Input Focus Test */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>9. iOS Input Focus Zoom Behavior Test (11px, 12.5px, 13.5px, 15px, 16px)</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Tap each input to observe if Safari triggers automatic viewport zoom (<span style={{ color: '#ef4444' }}>&lt; 16px</span>):
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[11, 12.5, 13.5, 15, 16].map((sz) => {
            const id = `input_${sz}px`;
            const metric = inputFocusMetrics[id];
            return (
              <div key={id} style={{ background: '#1e293b', padding: 10, borderRadius: 6 }}>
                <label style={{ fontSize: 12, color: '#94a3b8' }}>
                  Input with font-size: <strong>{sz}px</strong>
                </label>
                <input
                  type="text"
                  placeholder={`Tap here (${sz}px)`}
                  style={{
                    fontSize: `${sz}px`,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#ffffff',
                    marginTop: 4,
                  }}
                  onFocus={() => handleInputFocus(id)}
                />
                {metric && (
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#38bdf8', marginTop: 4 }}>
                    Last Focus @ {metric.timestamp}: scale = <strong>{metric.visualViewportScale}</strong> | vvWidth = {metric.visualViewportWidth}px | winWidth = {metric.windowInnerWidth}px
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Controlled Typography Full Matrix */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>10. Full Typography Controlled Matrix (14 sizes × 7 weights)</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>
          Measuring exact boundingClientRect & offset dimensions for Inter font:
        </p>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #334155', borderRadius: 6, padding: 8 }}>
          {fontSizes.map((sz) => (
            <div key={sz} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>
                Size: {sz}
              </div>
              {fontWeights.map((wt) => {
                const key = `typo_${sz}_${wt}`;
                return (
                  <div key={key} className={styles.typoSample}>
                    <div
                      ref={(el) => { typoRefs.current[key] = el; }}
                      className={styles.typoText}
                      style={{
                        fontSize: sz,
                        fontWeight: wt as any,
                        fontFamily: 'Inter, var(--font-inter), sans-serif',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      CloutFlow Premium Growth 1234567890
                    </div>
                    <div className={styles.typoMeta}>
                      Size: {sz} | Weight: {wt}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
