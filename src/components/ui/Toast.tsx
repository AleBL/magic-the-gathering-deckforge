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
      className={`fixed bottom-5 right-5 left-5 md:left-auto w-auto md:w-full max-w-[calc(100vw-40px)] md:max-w-sm overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-toast-enter transition-all duration-300 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-white/5 border-l-4 ${borderMap[variant]}`}
    >
      <div className="p-4 flex items-center justify-between gap-3" role="alert" aria-live="assertive">
        <div className="flex items-center gap-3">
          {iconMap[variant]}
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{message}</span>
        </div>
        {action ? (
          <button
            onClick={action.onClick}
            className="shrink-0 px-3 py-1 text-xs font-bold rounded-md bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/40 text-blue-600 dark:text-blue-400 transition-colors"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default Toast;
