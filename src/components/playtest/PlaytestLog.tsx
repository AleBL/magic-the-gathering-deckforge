import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaFileAlt } from 'react-icons/fa';
import { usePlaytestContext } from './PlaytestContext';

export const PlaytestLog: React.FC = () => {
  const { t } = useTranslation();
  const { isLogOpen, lifeLog, setLifeLog } = usePlaytestContext();

  if (!isLogOpen) return null;

  return (
    <div className="w-72 border-l border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/30 flex flex-col h-full shrink-0 animate-slide-in no-active-scale">
      <div className="p-3 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center bg-white dark:bg-slate-950/50">
        <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 select-none">
          <FaFileAlt className="text-indigo-500 dark:text-indigo-400 text-xs" />
          {t('playtest.playtestLog')}
        </h4>
        <button
          type="button"
          onClick={() => setLifeLog([])}
          className="text-[9px] text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase font-bold cursor-pointer"
        >
          {t('playtest.clearLog')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px] select-text">
        {lifeLog.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-600 italic text-center py-8 select-none">
            {t('playtest.playtestLogEmpty')}
          </p>
        ) : (
          [...lifeLog].reverse().map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/20 p-1 rounded transition-colors border-b border-slate-200 dark:border-slate-850/30"
            >
              <span className="text-slate-400 dark:text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
              <span className="text-slate-700 dark:text-slate-300 break-words leading-tight">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
