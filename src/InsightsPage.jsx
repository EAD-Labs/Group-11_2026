import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
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
  FileText,
  User,
  LogOut,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import DynamicVisualizer from './components/DynamicVisualizer';
import OfflineBanner from './components/OfflineBanner';
import { useNetworkStatus } from './hooks/useNetworkStatus';

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

  // Multi-tier Network Connectivity Status
  const { status: networkStatus, effectiveType } = useNetworkStatus();
  const isChatDisabled = networkStatus === 'OFFLINE' || networkStatus === 'ONLINE_SLOW';

  // User & Authentication State
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('kp_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [role, setRole] = useState(() => user?.role || 'GUEST');

  // AI Provider State
  const [provider, setProvider] = useState(() => localStorage.getItem('kp_provider') || 'gemini');

  // Check user session on mount
  useEffect(() => {
    const token = localStorage.getItem('kp_token');
    if (token && !user) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })
        .then(async (res) => {
          if (res.ok) return res.json();
          if (res.status === 401) {
            // Attempt auto-refresh via refresh token cookie
            try {
              const refRes = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
              });
              if (refRes.ok) {
                const refData = await refRes.json();
                if (refData.accessToken) {
                  localStorage.setItem('kp_token', refData.accessToken);
                  const meRes = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${refData.accessToken}` }
                  });
                  if (meRes.ok) return meRes.json();
                }
              }
            } catch (e) {}
            // If refresh fails, purge stale expired tokens cleanly
            localStorage.removeItem('kp_token');
            localStorage.removeItem('kp_user');
            setUser(null);
            setRole('GUEST');
          }
          return null;
        })
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            setRole(data.role);
            localStorage.setItem('kp_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Check if a query was passed in the URL (e.g. from the floating widget)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (initialQuery) {
      setPrompt(initialQuery);
      handleExecuteQuery(initialQuery);
    }
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('kp_token', data.accessToken);
        localStorage.setItem('kp_user', JSON.stringify(data.user));
        setUser(data.user);
        setRole(data.role);
      } else {
        setError(data.error || 'Failed to authenticate with Google.');
      }
    } catch (err) {
      console.error('Google auth error', err);
      setError(err.message || 'Network error verifying Google credentials.');
    }
  };

  const handleQuickLogin = async (targetRole) => {
    try {
      setError(null);
      if (targetRole === 'GUEST') {
        const guestRes = await fetch(`${API_BASE}/api/auth/guest-token`, { method: 'POST' });
        const data = await guestRes.json();
        localStorage.setItem('kp_token', data.accessToken);
        const guestUser = { name: 'Guest Explorer', email: 'guest@asha.org', role: 'GUEST' };
        localStorage.setItem('kp_user', JSON.stringify(guestUser));
        setUser(guestUser);
        setRole('GUEST');
        return;
      }

      const email = targetRole === 'ADMIN' ? 'arjoe.basak@gmail.com' : 'teacher@asha.org';
      const name = targetRole === 'ADMIN' ? 'Arjoe Basak (Admin)' : 'Asha Teacher';
      const mockToken = btoa(JSON.stringify({ alg: "none" })) + "." + 
                        btoa(JSON.stringify({ email, name, picture: '' })) + ".sig";

      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockToken })
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('kp_token', data.accessToken);
        localStorage.setItem('kp_user', JSON.stringify(data.user));
        setUser(data.user);
        setRole(data.role);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('kp_token');
    localStorage.removeItem('kp_user');
    setUser(null);
    setRole('GUEST');
  };

  const handleExecuteQuery = async (queryText) => {
    const q = (queryText || prompt).trim();
    if (!q) return;

    if (isChatDisabled) {
      setError(networkStatus === 'OFFLINE'
        ? 'AI Visualizer is disabled in offline mode. Please reconnect to a stable network.'
        : `AI Visualizer is disabled on slow networks (${effectiveType.toUpperCase()}) to prevent timeouts.`);
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMsg(`Asha AI (${provider === 'gemini' ? 'Gemini 2.5 Flash' : 'Groq 120B'}) is analyzing query & selecting tools...`);

    try {
      let token = localStorage.getItem('kp_token');
      if (!token) {
        try {
          const guestRes = await fetch(`${API_BASE}/api/auth/guest-token`, { method: 'POST' });
          const guestData = await guestRes.json();
          token = guestData.accessToken;
          localStorage.setItem('kp_token', token);
        } catch (e) {
          // ignore
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'x-llm-provider': provider
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let res = await fetch(`${API_BASE}/api/analytics/chat`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          prompt: q,
          provider
        })
      });

      // Handle token expiration seamlessly
      if (res.status === 401) {
        // 1. Try refresh endpoint
        try {
          const refRes = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
          });
          if (refRes.ok) {
            const refData = await refRes.json();
            if (refData.accessToken) {
              token = refData.accessToken;
              localStorage.setItem('kp_token', token);
              headers['Authorization'] = `Bearer ${token}`;
              res = await fetch(`${API_BASE}/api/analytics/chat`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({ prompt: q, provider })
              });
            }
          }
        } catch (e) {}

        // 2. If still 401, check if user session was active or fallback to guest
        if (res.status === 401) {
          const wasLoggedIn = !!user && user.role !== 'GUEST';
          localStorage.removeItem('kp_token');
          if (!wasLoggedIn) {
            // Silently request fresh guest token and retry
            try {
              const guestRes = await fetch(`${API_BASE}/api/auth/guest-token`, { method: 'POST' });
              const guestData = await guestRes.json();
              token = guestData.accessToken;
              localStorage.setItem('kp_token', token);
              headers['Authorization'] = `Bearer ${token}`;
              res = await fetch(`${API_BASE}/api/analytics/chat`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({ prompt: q, provider })
              });
            } catch (e) {}
          } else {
            // Active session expired
            localStorage.removeItem('kp_user');
            setUser(null);
            setRole('GUEST');
            throw new Error('Your session has expired. Please sign in again with Google to continue as ADMIN.');
          }
        }
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to retrieve analysis');
      }

      setResult(data);
      if (data.userRole) setRole(data.userRole);
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
      width: '100%',
      boxSizing: 'border-box',
      background: 'var(--bg, #0F1729)',
      color: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Global Ambient Network Warning Banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <header style={{
        background: 'rgba(26, 37, 64, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexWrap: 'wrap',
        gap: '12px'
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

        {/* Controls: AI Provider Selector + Google Auth Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* AI Engine Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px 10px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Cpu size={14} style={{ color: provider === 'gemini' ? '#5EEAD4' : '#60A5FA' }} />
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                localStorage.setItem('kp_provider', e.target.value);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="gemini" style={{ background: '#1E293B', color: '#F8FAFC' }}>Gemini (Google AI Suite - 1M TPM)</option>
              <option value="groq" style={{ background: '#1E293B', color: '#F8FAFC' }}>Groq (Open-Source 120B/70B)</option>
            </select>
          </div>

          {/* User Profile or Google Sign In */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {user.picture ? (
                  <img src={user.picture} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#F8FAFC' }}>
                  {user.name}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  background: role === 'ADMIN' ? 'rgba(52, 211, 153, 0.2)' : role === 'ASHATEACHER' ? 'rgba(94, 234, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: role === 'ADMIN' ? '#34D399' : role === 'ASHATEACHER' ? '#5EEAD4' : '#F59E0B'
                }}>
                  {role || 'GUEST'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#F87171',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was unsuccesful or blocked')}
                theme="filled_black"
                shape="pill"
                size="small"
                text="signin_with"
              />
              <button
                onClick={() => handleQuickLogin('ADMIN')}
                title="Quick sign-in as Admin (Arjoe Basak)"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93C5FD',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Demo Admin
              </button>
            </div>
          )}
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
        flex: 1,
        boxSizing: 'border-box'
      }}>
        {/* Search & Prompt Box */}
        <section style={{
          background: 'var(--bg-2, #1A2540)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#5EEAD4',
            fontSize: '0.95rem',
            fontWeight: 600,
            textAlign: 'center',
            width: '100%'
          }}>
            <Lightbulb size={20} />
            <span>Ask any question to dynamically synthesize graphs & analytics</span>
          </div>

          {/* Strict Offline & Slow Network Guard Banner */}
          {isChatDisabled && (
            <div style={{
              width: '100%',
              maxWidth: '920px',
              margin: '0 auto',
              background: networkStatus === 'OFFLINE' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${networkStatus === 'OFFLINE' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: networkStatus === 'OFFLINE' ? '#FCA5A5' : '#FDE68A',
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }}>
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {networkStatus === 'OFFLINE' ? <WifiOff size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div style={{ lineHeight: 1.5 }}>
                <strong style={{ display: 'block', marginBottom: '2px', color: networkStatus === 'OFFLINE' ? '#F87171' : '#FBBF24' }}>
                  {networkStatus === 'OFFLINE' ? 'AI Visualizer Unavailable Offline' : `Low-Bandwidth Detected (${effectiveType.toUpperCase()})`}
                </strong>
                <span>
                  {networkStatus === 'OFFLINE'
                    ? 'Synthesizing charts requires a live internet connection to communicate with Google Gemini and remote databases. Reconnect to resume queries.'
                    : 'AI query synthesis is paused on slow networks to avoid hangs and timeouts. Learning trails and cached course materials remain accessible.'}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            maxWidth: '920px',
            margin: '0 auto',
            boxSizing: 'border-box',
            opacity: isChatDisabled ? 0.65 : 1
          }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isChatDisabled || loading}
              placeholder={
                isChatDisabled
                  ? (networkStatus === 'OFFLINE'
                      ? 'AI Visualizer disabled while offline — connect to internet to query'
                      : `AI Visualizer paused on slow connection (${effectiveType.toUpperCase()})`)
                  : 'e.g. Compare Maths vs English score averages in 2020 by class...'
              }
              style={{
                flex: 1,
                minWidth: 0,
                background: 'rgba(15, 23, 41, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '14px 20px',
                color: '#F8FAFC',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s',
                cursor: isChatDisabled ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!isChatDisabled) e.target.style.borderColor = '#5EEAD4';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            />
            <button
              type="submit"
              disabled={isChatDisabled || loading || !prompt.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: (isChatDisabled || loading || !prompt.trim()) ? '#475569' : 'linear-gradient(135deg, #5EEAD4, #2DD4BF)',
                color: (isChatDisabled || loading || !prompt.trim()) ? '#94A3B8' : '#0F1729',
                border: 'none',
                borderRadius: '12px',
                padding: '0 26px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: (isChatDisabled || loading || !prompt.trim()) ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'transform 0.1s, opacity 0.2s'
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
              <span>{loading ? 'Synthesizing...' : 'Analyze'}</span>
            </button>
          </form>

          {/* Quick Suggestions */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '920px',
            opacity: isChatDisabled ? 0.45 : 1,
            pointerEvents: isChatDisabled ? 'none' : 'auto'
          }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Try:</span>
            {EXAMPLE_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                disabled={isChatDisabled}
                onClick={() => {
                  if (isChatDisabled) return;
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
                  cursor: isChatDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!isChatDisabled) {
                    e.target.style.background = 'rgba(94, 234, 212, 0.08)';
                    e.target.style.color = '#5EEAD4';
                    e.target.style.borderColor = 'rgba(94, 234, 212, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isChatDisabled) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.target.style.color = '#94A3B8';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }
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
        Asha Kanini Insights • Powered by Google Gemini & PostgreSQL
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
