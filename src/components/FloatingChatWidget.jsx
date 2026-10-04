import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  Maximize2,
  Send,
  BarChart3,
  Bot
} from 'lucide-react';

const SUGGESTIONS = [
  "Compare Maths & English in 2020",
  "Top 10 schools in 2019",
  "Class 3 oral skills",
  "Computer Science averages"
];

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleOpenVisualizer = (customQuery) => {
    const q = (customQuery || query).trim();
    if (q) {
      window.location.href = `/insights?q=${encodeURIComponent(q)}`;
    } else {
      window.location.href = `/insights`;
    }
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
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.4 }}>
              Ask questions about student assessments and watch the AI dynamically reorganize graphs and data on the full visual canvas.
            </p>

            {/* Input field */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0F1729',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '6px 10px',
              gap: '6px'
            }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about school scores, trends..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => handleOpenVisualizer()}
                style={{
                  background: '#5EEAD4',
                  color: '#0F1729',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: 'pointer',
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
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '4px 10px',
                      color: '#94A3B8',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(94, 234, 212, 0.1)';
                      e.target.style.color = '#5EEAD4';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.target.style.color = '#94A3B8';
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
              style={{
                background: 'linear-gradient(135deg, #5EEAD4, #2DD4BF)',
                color: '#0F1729',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(94, 234, 212, 0.25)',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              <BarChart3 size={16} />
              <span>Launch Full Visualizer Canvas</span>
              <ArrowRight size={14} />
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
          background: 'linear-gradient(135deg, #5EEAD4, #0D9488)',
          color: '#0F1729',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(13, 148, 136, 0.4), 0 0 16px rgba(94, 234, 212, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Open Asha AI Visualizer"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
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
