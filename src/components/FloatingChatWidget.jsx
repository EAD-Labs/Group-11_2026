import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  Maximize2,
  Send,
  BarChart3,
  Bot,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { canAccessRoute } from '../utils/rbacGuard';

const SUGGESTIONS = [
  "Compare Maths & English in 2020",
  "Top 10 schools in 2019",
  "Class 3 oral skills",
  "Computer Science averages"
];

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { status, effectiveType } = useNetworkStatus();
  const isChatDisabled = status === 'OFFLINE' || status === 'ONLINE_SLOW';

  const handleOpenVisualizer = (customQuery) => {
    if (isChatDisabled) return;
    const q = (customQuery || query).trim();
    const targetUrl = q ? `/insights?q=${encodeURIComponent(q)}` : `/insights`;

    // Strict Pre-Navigation RBAC Check
    const access = canAccessRoute('/insights');
    if (!access.allowed) {
      alert(
        access.reason === 'AUTH_REQUIRED'
          ? 'Authentication Required: Please sign in as an Asha Teacher or Admin to access the AI Visualizer.'
          : `Access Restricted: Requires ${access.requiredRole} privileges.`
      );
      return;
    }

    window.location.href = targetUrl;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleOpenVisualizer();
    }
  };

  // If already on the /insights page, don't show the duplicate launcher
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/insights')) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
      {/* Floating Popup Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '72px',
          right: '0',
          width: '360px',
          maxWidth: 'calc(100vw - 32px)',
          background: '#1A2540',
          border: '1px solid rgba(94, 234, 212, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 20px rgba(94, 234, 212, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(94, 234, 212, 0.15), rgba(59, 130, 246, 0.15))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#5EEAD4',
                color: '#0F1729',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>
                  Asha AI Visualizer
                </h4>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Gemini & Open-Source AI Copilot
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Offline or Slow Network Warning Box */}
            {isChatDisabled ? (
              <div style={{
                background: status === 'OFFLINE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${status === 'OFFLINE' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                color: status === 'OFFLINE' ? '#FCA5A5' : '#FCD34D',
                fontSize: '0.78rem',
                lineHeight: 1.4
              }}>
                {status === 'OFFLINE' ? <WifiOff size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />}
                <div>
                  <strong>{status === 'OFFLINE' ? 'Offline Mode Active' : `Slow Connection (${effectiveType.toUpperCase()})`}</strong>
                  <div>
                    AI Visualizer requires a live, stable internet connection. All downloaded trail paths & course materials remain fully functional.
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                Ask questions about student assessments and watch the AI dynamically reorganize graphs and data on the full visual canvas.
              </p>
            )}

            {/* Input field */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0F1729',
              border: `1px solid ${isChatDisabled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '10px',
              padding: '6px 10px',
              gap: '6px',
              opacity: isChatDisabled ? 0.6 : 1
            }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isChatDisabled}
                placeholder={isChatDisabled ? "AI Visualizer unavailable offline" : "Ask about school scores, trends..."}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: isChatDisabled ? '#64748B' : '#F8FAFC',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: isChatDisabled ? 'not-allowed' : 'text'
                }}
              />
              <button
                type="button"
                onClick={() => handleOpenVisualizer()}
                disabled={isChatDisabled || !query.trim()}
                style={{
                  background: isChatDisabled || !query.trim() ? '#334155' : '#5EEAD4',
                  color: isChatDisabled || !query.trim() ? '#94A3B8' : '#0F1729',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: isChatDisabled || !query.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={13} />
              </button>
            </div>

            {/* Suggested quick chips */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>
                QUICK QUERIES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleOpenVisualizer(s)}
                    disabled={isChatDisabled}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '4px 10px',
                      color: isChatDisabled ? '#475569' : '#94A3B8',
                      fontSize: '0.75rem',
                      cursor: isChatDisabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      opacity: isChatDisabled ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isChatDisabled) {
                        e.target.style.background = 'rgba(94, 234, 212, 0.1)';
                        e.target.style.color = '#5EEAD4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isChatDisabled) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.target.style.color = '#94A3B8';
                      }
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleOpenVisualizer()}
              disabled={isChatDisabled}
              style={{
                background: isChatDisabled ? '#334155' : 'linear-gradient(135deg, #5EEAD4, #2DD4BF)',
                color: isChatDisabled ? '#94A3B8' : '#0F1729',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isChatDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isChatDisabled ? 'none' : '0 4px 14px rgba(94, 234, 212, 0.25)',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => { if (!isChatDisabled) e.target.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { if (!isChatDisabled) e.target.style.transform = 'scale(1)'; }}
            >
              <BarChart3 size={16} />
              <span>{isChatDisabled ? 'AI Paused (Offline / Slow)' : 'Launch Full Visualizer Canvas'}</span>
              {!isChatDisabled && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Launcher Bubble Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          background: isChatDisabled
            ? 'linear-gradient(135deg, #475569, #334155)'
            : 'linear-gradient(135deg, #5EEAD4, #0D9488)',
          color: isChatDisabled ? '#CBD5E1' : '#0F1729',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: isChatDisabled
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(13, 148, 136, 0.4), 0 0 16px rgba(94, 234, 212, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title={isChatDisabled ? "AI Visualizer is paused (offline/slow connection)" : "Open Asha AI Visualizer"}
      >
        {isOpen ? <X size={24} /> : isChatDisabled ? <WifiOff size={22} /> : <Sparkles size={24} />}
        {/* Offline indicator badge */}
        {isChatDisabled && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            borderRadius: '7px',
            background: status === 'OFFLINE' ? '#EF4444' : '#F59E0B',
            border: '2px solid #0F1729'
          }} />
        )}
      </button>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
