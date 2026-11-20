import { ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDatabase, FaDownload, FaExclamationTriangle, FaLock, FaUpload } from 'react-icons/fa';
import { useProfileBackup } from '../../hooks/useProfileBackup';
import { ProfileBackup } from '../../services/profileBackup';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};

export default function BackupPanel() {
  const { t } = useTranslation();
  const { status, isWorking, exportBackup, readBackupFile, restoreBackup, enablePersistence } = useProfileBackup();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ProfileBackup | null>(null);
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setConfirmingReplace(false);
    setPending(await readBackupFile(file));
  };

  const run = async (mode: 'merge' | 'replace') => {
    if (!pending) return;
    if (await restoreBackup(pending, mode)) {
      setPending(null);
      setConfirmingReplace(false);
    }
  };

  const usage =
    status.usedBytes !== null && status.quotaBytes
      ? `${formatBytes(status.usedBytes)} / ${formatBytes(status.quotaBytes)}`
      : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-fg-muted leading-relaxed">{t('backup.description')}</p>

      <div className="rounded-xl border border-line p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-fg-secondary">
          <FaDatabase className="text-accent shrink-0 text-xs" />
          <span className="font-semibold">{t('backup.storageUsed')}</span>
          <span className="ml-auto tabular-nums">{usage ?? t('backup.unavailable')}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-fg-secondary">
          <FaLock className="text-accent shrink-0 text-xs" />
          <span className="font-semibold">{t('backup.persistence')}</span>
          <span className="ml-auto">
            {status.persisted === null
              ? t('backup.unavailable')
              : status.persisted
                ? t('backup.persistenceOn')
                : t('backup.persistenceOff')}
          </span>
        </div>

        {status.persisted === false ? (
          <>
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">{t('backup.persistenceHint')}</p>
            <button
              type="button"
              onClick={enablePersistence}
              className="self-start px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              {t('backup.enablePersistence')}
            </button>
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={exportBackup}
        disabled={isWorking}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <FaDownload className="text-xs shrink-0" />
        {t('backup.export')}
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isWorking}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-surface-1 text-fg-secondary border border-line hover:bg-surface-2 transition-colors disabled:opacity-50"
      >
        <FaUpload className="text-xs shrink-0" />
        {t('backup.chooseFile')}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFile}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {pending ? (
        <div className="rounded-xl border border-line p-3 flex flex-col gap-3">
          <p className="text-xs text-fg-secondary">
            {t('backup.fileSummary', {
              date: new Date(pending.exportedAt).toLocaleDateString(),
              decks: pending.decks.length,
              cards: pending.collection.length
            })}
          </p>

          <button
            type="button"
            onClick={() => run('merge')}
            disabled={isWorking}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t('backup.merge')}
          </button>
          <p className="text-xs text-fg-muted -mt-1">{t('backup.mergeHint')}</p>

          {/* Two steps on purpose: replace is the only action here that can destroy data. */}
          {confirmingReplace ? (
            <button
              type="button"
              onClick={() => run('replace')}
              disabled={isWorking}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              <FaExclamationTriangle className="text-xs shrink-0" />
              {t('backup.replaceConfirm')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReplace(true)}
              disabled={isWorking}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
            >
              {t('backup.replace')}
            </button>
          )}
          <p className="text-xs text-fg-muted -mt-1">{t('backup.replaceHint')}</p>
        </div>
      ) : null}
    </div>
  );
}
