'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AdminNotificationManagerProps {
  leads: any[];
}

export default function AdminNotificationManager({ leads }: AdminNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const previousLeadIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      }
    }
  }, []);

  // Request Notification Permission
  const requestPermission = async () => {
    if (!isSupported) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        sendTestNotification();
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    }
  };

  // Play Notification Chime Sound
  const playNotificationSound = () => {
    try {
      // Synthesize a pleasant notification chime using Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

        osc2.frequency.setValueAtTime(880, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.5);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.5);
      }
    } catch (_) {}
  };

  // Trigger Phone / System Notification
  const triggerPhoneNotification = (title: string, body: string, url: string = '/admin') => {
    playNotificationSound();

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body,
            url,
          });
        }

        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'lead-alert-' + Date.now(),
        });

        notif.onclick = () => {
          window.focus();
          window.location.href = url;
        };
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
  };

  // Send Test Notification to verify Phone / Device
  const sendTestNotification = () => {
    triggerPhoneNotification(
      '🔔 S.R Rentals Alert Test',
      'Real-time phone notifications are active! You will now receive instant alerts for every new property lead.',
      '/admin'
    );
  };

  // Watch for new incoming leads on polling updates
  useEffect(() => {
    if (!leads || leads.length === 0) return;

    const currentLeadIds = new Set<string>(leads.map((l: any) => l._id || l.id));

    if (isInitialLoadRef.current) {
      previousLeadIdsRef.current = currentLeadIds;
      isInitialLoadRef.current = false;
      return;
    }

    // Check for newly added leads
    for (const lead of leads) {
      const id = lead._id || lead.id;
      if (!previousLeadIdsRef.current.has(id)) {
        // New lead detected! Fire instant device notification
        const clientName = lead.name || 'A prospective tenant';
        const phone = lead.phone ? ` (${lead.phone})` : '';
        const propTitle = lead.propertyId?.title || 'a property';

        triggerPhoneNotification(
          `🚨 NEW PROPERTY LEAD - ${clientName}`,
          `${clientName}${phone} just submitted an enquiry for "${propTitle}". Tap to open CRM.`,
          '/admin'
        );
        break;
      }
    }

    previousLeadIdsRef.current = currentLeadIds;
  }, [leads]);

  if (!isSupported) {
    return null;
  }

  return (
    <div
      className="card phone-notification-manager-box"
      style={{
        padding: '1.25rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: permission === 'granted' ? '#ecfdf5' : '#fffbeb',
              color: permission === 'granted' ? '#059669' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
            }}
          >
            {permission === 'granted' ? '🔔' : '🔕'}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Real-Time Phone & Device Push Alerts
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {permission === 'granted'
                ? '✅ Active: Your device will ring and receive instant lock-screen push notifications whenever a lead is generated.'
                : 'Enable browser push notifications to receive instant vibration/chime alerts on your phone.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowConfigGuide(!showConfigGuide)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.775rem' }}
          >
            ⚙️ {showConfigGuide ? 'Hide Phone Channels' : 'Phone Channels (WhatsApp / Telegram)'}
          </button>

          {permission !== 'granted' ? (
            <button
              type="button"
              onClick={requestPermission}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.5rem 1rem', fontSize: '0.825rem', backgroundColor: '#0284c7' }}
            >
              🔔 Enable Phone Notifications
            </button>
          ) : (
            <button
              type="button"
              onClick={sendTestNotification}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.775rem', backgroundColor: '#059669' }}
            >
              📲 Test Phone Alert
            </button>
          )}
        </div>
      </div>

      {showConfigGuide && (
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Method 1: Web Push */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              <strong style={{ fontSize: '0.875rem', color: '#1e293b' }}>1. Lockscreen Browser Push (Zero Setup)</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
              Open this Admin page on your phone browser (Chrome or Safari on iOS/Android) and tap <strong>&ldquo;Enable Phone Notifications&rdquo;</strong> above. Your phone will chime and vibrate whenever a visitor enquires.
            </p>
            <span style={{ fontSize: '0.725rem', fontWeight: '600', color: '#059669' }}>
              Status: {permission === 'granted' ? 'Active & Ready' : 'Awaiting Permission'}
            </span>
          </div>

          {/* Method 2: Telegram Bot Instant Alert */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✈️</span>
              <strong style={{ fontSize: '0.875rem', color: '#0369a1' }}>2. Instant Telegram Push (Recommended)</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#0284c7', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
              Get instant messages on your Telegram app with custom loud ringtone. Add bot credentials to <code style={{ backgroundColor: '#e0f2fe', padding: '1px 4px', borderRadius: '3px' }}>.env.local</code>:
            </p>
            <ul style={{ fontSize: '0.75rem', color: '#0369a1', margin: '0 0 0.5rem 1rem', padding: 0 }}>
              <li>Create bot with <strong>@BotFather</strong> on Telegram</li>
              <li>Get your Chat ID via <strong>@userinfobot</strong></li>
              <li>Set <code style={{ fontSize: '0.72rem' }}>TELEGRAM_BOT_TOKEN</code> &amp; <code style={{ fontSize: '0.72rem' }}>TELEGRAM_ADMIN_CHAT_ID</code></li>
            </ul>
          </div>

          {/* Method 3: Automated WhatsApp */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>💬</span>
              <strong style={{ fontSize: '0.875rem', color: '#15803d' }}>3. Automated WhatsApp Messages</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
              Send automated messages to <strong style={{ color: '#15803d' }}>+91 7218661327</strong> via CallMeBot or Meta WhatsApp API:
            </p>
            <ul style={{ fontSize: '0.75rem', color: '#166534', margin: '0 0 0 1rem', padding: 0 }}>
              <li>Send <code style={{ fontSize: '0.72rem' }}>I allow callmebot to send me messages</code> to <strong>+34 941 07 00 14</strong> on WhatsApp</li>
              <li>Add the returned API key as <code style={{ fontSize: '0.72rem' }}>CALLMEBOT_API_KEY</code> in <code style={{ fontSize: '0.72rem' }}>.env.local</code></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
