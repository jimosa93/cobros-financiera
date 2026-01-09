'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastItem = { id: string; message: string; type?: 'success' | 'error' | 'info' };

const ToastContext = createContext<{ addToast: (t: Omit<ToastItem, 'id'>) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, ...t }]);
    // auto remove
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  // on mount, check sessionStorage for queued toast
  useEffect(() => {
    try {
      const queued = sessionStorage.getItem('globalToast');
      if (queued) {
        const parsed = JSON.parse(queued);
        if (parsed?.message) addToast(parsed);
        sessionStorage.removeItem('globalToast');
      }
    } catch (e) {
      // ignore
    }
  }, [addToast]);

  // Listen for custom global-toast events or storage changes
  useEffect(() => {
    const handleQueuedToast = () => {
      try {
        const queued = sessionStorage.getItem('globalToast');
        if (queued) {
          const parsed = JSON.parse(queued);
          if (parsed?.message) addToast(parsed);
          sessionStorage.removeItem('globalToast');
        }
      } catch (e) {
        // ignore
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'globalToast') handleQueuedToast();
    };
    const onGlobal = () => handleQueuedToast();
    window.addEventListener('storage', onStorage);
    window.addEventListener('global-toast', onGlobal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('global-toast', onGlobal);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 80,
        right: 30,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: t.type === 'success' ? '#d1fae5' : t.type === 'error' ? '#fee2e2' : '#eef2ff',
            color: t.type === 'success' ? '#064e3b' : t.type === 'error' ? '#991b1b' : '#3730a3',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontWeight: 600
          }}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

