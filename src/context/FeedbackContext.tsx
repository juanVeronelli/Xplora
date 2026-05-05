/**
 * Toasts no intrusivos y diálogo **confirm** async (reemplaza `window.confirm` en el admin).
 * Usar: `const toast = useToast(); toast.success('…');` y `const ok = await confirm({ title, message, danger });`
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Estilo rojo para eliminar / acciones destructivas */
  danger?: boolean;
}

const DURATION: Record<ToastVariant, number> = {
  success: 4200,
  error: 7000,
  info: 4500,
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

type FeedbackValue = {
  toast: ToastApi;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback((message: string, variant: ToastVariant) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const toastApi = useMemo<ToastApi>(
    () => ({
      success: (message: string) => pushToast(message, 'success'),
      error: (message: string) => pushToast(message, 'error'),
      info: (message: string) => pushToast(message, 'info'),
    }),
    [pushToast],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    setConfirmState(prev => {
      prev?.resolve(value);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ toast: toastApi, confirm }), [toastApi, confirm]);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {portalTarget &&
        createPortal(
          <>
            <ToastStack toasts={toasts} onDismissToast={dismiss} />
            {confirmState && (
              <ConfirmModal options={confirmState.options} onClose={closeConfirm} />
            )}
          </>,
          portalTarget,
        )}
    </FeedbackContext.Provider>
  );
}

function ToastStack({
  toasts,
  onDismissToast,
}: {
  toasts: ToastItem[];
  onDismissToast: (id: string) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Notificaciones"
      style={{
        position: 'fixed',
        zIndex: 99999,
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 400,
        width: 'calc(100vw - 32px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <Toast key={t.id} item={t} toastId={t.id} onDismissToast={onDismissToast} />
      ))}
    </div>
  );
}

function Toast({
  item,
  toastId,
  onDismissToast,
}: {
  item: ToastItem;
  toastId: string;
  onDismissToast: (id: string) => void;
}) {
  useEffect(() => {
    const ms = DURATION[item.variant];
    const timer = window.setTimeout(() => onDismissToast(toastId), ms);
    return () => window.clearTimeout(timer);
  }, [item.variant, toastId, onDismissToast]);

  const bg =
    item.variant === 'error'
      ? 'linear-gradient(135deg, #fff5f5 0%, #fff 55%)'
      : item.variant === 'success'
        ? 'linear-gradient(135deg, rgba(45,106,79,0.08) 0%, #fff 60%)'
        : 'linear-gradient(135deg, rgba(96,62,249,0.06) 0%, #faf9f7 55%)';

  const border =
    item.variant === 'error'
      ? '1px solid rgba(192,57,43,0.22)'
      : item.variant === 'success'
        ? '1px solid rgba(45,106,79,0.2)'
        : '1px solid rgba(96,62,249,0.18)';

  const accent =
    item.variant === 'error' ? '#c0392b' : item.variant === 'success' ? '#2d6e4f' : '#603ef9';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        pointerEvents: 'auto',
        borderRadius: 14,
        padding: '14px 16px 14px 16px',
        background: bg,
        border,
        borderLeft: `4px solid ${accent}`,
        boxShadow: '0 12px 40px rgba(26,16,40,0.12)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        animation: 'xplora-toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink)', flex: 1 }}>{item.message}</p>
      <button
        type="button"
        onClick={() => onDismissToast(toastId)}
        style={{
          flexShrink: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--ink-muted)',
          fontSize: 18,
          lineHeight: 1,
          padding: 2,
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}

function ConfirmModal({
  options,
  onClose,
}: {
  options: ConfirmOptions;
  onClose: (v: boolean) => void;
}) {
  const confirmLabel = options.confirmLabel ?? 'Confirmar';
  const cancelLabel = options.cancelLabel ?? 'Cancelar';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: 'rgba(26,16,40,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        pointerEvents: 'auto',
      }}
      onClick={() => onClose(false)}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="confirm-dialog-title"
        style={{
          background: '#fff',
          borderRadius: 18,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 24px 64px rgba(26,16,40,0.18)',
          border: '1px solid rgba(26,16,40,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 18,
            fontWeight: 700,
            margin: '0 0 10px',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          {options.title}
        </h2>
        <p style={{ margin: '0 0 22px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{options.message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onClose(false)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid rgba(26,16,40,0.14)',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-muted)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              background: options.danger ? '#c0392b' : 'var(--purple)',
              color: '#fff',
              boxShadow: options.danger ? 'none' : '0 2px 10px rgba(96,62,249,0.35)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de FeedbackProvider');
  return ctx.toast;
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de FeedbackProvider');
  return ctx.confirm;
}
