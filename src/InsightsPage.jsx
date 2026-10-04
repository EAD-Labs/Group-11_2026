import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  ArrowLeft,
  LayoutDashboard,
  Compass,
  Cpu,
  Database,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lightbulb,
  FileText
} from 'lucide-react';
import DynamicVisualizer from './components/DynamicVisualizer';

const API_BASE = (import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:4000`).replace(/\/+$/, '');

const EXAMPLE_QUERIES = [
  "Compare Maths and English scores in 2020 across classes",
  "Which schools scored highest in 2019 written assessments?",
  "Show oral skill progression distribution for Class 3",
  "Analyze question difficulty for Class 4 Maths",
  "How did Computer Science assessments perform in 2020?"
];

export default function InsightsPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetailed, setShowDetailed] = useState(true);

  // Check if a query was passed in the URL (e.g. from the floating widget)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (initialQuery) {
      setPrompt(initialQuery);
      handleExecuteQuery(initialQuery);
    }
  }, []);

  const handleExecuteQuery = async (queryText) => {
    const q = (queryText || prompt).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setStatusMsg('AI Copilot is analyzing query & selecting tools...');

    try {
      // Use existing teacher token or request a guest token
      let token = localStorage.getItem('kp_token');
      if (!token) {
        try {
          const guestRes = await fetch(`${API_BASE}/api/auth/guest-token`, { method: 'POST' });
          const guestData = await guestRes.json();
          token = guestData.accessToken;
        } catch (e) {
          // ignore
        }
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/analytics/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: q })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to retrieve analysis');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Error executing AI analysis');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleExecuteQuery();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #0F1729)',
      color: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navbar */}
      <header style={{
        background: 'rgba(26, 37, 64, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="/analytics"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '0.85rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </a>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '0.85rem',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <Compass size={14} />
            <span>Learning Trail</span>
          </a>
          <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #5EEAD4, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F1729'
            }}>
              <Sparkles size={16} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#F8FAFC' }}>
              Asha Insights <span style={{ color: '#5EEAD4' }}>AI Visualizer</span>
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {result?.userRole && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              background: result.isMasked ? 'rgba(245, 158, 11, 0.12)' : 'rgba(52, 211, 153, 0.12)',
              color: result.isMasked ? '#F59E0B' : '#34D399',
              border: `1px solid ${result.isMasked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              <span>Role: {result.userRole} {result.isMasked ? '(PII Masked)' : '(Full Access)'}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            background: 'rgba(94, 234, 212, 0.1)',
            color: '#5EEAD4',
            border: '1px solid rgba(94, 234, 212, 0.25)',
            padding: '4px 10px',
            borderRadius: '20px'
          }}>
            <Cpu size={12} />
            <span>{result?.modelUsed || 'Open-Source AI (120B / 70B)'}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        flex: 1
      }}>
        {/* Search & Prompt Box */}
        <section style={{
          background: 'var(--bg-2, #1A2540)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5EEAD4', fontSize: '0.9rem', fontWeight: 600 }}>
            <Lightbulb size={18} />
            <span>Ask any question to dynamically synthesize graphs & analytics</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Compare Maths vs English score averages in 2020 by class..."
              style={{
                flex: 1,
                background: 'rgba(15, 23, 41, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '14px 18px',
                color: '#F8FAFC',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#5EEAD4'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: loading ? '#475569' : 'linear-gradient(135deg, #5EEAD4, #2DD4BF)',
                color: '#0F1729',
                border: 'none',
                borderRadius: '10px',
                padding: '0 24px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                transition: 'transform 0.1s, opacity 0.2s'
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
              <span>{loading ? 'Synthesizing...' : 'Analyze'}</span>
            </button>
          </form>

          {/* Quick Suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Try:</span>
            {EXAMPLE_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPrompt(q);
                  handleExecuteQuery(q);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  color: '#94A3B8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(94, 234, 212, 0.08)';
                  e.target.style.color = '#5EEAD4';
                  e.target.style.borderColor = 'rgba(94, 234, 212, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.target.style.color = '#94A3B8';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Loading Indicator */}
        {loading && (
          <div style={{
            background: 'rgba(94, 234, 212, 0.05)',
            border: '1px solid rgba(94, 234, 212, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <RefreshCw size={24} color="#5EEAD4" style={{ animation: 'spin 1.2s linear infinite' }} />
            <div style={{ color: '#5EEAD4', fontSize: '0.95rem', fontWeight: 600 }}>
              {statusMsg}
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
              Executing PostgreSQL queries and dynamically structuring intuitive visual layout...
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #EF4444',
            borderRadius: '12px',
            padding: '16px 20px',
            color: '#FCA5A5',
            fontSize: '0.9rem'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Result Visual Canvas */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header info & Tool badges */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Tools Executed:</span>
                {result.toolsExecuted && result.toolsExecuted.length > 0 ? (
                  result.toolsExecuted.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(167, 139, 250, 0.12)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        color: '#A78BFA',
                        fontSize: '0.75rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      <Database size={11} />
                      {t.tool}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>None</span>
                )}
              </div>

              {result.ui_layout?.layout_type && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#5EEAD4',
                  background: 'rgba(94, 234, 212, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(94, 234, 212, 0.2)'
                }}>
                  Layout: {result.ui_layout.layout_type.replace('_', ' ').toUpperCase()}
                </div>
              )}
            </div>

            {/* Executive Summary */}
            {result.summary && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(94, 234, 212, 0.08), rgba(59, 130, 246, 0.08))',
                border: '1px solid rgba(94, 234, 212, 0.25)',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '1rem',
                lineHeight: 1.5,
                color: '#F8FAFC'
              }}>
                <span style={{ fontWeight: 700, color: '#5EEAD4', marginRight: '6px' }}>Takeaway:</span>
                {result.summary}
              </div>
            )}

            {/* Dynamic Generated Visual Grid */}
            <section style={{ width: '100%' }}>
              <DynamicVisualizer layout={result.ui_layout} />
            </section>

            {/* Detailed AI Reasoning & Breakdown */}
            {result.detailed_analysis && (
              <section style={{
                background: 'var(--bg-2, #1A2540)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setShowDetailed(!showDetailed)}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: 'none',
                    borderBottom: showDetailed ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                    color: '#F8FAFC',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#5EEAD4" />
                    <span>In-depth Reasoning & Statistical Breakdown</span>
                  </div>
                  {showDetailed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showDetailed && (
                  <div style={{
                    padding: '20px',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    color: '#CBD5E1',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {result.detailed_analysis}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '16px',
        textAlign: 'center',
        color: '#64748B',
        fontSize: '0.78rem'
      }}>
        Asha Kanini Insights • Powered by Llama 3.3 70B & PostgreSQL
      </footer>

      {/* Inline spin keyframe style */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
