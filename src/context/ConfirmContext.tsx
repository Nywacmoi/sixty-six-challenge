import React, { createContext, useCallback, useContext, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  isInfo: boolean;
  onConfirm: () => void;
};

type ConfirmContextValue = {
  confirmAction: (title: string, message: string, confirmLabel: string, onConfirm: () => void, destructive?: boolean) => void;
  notify: (title: string, message: string, onDismiss?: () => void) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirmAction = useCallback(
    (title: string, message: string, confirmLabel: string, onConfirm: () => void, destructive = true) => {
      setRequest({ title, message, confirmLabel, destructive, isInfo: false, onConfirm });
    },
    []
  );

  const notify = useCallback((title: string, message: string, onDismiss?: () => void) => {
    setRequest({ title, message, confirmLabel: 'OK', destructive: false, isInfo: true, onConfirm: onDismiss ?? (() => {}) });
  }, []);

  const handleCancel = useCallback(() => setRequest(null), []);
  const handleConfirm = useCallback(() => {
    const active = request;
    setRequest(null);
    active?.onConfirm();
  }, [request]);

  return (
    <ConfirmContext.Provider value={{ confirmAction, notify }}>
      {children}
      <ConfirmModal
        visible={!!request}
        title={request?.title ?? ''}
        message={request?.message ?? ''}
        confirmLabel={request?.confirmLabel ?? 'OK'}
        destructive={request?.destructive ?? false}
        isInfo={request?.isInfo ?? false}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
