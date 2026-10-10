'use client';

import React from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface AlertOptions {
  title: string;
  text?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface SweetAlertModalProps {
  isOpen: boolean;
  options: AlertOptions | null;
  onClose: () => void;
}

export default function SweetAlertModal({ isOpen, options, onClose }: SweetAlertModalProps) {
  if (!isOpen || !options) return null;

  const {
    title,
    text,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancelButton = false,
    onConfirm,
    onCancel,
  } = options;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  // Type-specific colors and icons
  const typeConfig: Record<AlertType, { color: string; bg: string; icon: React.ReactNode }> = {
    success: {
      color: '#10b981',
      bg: '#ecfdf5',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    error: {
      color: '#ef4444',
      bg: '#fef2f2',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    warning: {
      color: '#f59e0b',
      bg: '#fffbeb',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    info: {
      color: '#3b82f6',
      bg: '#eff6ff',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
    question: {
      color: '#6366f1',
      bg: '#eef2ff',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  };

  const currentType = typeConfig[type] || typeConfig.info;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        animation: 'fadeIn 0.18s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !showCancelButton) {
          onClose();
        }
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2rem 1.75rem',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          textAlign: 'center',
          animation: 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Animated Icon Circle */}
        <div
          style={{
            width: '76px',
            height: '76px',
            margin: '0 auto 1.25rem auto',
            borderRadius: '50%',
            backgroundColor: currentType.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 0 8px ${currentType.bg}`,
          }}
        >
          {currentType.icon}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.25rem',
            fontWeight: '800',
            color: '#0f172a',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        {/* Description / Subtext */}
        {text && (
          <p
            style={{
              margin: '0 0 1.5rem 0',
              fontSize: '0.875rem',
              color: '#64748b',
              lineHeight: 1.55,
              whiteSpace: 'pre-line',
            }}
          >
            {text}
          </p>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            marginTop: text ? 0 : '1.25rem',
          }}
        >
          {showCancelButton && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              backgroundColor: type === 'error' ? '#ef4444' : type === 'warning' ? '#d97706' : '#2563eb',
            }}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
