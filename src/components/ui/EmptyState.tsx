import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: {
    label: string;
    onClick: () => void;
  }[];
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, suggestions }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      {icon && (
        <div className="w-24 h-24 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 border border-blue-100 dark:border-blue-900/50 relative group cursor-default">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="text-4xl text-blue-500 dark:text-blue-400 opacity-80 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
            {icon}
          </div>
        </div>
      )}
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{title}</h2>
      {description && <p className="text-base text-gray-500 dark:text-slate-400 mb-8">{description}</p>}

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all duration-300 active:scale-95 mb-8"
        >
          {action.label}
        </button>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-col items-center gap-3 w-full mt-4">
          <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-extrabold tracking-widest">
            {t('common.suggestions')}
          </span>
          <div className="flex flex-wrap justify-center gap-2.5">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={suggestion.onClick}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md transition-all active:scale-95"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
