import { useTranslation } from 'react-i18next';
import { LuBan, LuCircleX, LuCrown, LuTriangleAlert } from 'react-icons/lu';

interface CardItemStatusBadgesProps {
  readonly isCommander: boolean;
  readonly isBanned: boolean;
  readonly isRestricted: boolean;
  readonly isInvalid: boolean;
  readonly isInactiveToken: boolean;
}

/** The top-corner overlay badges: commander crown, banned/restricted/invalid, inactive token. */
export function CardItemStatusBadges({
  isCommander,
  isBanned,
  isRestricted,
  isInvalid,
  isInactiveToken
}: CardItemStatusBadgesProps) {
  const { t } = useTranslation();

  return (
    <>
      {isCommander && (
        <div className="absolute top-2 left-2 z-10 bg-warning dark:bg-warning/90 backdrop-blur-sm text-on-warning px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-lg border border-warning flex items-center gap-1 animate-pulse select-none">
          <LuCrown className="text-warning text-xs shrink-0 animate-pulse" />
          {t('cardDetails.commanderBadge')}
        </div>
      )}

      {isBanned && (
        <div className="absolute top-2 right-2 z-10 bg-danger backdrop-blur-sm text-on-danger px-2.5 py-0.5 rounded-full text-[9px] font-semibold shadow-lg border border-danger flex items-center gap-1 select-none">
          <LuBan className="text-white text-[9px] shrink-0 animate-spin-slow" />
          {t('cardDetails.banned')}
        </div>
      )}

      {isRestricted && (
        <div className="absolute top-2 right-2 z-10 bg-warning dark:bg-warning/90 backdrop-blur-sm text-on-warning px-2.5 py-0.5 rounded-full text-[9px] font-semibold shadow-lg border border-warning flex items-center gap-1 select-none">
          <LuTriangleAlert className="text-white text-[9px] shrink-0" />
          {t('cardDetails.restricted')}
        </div>
      )}

      {isInvalid && (
        <div
          title={t('cardDetails.invalidInFormatHint')}
          className="absolute top-2 right-2 z-10 bg-surface-3 backdrop-blur-sm text-fg px-2.5 py-0.5 rounded-full text-[9px] font-semibold shadow-lg border border-accent/50 flex items-center gap-1 select-none"
        >
          <LuCircleX className="text-white text-[9px] shrink-0" />
          {t('cardDetails.invalidInFormat')}
        </div>
      )}

      {isInactiveToken && (
        <div className="absolute top-2 left-2 z-10 bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-sm text-slate-350 dark:text-slate-400 px-2 py-0.5 rounded-md text-[9px] font-semibold shadow-md border border-slate-700/60 flex items-center gap-1 select-none">
          <span className="w-1 h-1 rounded-full bg-slate-400" />
          {t('common.inactive')}
        </div>
      )}
    </>
  );
}
