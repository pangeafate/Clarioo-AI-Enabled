/**
 * Device Metadata Collection Utility
 *
 * Collects browser, OS, device type, screen resolution, and timezone
 * information for analytics and user tracking.
 *
 * @module utils/deviceMetadata
 */

export interface DeviceMetadata {
  browser: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenResolution: string;
  timezone: string;
}

/**
 * Detect browser name and version
 */
const detectBrowser = (): string => {
  const ua = navigator.userAgent;

  if (ua.includes('Firefox/')) {
    const version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
    return `Firefox ${version}`;
  }

  if (ua.includes('Edg/')) {
    const version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
    return `Edge ${version}`;
  }

  if (ua.includes('Chrome/')) {
    const version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
    return `Chrome ${version}`;
  }

  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
    return `Safari ${version}`;
  }

  if (ua.includes('Opera/') || ua.includes('OPR/')) {
    const version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || '';
    return `Opera ${version}`;
  }

  return 'Unknown';
};

/**
 * Detect operating system
 */
const detectOS = (): string => {
  const ua = navigator.userAgent;

  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';

  return 'Unknown';
};

/**
 * Detect device type based on screen width and user agent
 */
const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  const ua = navigator.userAgent;

  // Check user agent first for mobile/tablet indicators
  if (/Mobi|Android/i.test(ua)) {
    return width < 768 ? 'mobile' : 'tablet';
  }

  // Fallback to screen width
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

/**
 * Get screen resolution as "widthxheight"
 */
const getScreenResolution = (): string => {
  const width = window.screen.width;
  const height = window.screen.height;
  return `${width}x${height}`;
};

/**
 * Get user's timezone
 */
const getTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
};

/**
 * Collect all device metadata
 *
 * @returns DeviceMetadata object with browser, OS, device type, screen resolution, and timezone
 *
 * @example
 * ```typescript
 * const metadata = collectDeviceMetadata();
 * console.log(metadata);
 * // {
 * //   browser: "Chrome 120.0",
 * //   os: "macOS",
 * //   deviceType: "desktop",
 * //   screenResolution: "1920x1080",
 * //   timezone: "America/New_York"
 * // }
 * ```
 */
export const collectDeviceMetadata = (): DeviceMetadata => {
  return {
    browser: detectBrowser(),
    os: detectOS(),
    deviceType: detectDeviceType(),
    screenResolution: getScreenResolution(),
    timezone: getTimezone(),
  };
};
