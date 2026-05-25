import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface CustomDialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

function CustomDialog({ isOpen, type, title, message, onConfirm, onCancel, variant = 'info' }: CustomDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <FaExclamationTriangle className="text-red-500 text-3xl shrink-0" />,
    warning: <FaExclamationTriangle className="text-amber-500 text-3xl shrink-0" />,
    success: <FaCheckCircle className="text-green-500 text-3xl shrink-0" />,
    info: <FaInfoCircle className="text-blue-500 text-3xl shrink-0" />
  };

  return createPortal(
    <div
      className="modal-overlay animate-fadeIn"
      onClick={onCancel}
      role="button"
      tabIndex={-1}
      aria-label={t('close')}
    >
      <div
        className="modal-container modal-container-small animate-slide-in relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            variant === 'danger'
              ? 'bg-red-500'
              : variant === 'warning'
                ? 'bg-amber-500'
                : variant === 'success'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
          }`}
        />

        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label={t('close')}
        >
          <FaTimes className="text-base" />
        </button>

        <div className="flex gap-4 pt-2">
          {iconMap[variant]}
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300 whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {type === 'confirm' ? (
            <>
              <button type="button" onClick={onCancel} className="secondary-button py-2 px-4 text-sm font-medium">
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`${
                  variant === 'danger'
                    ? 'danger-button'
                    : variant === 'warning'
                      ? 'warning-button'
                      : variant === 'success'
                        ? 'success-button'
                        : 'primary-button'
                } py-2 px-4 text-sm font-semibold`}
              >
                {t('confirm')}
              </button>
            </>
          ) : (
            <button type="button" onClick={onConfirm} className="primary-button py-2 px-6 text-sm font-semibold">
              {t('ok')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) as unknown as ReactNode;
}

export default CustomDialog;
