import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, Wifi, RefreshCw, HardDrive } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner({ onOpenOfflineManager }) {
  const { status, effectiveType, rtt, checkNow } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (prevStatus === 'OFFLINE' && (status === 'ONLINE_HIGH_SPEED' || status === 'ONLINE_SLOW')) {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4500);
      return () => clearTimeout(timer);
    }
    setPrevStatus(status);
  }, [status, prevStatus]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    await checkNow();
    setTimeout(() => setIsChecking(false), 600);
  };

  // If fully online and restored toast has expired, don't show anything
  if (status === 'ONLINE_HIGH_SPEED' && !showRestored) {
    return null;
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      width: '100%',
      boxSizing: 'border-box',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '0.85rem',
      fontWeight: 500,
      fontFamily: "'Inter', sans-serif",
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      ...(status === 'OFFLINE' ? {
        background: 'linear-gradient(90deg, #7F1D1D 0%, #991B1B 100%)',
        borderBottom: '1px solid #DC2626',
        color: '#FEE2E2'
      } : status === 'ONLINE_SLOW' ? {
        background: 'linear-gradient(90deg, #78350F 0%, #92400E 100%)',
        borderBottom: '1px solid #D97706',
        color: '#FEF3C7'
      } : {
        background: 'linear-gradient(90deg, #064E3B 0%, #065F46 100%)',
        borderBottom: '1px solid #10B981',
        color: '#D1FAE5'
      })
    }}>
      {/* Status Description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {status === 'OFFLINE' ? (
          <WifiOff size={18} color="#FCA5A5" />
        ) : status === 'ONLINE_SLOW' ? (
          <AlertTriangle size={18} color="#FCD34D" />
        ) : (
          <Wifi size={18} color="#6EE7B7" />
        )}

        <span>
          {status === 'OFFLINE' ? (
            <strong>Offline Mode: Working from downloaded trail paths and cached materials.</strong>
          ) : status === 'ONLINE_SLOW' ? (
            <span>
              <strong>Weak Connection ({effectiveType.toUpperCase()}{rtt ? ` · ${rtt}ms latency` : ''}):</strong> AI Visualizer is paused to prevent timeouts. Downloaded course materials remain fully available.
            </span>
          ) : (
            <strong>Internet Restored: Connection re-established. Syncing offline changes...</strong>
          )}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onOpenOfflineManager && (
          <button
            type="button"
            onClick={onOpenOfflineManager}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <HardDrive size={13} />
            <span>Manage Offline</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleManualCheck}
          disabled={isChecking}
          title="Check connectivity now"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '4px 8px',
            color: 'inherit',
            cursor: isChecking ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.78rem'
          }}
        >
          <RefreshCw size={12} className={isChecking ? 'spin' : ''} style={{ animation: isChecking ? 'spin 1s linear infinite' : 'none' }} />
          <span>{isChecking ? 'Checking...' : 'Retry'}</span>
        </button>
      </div>
    </div>
  );
}
