import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:4000`
).replace(/\/+$/, '');

/**
 * Custom hook for multi-tier network status detection.
 * Combines OS online events, Network Information API, and active HTTP health probes
 * to reliably differentiate high-speed, 2G/slow, and offline/faux-offline states.
 */
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState(() => {
    const isNavigatorOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const conn = typeof navigator !== 'undefined'
      ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
      : null;

    const effectiveType = conn?.effectiveType || 'unknown';
    const isSlow = effectiveType === 'slow-2g' || effectiveType === '2g' || (conn?.rtt && conn.rtt > 1500);

    return {
      isOnline: isNavigatorOnline,
      isLowSpeed: isSlow,
      effectiveType,
      rtt: conn?.rtt || 0,
      downlink: conn?.downlink || 0,
      status: !isNavigatorOnline ? 'OFFLINE' : (isSlow ? 'ONLINE_SLOW' : 'ONLINE_HIGH_SPEED'),
      lastChecked: Date.now()
    };
  });

  const checkInProgressRef = useRef(false);

  // Active HTTP health probe to verify genuine Internet connectivity
  const probeConnectivity = useCallback(async () => {
    if (checkInProgressRef.current) return;
    checkInProgressRef.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const conn = typeof navigator !== 'undefined'
      ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
      : null;

    const effectiveType = conn?.effectiveType || 'unknown';

    try {
      const probeStart = performance.now();
      const res = await fetch(`${API_BASE}/api/health?t=${Date.now()}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - probeStart);

      const isSlow = effectiveType === 'slow-2g' || effectiveType === '2g' || latency > 1500;

      if (res.ok) {
        setNetworkState({
          isOnline: true,
          isLowSpeed: isSlow,
          effectiveType,
          rtt: latency || conn?.rtt || 0,
          downlink: conn?.downlink || 0,
          status: isSlow ? 'ONLINE_SLOW' : 'ONLINE_HIGH_SPEED',
          lastChecked: Date.now()
        });
      } else {
        setNetworkState(prev => ({
          ...prev,
          isOnline: false,
          status: 'OFFLINE',
          lastChecked: Date.now()
        }));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      // If probe aborted or failed, we are effectively offline or unable to reach server
      setNetworkState(prev => ({
        ...prev,
        isOnline: false,
        status: 'OFFLINE',
        lastChecked: Date.now()
      }));
    } finally {
      checkInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      probeConnectivity();
    };

    const handleOffline = () => {
      setNetworkState({
        isOnline: false,
        isLowSpeed: false,
        effectiveType: 'none',
        rtt: 0,
        downlink: 0,
        status: 'OFFLINE',
        lastChecked: Date.now()
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API change listener
    const conn = typeof navigator !== 'undefined'
      ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
      : null;

    if (conn && conn.addEventListener) {
      conn.addEventListener('change', probeConnectivity);
    }

    // Initial probe on mount
    probeConnectivity();

    // Periodic ping probe every 25 seconds when page is visible
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        probeConnectivity();
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', probeConnectivity);
      }
      clearInterval(intervalId);
    };
  }, [probeConnectivity]);

  return {
    ...networkState,
    checkNow: probeConnectivity
  };
}
