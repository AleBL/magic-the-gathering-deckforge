import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown, LuChevronUp, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu';
import { ValidationResult, ValidationError } from '../../utils/deckValidator';
import { formatLabelKey } from '../../utils/formatLabel';

interface DeckValidationBadgeProps {
  validation: ValidationResult;
  formatKey: string;
  variant?: 'compact' | 'full';
}

function DeckValidationBadge({ validation, formatKey, variant = 'full' }: DeckValidationBadgeProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'compact') {
    // A shape plus a word for assistive tech: the check and the warning read apart without
    // colour, and the row stays on one line in the narrow library lane.
    const label = validation.isValid ? t('validation.valid') : t('validation.invalid');
    const Icon = validation.isValid ? LuCircleCheck : LuTriangleAlert;
    return (
      <span
        className={`inline-flex items-center ${validation.isValid ? 'text-success' : 'text-danger'}`}
        title={label}
        role="img"
        aria-label={label}
      >
        <Icon className="text-sm" aria-hidden="true" />
      </span>
    );
  }

  const hasErrors = validation.errors.length > 0;
  const format = t(formatLabelKey(formatKey));
  const [firstError] = validation.errors;
  // The header names the first problem in a few words; the list below has the full sentences.
  const summary = firstError
    ? t(`validation.short.${firstError.key}`, {
        ...firstError.params,
        defaultValue: t(`validation.${firstError.key}`, firstError.params)
      })
    : null;
  const StatusIcon = validation.isValid ? LuCircleCheck : LuTriangleAlert;

  return (
    <div className={`alert-banner ${validation.isValid ? 'alert-banner-success' : 'alert-banner-danger'}`}>
      <button
        type="button"
        onClick={() => hasErrors && setIsExpanded(!isExpanded)}
        className={`validation-badge-header select-none flex justify-between items-center gap-3 w-full text-left p-1 rounded ${hasErrors ? 'cursor-pointer hover:bg-surface-2 transition-colors duration-150' : ''}`}
        aria-expanded={hasErrors ? isExpanded : undefined}
        disabled={!hasErrors}
      >
        <span className="flex min-w-0 items-center gap-2">
          <StatusIcon
            className={`shrink-0 ${validation.isValid ? 'text-success' : 'text-danger'}`}
            aria-hidden="true"
          />
          <span className="font-medium text-fg shrink-0">
            {validation.isValid ? t('validation.validFor', { format }) : t('validation.invalidFor', { format })}
          </span>
          {summary ? <span className="truncate text-fg-secondary">{summary}</span> : null}
          {validation.errors.length > 1 ? (
            <span className="shrink-0 text-fg-muted">
              {t('validation.moreIssues', { count: validation.errors.length - 1 })}
            </span>
          ) : null}
        </span>
        {hasErrors ? (
          <span className="text-fg-muted shrink-0">
            {isExpanded ? <LuChevronUp className="w-3.5 h-3.5" /> : <LuChevronDown className="w-3.5 h-3.5" />}
          </span>
        ) : null}
      </button>

      {hasErrors && isExpanded ? (
        <ul className="mt-2 space-y-1 text-sm border-t border-line pt-2 list-disc pl-5">
          {validation.errors.map((err: ValidationError, i: number) => (
            <li key={i} className="text-fg-secondary">
              {t(`validation.${err.key}`, err.params) as string}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default DeckValidationBadge;
