import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuPlus } from 'react-icons/lu';
import { resolveCollectionCsvRows } from '../../services/collectionCsv';
import { mergeEntries } from '../../services/collectionService';
import { parseQuickAdd } from '../../utils/quickAddParse';
import { logger } from '../../utils/logger';

/**
 * Adds printings by set code and collector number, the two things printed on every card:
 * "mh3 123", "4 mh3 123" or several lines at once. It reuses the CSV resolver, so counts
 * add to what is already owned and missing printings are named back.
 */
function CollectionQuickAdd() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [report, setReport] = useState<{ tone: 'success' | 'warning' | 'error'; message: string } | null>(null);

  const lines = text.split('\n').length;

  const add = async () => {
    const { rows, invalid } = parseQuickAdd(text);
    if (rows.length === 0) {
      setReport({ tone: 'warning', message: t('collection.quickAddNothing') });
      return;
    }
    setIsAdding(true);
    setReport(null);
    try {
      const { entries, missing, failure, unreached } = await resolveCollectionCsvRows(rows);
      if (entries.length > 0) await mergeEntries(entries);
      const added = entries.reduce((total, entry) => total + entry.quantity, 0);
      const notFound = [...missing, ...invalid];
      if (unreached > 0 && entries.length === 0) {
        setReport({
          tone: 'error',
          message: failure === 'rateLimited' ? t('search.rateLimited') : t('search.scryfallUnavailable')
        });
      } else if (notFound.length > 0) {
        setReport({
          tone: 'warning',
          message: t('collection.quickAddPartial', { count: added, missing: notFound.join(', ') })
        });
      } else {
        setReport({ tone: 'success', message: t('collection.quickAddDone', { count: added }) });
        setText('');
      }
    } catch (error) {
      logger.error('Quick add failed:', error);
      setReport({ tone: 'error', message: t('collection.importError') });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-1 border border-line"
      onSubmit={(event) => {
        event.preventDefault();
        void add();
      }}
    >
      <label htmlFor="collection-quick-add" className="text-sm font-medium text-fg-secondary">
        {t('collection.quickAddLabel')}
      </label>
      <div className="flex items-start gap-2">
        <textarea
          id="collection-quick-add"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds a single line; Shift+Enter starts another line for a batch.
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void add();
            }
          }}
          rows={Math.min(Math.max(lines, 1), 6)}
          placeholder={t('collection.quickAddPlaceholder')}
          spellCheck={false}
          className="min-w-0 flex-1 resize-none rounded-lg border border-line-strong bg-surface-1 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-muted"
        />
        <button type="submit" className="primary-button" disabled={isAdding || text.trim() === ''}>
          <LuPlus aria-hidden="true" />
          {isAdding ? t('collection.quickAddAdding') : t('collection.quickAddButton')}
        </button>
      </div>
      <p className="text-xs text-fg-muted">{t('collection.quickAddHint')}</p>
      {report ? (
        <p
          role="status"
          className={`text-sm ${report.tone === 'success' ? 'text-success' : report.tone === 'warning' ? 'text-warning' : 'text-danger'}`}
        >
          {report.message}
        </p>
      ) : null}
    </form>
  );
}

export default CollectionQuickAdd;
