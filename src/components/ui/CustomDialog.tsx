import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { AlertVariant } from '../../types';

interface CustomDialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: AlertVariant;
}

function CustomDialog({ isOpen, type, title, message, onConfirm, onCancel, variant = AlertVariant.INFO }: CustomDialogProps) {
  const { t } = useTranslation();

  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const alertBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    // Show native OS notification
    if (typeof window !== 'undefined') {
      const safeWindow = window as any;
      if (safeWindow.ipcRenderer) {
        safeWindow.ipcRenderer.send('show-notification', { title, body: message });
      } else if (window.Notification) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body: message });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification(title, { body: message });
            }
          });
        }
      }
    }

    // Focus primary button on mount
    if (type === 'confirm') {
      confirmBtnRef.current?.focus();
    } else {
      alertBtnRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, type]);

  if (!isOpen) return null;

  const iconMap = {
    [AlertVariant.DANGER]: <FaExclamationTriangle className="text-red-500 text-3xl shrink-0" />,
    [AlertVariant.WARNING]: <FaExclamationTriangle className="text-amber-500 text-3xl shrink-0" />,
    [AlertVariant.SUCCESS]: <FaCheckCircle className="text-green-500 text-3xl shrink-0" />,
    [AlertVariant.INFO]: <FaInfoCircle className="text-blue-500 text-3xl shrink-0" />
  };

  return createPortal(
    <div
      className="modal-overlay animate-fadeIn"
      onClick={onCancel}
      role="button"
      tabIndex={-1}
      aria-label={t('common.close')}
    >
      <div
        ref={dialogRef}
        className="modal-container modal-container-small animate-slide-in relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Top Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            variant === AlertVariant.DANGER
              ? 'bg-red-500'
              : variant === AlertVariant.WARNING
                ? 'bg-amber-500'
                : variant === AlertVariant.SUCCESS
                  ? 'bg-green-500'
                  : 'bg-blue-500'
          }`}
        />

        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label={t('common.close')}
        >
          <FaTimes className="text-base" />
        </button>

        <div className="flex gap-4 pt-2">
          {iconMap[variant]}
          <div className="flex-1 space-y-2">
            <h3
              id="dialog-title"
              className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300"
            >
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300 whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {type === 'confirm' ? (
            <>
              <button type="button" onClick={onCancel} className="secondary-button py-2 px-4 text-sm font-medium">
                {t('common.cancel')}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={onConfirm}
                className={`${
                  variant === AlertVariant.DANGER
                    ? 'danger-button'
                    : variant === AlertVariant.WARNING
                      ? 'warning-button'
                      : variant === AlertVariant.SUCCESS
                        ? 'success-button'
                        : 'primary-button'
                } py-2 px-4 text-sm font-medium`}
              >
                {t('common.confirm')}
              </button>
            </>
          ) : (
            <button
              ref={alertBtnRef}
              type="button"
              onClick={onConfirm}
              className="primary-button py-2 px-4 text-sm font-medium"
            >
              {t('common.ok')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) as unknown as ReactNode;
}

export default CustomDialog;
