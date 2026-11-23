import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  compact?: boolean;
  description?: string;
  /** Quieter alternatives shown next to the primary action, e.g. on a first run. */
  secondaryActions?: { label: string; onClick: () => void }[];
  action?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: {
    label: string;
    onClick: () => void;
  }[];
}

function EmptyState({ icon, title, compact, description, action, secondaryActions, suggestions }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center text-center animate-fadeIn ${
        compact ? 'py-2 px-3' : 'py-24 px-4'
      }`}
    >
      {icon && (
        <div
          className={`bg-surface-2 rounded-full flex items-center justify-center border border-line ${
            compact ? 'w-9 h-9 mb-2' : 'w-16 h-16 mb-5'
          }`}
        >
          <div className={`text-fg-muted ${compact ? 'text-base' : 'text-2xl'}`}>{icon}</div>
        </div>
      )}
      <h2
        className={
          compact
            ? 'text-xs font-semibold text-fg-secondary text-balance'
            : 'text-2xl font-semibold text-fg mb-3 tracking-tight text-balance'
        }
      >
        {title}
      </h2>
      {description && (
        <p
          className={
            compact ? 'text-[11px] text-fg-muted mt-1 text-pretty' : 'text-base text-fg-muted mb-8 text-pretty'
          }
        >
          {description}
        </p>
      )}

      {(action || secondaryActions?.length) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {action && (
            <button type="button" onClick={action.onClick} className="primary-button">
              {action.label}
            </button>
          )}
          {secondaryActions?.map((secondary) => (
            <button key={secondary.label} type="button" onClick={secondary.onClick} className="secondary-button">
              {secondary.label}
            </button>
          ))}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-col items-center gap-3 w-full mt-4">
          <span className="text-[11px] text-fg-muted font-semibold">{t('common.suggestions')}</span>
          <div className="flex flex-wrap justify-center gap-2.5">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={suggestion.onClick}
                className="px-4 py-2 bg-surface-1 border border-line rounded-xl text-sm font-mono font-semibold text-fg-secondary hover:border-accent/50 hover:text-accent hover:shadow-md transition active:scale-95"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
