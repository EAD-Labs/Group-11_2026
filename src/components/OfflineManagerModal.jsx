import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X,
  ShieldCheck,
  Layers,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  saveClassTrail,
  getClassTrail,
  removeClassTrail,
  getDownloadedClassesManifest,
  getStorageEstimate,
  requestPersistentStorage
} from '../services/offlineStorage';

export default function OfflineManagerModal({ isOpen, onClose, classesData, onManifestChange }) {
  const [manifest, setManifest] = useState([]);
  const [storageStats, setStorageStats] = useState({
    usageMB: 0,
    quotaMB: 0,
    percentUsed: 0,
    isPersisted: false
  });
  const [downloadingClass, setDownloadingClass] = useState(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const classList = classesData && Object.keys(classesData).length > 0
    ? Object.keys(classesData).sort((a, b) => Number(a) - Number(b))
    : ['1', '2', '3', '4', '5', '6', '7', '8'];

  const refreshData = async () => {
    try {
      const [m, s] = await Promise.all([
        getDownloadedClassesManifest(),
        getStorageEstimate()
      ]);
      setManifest(m || []);
      setStorageStats(s);
      if (onManifestChange) {
        onManifestChange(m || []);
      }
    } catch (err) {
      console.error('Failed to load offline data:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isClassCached = (c) => {
    return manifest.some((item) => String(item.classId) === String(c));
  };

  const getClassManifestItem = (c) => {
    return manifest.find((item) => String(item.classId) === String(c));
  };

  const handleDownloadClass = async (c) => {
    if (!classesData || !classesData[c]) {
      setStatusMessage(`Error: No curriculum data found for Class ${c}`);
      return;
    }
    setDownloadingClass(c);
    setStatusMessage(`Downloading Class ${c} trail and resources to IndexedDB...`);
    try {
      // Simulate slight realistic buffering for UX feedback
      await new Promise((r) => setTimeout(r, 400));
      await saveClassTrail(c, classesData[c]);
      setStatusMessage(`✓ Class ${c} successfully cached for offline use!`);
      await refreshData();
    } catch (err) {
      setStatusMessage(`Failed to download Class ${c}: ${err.message}`);
    } finally {
      setDownloadingClass(null);
    }
  };

  const handleRemoveClass = async (c) => {
    try {
      await removeClassTrail(c);
      setStatusMessage(`Removed Class ${c} from offline cache.`);
      await refreshData();
    } catch (err) {
      setStatusMessage(`Failed to remove Class ${c}: ${err.message}`);
    }
  };

  const handleDownloadAll = async () => {
    if (!classesData) return;
    setIsDownloadingAll(true);
    setStatusMessage('Downloading all classes (1 to 5) into IndexedDB...');
    try {
      for (const c of classList) {
        if (classesData[c]) {
          setDownloadingClass(c);
          await saveClassTrail(c, classesData[c]);
        }
      }
      setStatusMessage('✓ All Classes (1-5) successfully downloaded for offline access!');
      await refreshData();
    } catch (err) {
      setStatusMessage(`Error during batch download: ${err.message}`);
    } finally {
      setIsDownloadingAll(false);
      setDownloadingClass(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to remove all offline cached classes?')) return;
    try {
      for (const item of manifest) {
        await removeClassTrail(item.classId);
      }
      setStatusMessage('All offline cached classes cleared.');
      await refreshData();
    } catch (err) {
      setStatusMessage(`Error clearing offline storage: ${err.message}`);
    }
  };

  const handleRequestPersistence = async () => {
    const granted = await requestPersistentStorage();
    if (granted) {
      setStatusMessage('✓ Persistent storage permission granted by browser!');
    } else {
      setStatusMessage('Persistent storage was not granted (browser may handle automatically).');
    }
    await refreshData();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(7, 11, 20, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: '#131D33',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(94, 234, 212, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#F8FAFC'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(94, 234, 212, 0.08), rgba(59, 130, 246, 0.08))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #5EEAD4, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F1729'
              }}
            >
              <HardDrive size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Offline & Download Manager
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Cache trail paths and materials for teaching without internet
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxSizing: 'border-box'
          }}
        >
          {/* Storage & Persistence Status Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={15} color="#5EEAD4" />
                Browser IndexedDB Storage
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                {storageStats.usageMB} MB used of {storageStats.quotaMB > 0 ? `${storageStats.quotaMB} MB` : 'Available Quota'}
              </span>
            </div>

            {/* Storage bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${Math.max(2, Math.min(100, storageStats.percentUsed))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #5EEAD4, #3B82F6)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: storageStats.isPersisted ? '#6EE7B7' : '#FCD34D' }}>
                <ShieldCheck size={14} />
                <span>
                  {storageStats.isPersisted
                    ? 'Persistent Storage: Protected from automatic browser cleanup'
                    : 'Storage Policy: Standard (browser may evict under extreme disk pressure)'}
                </span>
              </div>
              {!storageStats.isPersisted && (
                <button
                  type="button"
                  onClick={handleRequestPersistence}
                  style={{
                    background: 'rgba(94, 234, 212, 0.1)',
                    border: '1px solid rgba(94, 234, 212, 0.25)',
                    color: '#5EEAD4',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Enable Permanent Storage
                </button>
              )}
            </div>
          </div>

          {/* Status feedback message */}
          {statusMessage && (
            <div
              style={{
                background: statusMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                border: `1px solid ${statusMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                color: statusMessage.startsWith('✓') ? '#6EE7B7' : '#93C5FD',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {statusMessage.startsWith('✓') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Bulk Download & Clear Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F1F5F9' }}>
              Class Curriculum Trails (1 – 5)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={isDownloadingAll}
                style={{
                  background: 'linear-gradient(135deg, #5EEAD4, #2DD4BF)',
                  color: '#0F1729',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: isDownloadingAll ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isDownloadingAll ? 0.7 : 1
                }}
              >
                {isDownloadingAll ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Download All Classes</span>
              </button>

              {manifest.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#F87171',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Class List Table */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {classList.map((c) => {
              const cached = isClassCached(c);
              const item = getClassManifestItem(c);
              const isCurrentlyDownloading = downloadingClass === c;

              return (
                <div
                  key={c}
                  style={{
                    background: cached ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${cached ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: cached ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${cached ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: cached ? '#6EE7B7' : '#94A3B8'
                      }}
                    >
                      C{c}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#F8FAFC' }}>
                          Class {c} — Primary Maths
                        </span>
                        {cached ? (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6EE7B7',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Cached Offline
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(148, 163, 184, 0.1)',
                              color: '#94A3B8',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}
                          >
                            Not Cached
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '3px' }}>
                        {cached && item ? (
                          <span>
                            {item.itemCount || 'All'} learning stops stored · Downloaded on{' '}
                            {new Date(item.downloadedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span>Complete Terms I, II & III curriculum trails</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cached ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(c)}
                        title="Remove from offline cache"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#F87171',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownloadClass(c)}
                        disabled={isCurrentlyDownloading || isDownloadingAll}
                        style={{
                          background: 'rgba(94, 234, 212, 0.12)',
                          border: '1px solid rgba(94, 234, 212, 0.3)',
                          color: '#5EEAD4',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: (isCurrentlyDownloading || isDownloadingAll) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isCurrentlyDownloading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Note */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.78rem',
              color: '#94A3B8',
              lineHeight: 1.5
            }}
          >
            <strong style={{ color: '#93C5FD' }}>Rural Connectivity Guide:</strong> When offline in a school without cellular or broadband connectivity, downloaded curriculum trees, worksheets, and books remain fully accessible. Student completion marks are automatically queued locally and synced once connectivity is restored.
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: 'rgba(255, 255, 255, 0.01)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
