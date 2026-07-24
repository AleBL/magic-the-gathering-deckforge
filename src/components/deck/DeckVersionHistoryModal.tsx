import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHistory, FaTimes, FaTrash, FaUndo, FaPlus } from 'react-icons/fa';
import { Deck, DeckVersion } from '../../types/Deck';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { saveDeckSnapshot, listDeckVersions, deleteDeckVersion } from '../../services/deckVersionService';

interface DeckVersionHistoryModalProps {
  deck: Deck;
  onRestore: (version: DeckVersion) => void;
  onClose: () => void;
}

/** Lists a deck's saved snapshots and lets the user snapshot, restore or delete them. */
export default function DeckVersionHistoryModal({ deck, onRestore, onClose }: DeckVersionHistoryModalProps) {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  useEscapeKey(onClose);

  const [versions, setVersions] = useState<DeckVersion[]>([]);

  const refresh = useCallback(() => {
    listDeckVersions(deck.id).then(setVersions);
  }, [deck.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSnapshot = async () => {
    await saveDeckSnapshot(deck);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteDeckVersion(id);
    refresh();
  };

  return (
    // Backdrop click is a mouse-only convenience; Escape and the close button cover keyboard users.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="modal-overlay z-[var(--z-overlay)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-history-title"
        className="modal-container sm:max-w-lg w-full overflow-y-auto animate-fadeIn"
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            id="deck-history-title"
            className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <FaHistory className="text-primary" />
            {t('deck.versionHistory')}
          </h3>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label={t('common.close')}>
            <FaTimes />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSnapshot}
          className="w-full min-h-11 flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-sm font-bold transition-all active:scale-[0.99] cursor-pointer"
        >
          <FaPlus className="text-xs shrink-0" />
          {t('deck.saveSnapshot')}
        </button>

        {versions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">{t('deck.noVersions')}</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700"
              >
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                    {new Date(version.createdAt).toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                    {t('deck.versionCards', { n: version.cards.length })}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRestore(version)}
                    className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer"
                  >
                    <FaUndo className="text-xs" />
                    {t('deck.restoreVersion')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(version.id)}
                    aria-label={t('deck.deleteVersion')}
                    className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
