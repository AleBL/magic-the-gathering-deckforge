import { useTranslation } from 'react-i18next';
import { ValidationResult, ValidationError } from '../utils/deckValidator';

interface DeckValidationBadgeProps {
  validation: ValidationResult;
  formatKey: string;
  variant?: 'compact' | 'full';
}

function DeckValidationBadge({ validation, formatKey, variant = 'full' }: DeckValidationBadgeProps) {
  const { t } = useTranslation();

  if (variant === 'compact') {
    return (
      <span
        className={`status-badge text-[10px] ${validation.isValid ? 'status-badge-success' : 'status-badge-danger'}`}
      >
        {validation.isValid ? t('valid') : t('invalid')}
      </span>
    );
  }

  return (
    <div className={`alert-banner ${validation.isValid ? 'alert-banner-success' : 'alert-banner-danger'}`}>
      <div className="validation-badge-header">
        <span className="font-bold">
          {t('deckValidation')} ({t(formatKey)})
        </span>
        <span
          className={`status-badge ${
            validation.isValid ? 'status-badge-success' : 'status-badge-danger animate-pulse'
          }`}
        >
          {validation.isValid ? t('valid') : t('invalid')}
        </span>
      </div>
      {validation.errors.length > 0 ? (
        <ul>
          {validation.errors.map((err: ValidationError, i: number) => (
            <li key={i}>{t(err.key, err.params) as string}</li>
          ))}
        </ul>
      ) : (
        <p>{t('validationFormatSuccess')}</p>
      )}
    </div>
  );
}

export default DeckValidationBadge;
