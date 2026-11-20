import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import type { ToastVariant, ToastAction } from '../../types/Toast';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  action?: ToastAction;
}

function Toast({ message, variant = 'success', action }: ToastProps) {
  const iconMap = {
    success: <FaCheckCircle className="text-lg shrink-0 text-green-500" />,
    error: <FaExclamationTriangle className="text-lg shrink-0 text-red-500" />,
    warning: <FaExclamationTriangle className="text-lg shrink-0 text-amber-500" />,
    info: <FaInfoCircle className="text-lg shrink-0 text-blue-500" />
  };

  const borderMap = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500'
  };

  return (
    <div
      // z-[var(--z-toast)]: without an explicit z-index this sits in default
      // paint order, which puts it BEHIND the mobile bottom-tab-bar
      // (--z-sticky) and any open sheet/dialog — invisible exactly when a
      // save/error toast is most likely to fire. The bottom offset clears
      // the tab bar's own height (~56px) plus the safe-area inset below `sm`,
      // where that bar exists; sm: and up it's hidden, so bottom-5 is enough.
      className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] sm:bottom-5 right-5 left-5 md:left-auto w-auto md:w-full max-w-[calc(100vw-40px)] md:max-w-sm overflow-hidden rounded-xl shadow-2xl ring-1 ring-line animate-toast-enter transition-all duration-300 backdrop-blur-md bg-surface-1/80 border border-white/20 dark:border-white/5 border-l-4 z-[var(--z-toast)] ${borderMap[variant]}`}
    >
      <div className="p-4 flex items-center justify-between gap-3" role="alert" aria-live="assertive">
        <div className="flex items-center gap-3">
          {iconMap[variant]}
          <span className="text-sm font-semibold text-fg">{message}</span>
        </div>
        {action ? (
          <button
            onClick={action.onClick}
            className="shrink-0 px-3 py-1 text-xs font-bold rounded-md bg-surface-1/20 hover:bg-surface-1/30 text-accent transition-colors"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default Toast;
