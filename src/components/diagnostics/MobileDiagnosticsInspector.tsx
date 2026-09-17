'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './diagnostics.module.css';
import {
  getGlobalEnvironment,
  measureCurrentView,
} from './measurement-engine';

export function MobileDiagnosticsInspector() {
  const [isActive, setIsActive] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewType, setViewType] = useState<'home' | 'offerPrefill' | 'offerPackage'>('home');
  const [lastMeasured, setLastMeasured] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mobileDiagnostics') === '1') {
      setIsActive(true);
      // Detect view type automatically from pathname
      const path = window.location.pathname;
      if (path.startsWith('/offer/')) {
        // Check if package stage is mounted
        const isPackage = !!document.querySelector('.cf-o10-package-panel, .cf-offer-packages-stage');
        setViewType(isPackage ? 'offerPackage' : 'offerPrefill');
      } else {
        setViewType('home');
      }
    }
  }, []);

  const handleCapture = useCallback(() => {
    if (typeof window === 'undefined') return;
    const env = getGlobalEnvironment(deviceLabel);
    const measured = measureCurrentView(viewType);
    setLastMeasured({
      viewType,
      timestamp: new Date().toISOString(),
      environment: env,
      measured,
    });
  }, [deviceLabel, viewType]);

  const handleCopyReport = async () => {
    if (!lastMeasured) {
      handleCapture();
    }
    const env = getGlobalEnvironment(deviceLabel);
    const path = window.location.pathname;
    const isOffer = path.startsWith('/offer/');
    const isPackageMounted = !!document.querySelector('.cf-o10-package-panel, .cf-offer-packages-stage');

    const fullPayload: any = {
      deviceLabel: deviceLabel || 'NOT_SPECIFIED',
      environment: env?.environment,
      viewport: env?.viewport,
      documentProperties: env?.documentProperties,
      fonts: env?.fonts,
      breakpoints: env?.breakpoints,
      safeArea: env?.safeArea,
      currentUrl: window.location.href,
      currentView: viewType,
    };

    if (isOffer) {
      if (isPackageMounted) {
        fullPayload.offerPackage = measureCurrentView('offerPackage');
      } else {
        fullPayload.offerPrefill = measureCurrentView('offerPrefill');
      }
    } else {
      fullPayload.home = measureCurrentView('home');
    }

    const jsonStr = JSON.stringify(fullPayload, null, 2);
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
    } catch (e) {
      alert('Failed to copy: ' + e);
    }
  };

  if (!isActive) {
    return null;
  }

  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 999999,
          background: '#2563eb',
          color: '#ffffff',
          padding: '10px 14px',
          borderRadius: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          fontSize: '13px',
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        🔍 Diagnostics (?mobileDiagnostics=1)
      </div>
    );
  }

  return (
    <div className={styles.floatingWidget}>
      <div className={styles.floatingHeader}>
        <span>🔍 Live DOM Diagnostics</span>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '16px',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Device Label (e.g. POCO X7 PRO - CHROME)"
          value={deviceLabel}
          onChange={(e) => setDeviceLabel(e.target.value)}
          className={styles.input}
          style={{ fontSize: '11px', padding: '6px 8px' }}
        />
      </div>

      <div style={{ marginBottom: 8, display: 'flex', gap: 4 }}>
        <button
          type="button"
          onClick={() => setViewType('home')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '10px',
            background: viewType === 'home' ? '#2563eb' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => setViewType('offerPrefill')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '10px',
            background: viewType === 'offerPrefill' ? '#2563eb' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Prefill
        </button>
        <button
          type="button"
          onClick={() => setViewType('offerPackage')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '10px',
            background: viewType === 'offerPackage' ? '#2563eb' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Package
        </button>
      </div>

      <div className={styles.floatingActions}>
        <button
          type="button"
          onClick={handleCapture}
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{ padding: '6px 12px', fontSize: '11px', minHeight: 32 }}
        >
          📊 Measure Visible Elements
        </button>

        <button
          type="button"
          onClick={handleCopyReport}
          className={`${styles.button} ${copied ? styles.buttonSuccess : ''}`}
          style={{ padding: '8px 12px', fontSize: '12px', minHeight: 36 }}
        >
          {copied ? '✓ REPORT COPIED' : '📋 COPY FULL REPORT'}
        </button>
      </div>

      {lastMeasured && (
        <div
          style={{
            marginTop: 8,
            maxHeight: '120px',
            overflowY: 'auto',
            background: '#090d16',
            padding: 6,
            borderRadius: 4,
            fontSize: '10px',
            fontFamily: 'monospace',
          }}
        >
          <div>Captured: {lastMeasured.timestamp.split('T')[1].split('.')[0]}</div>
          <div>View: {lastMeasured.viewType}</div>
          {lastMeasured.measured.customProps && (
            <div>
              CustomProps: {JSON.stringify(lastMeasured.measured.customProps)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
