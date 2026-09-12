/**
 * Server-Side Device / OS / Browser Telemetry Helper
 * 
 * Non-invasive User-Agent parser that extracts coarse device category,
 * operating system, and browser family without fingerprinting.
 * 
 * STRICT RULES:
 * 1. Zero fingerprinting (no hardware hashing, no IP tracking).
 * 2. High level classifications only (mobile / tablet / desktop, iOS / Android / macOS / Windows / Linux, Chrome / Safari / Edge / Firefox / Other).
 * 3. Never throws; returns safe fallbacks if User-Agent is missing or unparseable.
 */

export interface DeviceTelemetry {
  deviceType: string | null;
  os: string | null;
  browser: string | null;
}

export function extractDeviceTelemetry(headers: Headers): DeviceTelemetry {
  try {
    const userAgent = headers.get('user-agent') || '';
    if (!userAgent) {
      return {
        deviceType: null,
        os: null,
        browser: null,
      };
    }

    // 1. Device Category
    let deviceType: string = 'desktop';
    if (/iPad|Tablet|(android(?!.*mobile))/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    // 2. Operating System
    let os: string = 'Other';
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      os = 'iOS';
    } else if (/Android/i.test(userAgent)) {
      os = 'Android';
    } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
      os = 'macOS';
    } else if (/Windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/Linux/i.test(userAgent)) {
      os = 'Linux';
    } else if (/CrOS/i.test(userAgent)) {
      os = 'Chrome OS';
    }

    // 3. Browser Family
    let browser: string = 'Other';
    if (/Edg\//i.test(userAgent)) {
      browser = 'Edge';
    } else if (/Firefox\//i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/Chrome\//i.test(userAgent) && !/Chromium|Edg/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edg/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/iPhone|iPad|iPod/i.test(userAgent) && /AppleWebKit/i.test(userAgent)) {
      // iOS WebKit default browser is Mobile Safari
      browser = 'Safari';
    } else if (/MSIE|Trident/i.test(userAgent)) {
      browser = 'Internet Explorer';
    }



    return {
      deviceType,
      os,
      browser,
    };
  } catch {
    return {
      deviceType: null,
      os: null,
      browser: null,
    };
  }
}
