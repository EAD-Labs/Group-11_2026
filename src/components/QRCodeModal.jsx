import React, { useState } from 'react';
import { QrCode, X, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const demoUrl = "https://asha-kanini-mu.vercel.app";

  if (!isOpen) return null;

  function copyUrl() {
    navigator.clipboard?.writeText(demoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // QR Code URL using standard HTTPS QR image service with crisp dark theme rendering
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(demoUrl)}`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 10, 20, 0.82)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-card, #1A2540)',
        border: '1px solid rgba(94, 234, 212, 0.35)',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        color: '#F8FAFC',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94A3B8',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            background: 'rgba(94, 234, 212, 0.15)',
            padding: '8px',
            borderRadius: '10px',
            color: '#5EEAD4'
          }}>
            <Smartphone size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              Test on Mobile Device
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
              Live Learner & Teacher Experience
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.4, margin: '12px 0 16px 0' }}>
          Point your phone camera at the QR code below to launch the live application on your mobile browser.
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#FFFFFF',
          padding: '14px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          maxWidth: '220px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <img
            src={qrImageUrl}
            alt="Scan QR code for Asha Kanini"
            style={{ width: '190px', height: '190px', display: 'block' }}
          />
        </div>

        {/* URL Pill & Copy */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '0.82rem'
        }}>
          <span style={{
            fontFamily: 'monospace',
            color: '#5EEAD4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {demoUrl}
          </span>
          <button
            onClick={copyUrl}
            type="button"
            title="Copy URL"
            style={{
              background: copied ? '#059669' : 'rgba(94, 234, 212, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 8px',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Evaluator Tip */}
        <div style={{
          marginTop: '14px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          fontSize: '0.75rem',
          color: '#93C5FD',
          lineHeight: 1.4
        }}>
          <strong>Booth Tip:</strong> Mobile visitors can test offline caching by toggling Airplane Mode after the curriculum trail opens!
        </div>
      </div>
    </div>
  );
}
