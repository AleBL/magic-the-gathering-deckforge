import { FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { ImportProgressData } from '../../services/deckImportService';

interface DeckImportProgressModalProps {
  isOpen: boolean;
  progress: ImportProgressData;
  missingCards: string[];
  errorMsg: string | null;
  onClose: () => void;
  onFinish?: () => void;
}

export default function DeckImportProgressModal({
  isOpen,
  progress,
  missingCards,
  errorMsg,
  onClose,
  onFinish
}: DeckImportProgressModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isComplete = !progress.isImporting && !errorMsg;
  const hasMissing = missingCards.length > 0;

  return (
    <div className="modal-overlay z-[var(--z-overlay)]">
      <div className="modal-container modal-container-small mx-auto p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {progress.isImporting ? (
              <FaSpinner className="animate-spin text-blue-500" />
            ) : errorMsg ? (
              <FaExclamationTriangle className="text-red-500" />
            ) : (
              <FaCheckCircle className="text-emerald-500" />
            )}
            {progress.isImporting
              ? t('deck.importingDeck')
              : errorMsg
                ? t('common.errorTitle')
                : t('deck.importComplete')}
          </h2>
          {!progress.isImporting && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>

        {errorMsg ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl mb-6">
            <p className="font-medium">{errorMsg}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2 font-medium text-slate-600 dark:text-slate-300">
                <span>{progress.message || t('common.loading')}</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {isComplete && hasMissing && (
              <div className="mb-6 animate-fadeIn">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
                    <FaExclamationTriangle />
                    {t('deck.importMissingCards')}
                  </h3>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      {missingCards.map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-warning dark:text-amber-500 mt-3 font-medium">
                    {t('deck.importMissingExplanation')}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {!progress.isImporting && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                onClose();
                if (onFinish && !errorMsg) onFinish();
              }}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                errorMsg
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              }`}
            >
              {errorMsg ? t('common.close') : t('common.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
