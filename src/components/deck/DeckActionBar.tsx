import { useTranslation } from 'react-i18next';
import { FaCopy, FaDownload, FaDiceD20, FaEdit, FaTimes } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { Deck } from '../../types/Deck';

interface DeckActionBarProps {
  cards: Card[];
  selectedDeck?: Deck | null;
  showToast: (text: string) => void;
  onPlaytest: () => void;
  /** Mostrado apenas quando há deck selecionado */
  onLoadDeckToEdit?: () => void;
  onDeselectDeck?: () => void;
}

function DeckActionBar({
  cards,
  selectedDeck,
  showToast,
  onPlaytest,
  onLoadDeckToEdit,
  onDeselectDeck
}: DeckActionBarProps) {
  const { t } = useTranslation();

  const handleCopyDeckList = () => {
    if (cards.length === 0) return;
    const counts: Record<string, number> = {};
    cards.forEach((c) => {
      counts[c.name] = (counts[c.name] || 0) + 1;
    });
    const listStr = Object.entries(counts)
      .map(([name, count]) => `${count} ${name}`)
      .join('\n');
    navigator.clipboard.writeText(listStr).then(() => showToast(t('listCopied')));
  };

  const handleCopyArenaFormat = () => {
    if (cards.length === 0) return;
    const counts: Record<string, { count: number; card: Card }> = {};
    cards.forEach((c) => {
      if (counts[c.name]) counts[c.name].count += 1;
      else counts[c.name] = { count: 1, card: c };
    });
    const arenaStr = Object.values(counts)
      .map(({ count, card }) => {
        const setCode = card.set
          ? card.set.toUpperCase()
          : card.set_name
            ? card.set_name.substring(0, 3).toUpperCase()
            : 'SET';
        const collNum = card.id ? card.id.substring(0, 3) : '1';
        return `${count} ${card.name} (${setCode}) ${collNum}`;
      })
      .join('\n');
    navigator.clipboard.writeText(arenaStr).then(() => showToast(t('exportArenaCopied')));
  };

  const handleDownloadDecFile = () => {
    if (cards.length === 0) return;
    const counts: Record<string, number> = {};
    cards.forEach((c) => {
      counts[c.name] = (counts[c.name] || 0) + 1;
    });
    const decContent = Object.entries(counts)
      .map(([name, count]) => `${count} ${name}`)
      .join('\r\n');
    const blob = new Blob([decContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDeck?.name || 'deck'}.dec`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('deckExported'));
  };

  if (cards.length === 0 && !selectedDeck) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {cards.length > 0 && (
        <>
          <button
            type="button"
            onClick={handleCopyDeckList}
            className="purple-button text-xs py-1.5 px-3"
            title={t('copyList')}
          >
            <FaCopy className="text-[10px] shrink-0" />
            {t('copyList')}
          </button>
          <button
            type="button"
            onClick={handleCopyArenaFormat}
            className="purple-button text-xs py-1.5 px-3"
            title={t('exportArena')}
          >
            <FaCopy className="text-[10px] shrink-0" />
            {t('exportArena')}
          </button>
          <button
            type="button"
            onClick={handleDownloadDecFile}
            className="purple-button text-xs py-1.5 px-3"
            title={t('downloadDec')}
          >
            <FaDownload className="text-[10px] shrink-0" />
            {t('downloadDec')}
          </button>
          <button
            id="playtest-btn"
            type="button"
            onClick={onPlaytest}
            className="success-button text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 font-semibold animate-pulse"
            title={t('playtest')}
          >
            <FaDiceD20 className="text-[10px] shrink-0" />
            {t('playtest')}
          </button>
        </>
      )}

      {selectedDeck && onLoadDeckToEdit && (
        <button type="button" onClick={onLoadDeckToEdit} className="primary-button text-sm">
          <FaEdit className="text-xs shrink-0" />
          {t('edit')}
        </button>
      )}

      {onDeselectDeck && (
        <button type="button" onClick={onDeselectDeck} className="secondary-button text-sm">
          <FaTimes className="text-xs shrink-0" />
          {t('cancel')}
        </button>
      )}
    </div>
  );
}

export default DeckActionBar;
