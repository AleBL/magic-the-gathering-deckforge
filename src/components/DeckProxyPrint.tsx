import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPrint, FaTimes, FaCog, FaInfoCircle, FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';
import { Card } from '../types/Card';
import { getCardImageUrl } from '../utils/deckGrouping';

interface DeckProxyPrintProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  deckName?: string;
}

type SpacingOption = 'none' | 'small' | 'large';
type CuttingGuide = 'none' | 'solid' | 'dotted';
type ZoneFilter = 'all' | 'main' | 'sideboard';

const SPACING_MAP: Record<SpacingOption, string> = {
  none: '0px',
  small: '6px',
  large: '14px'
};

const PRINT_SPACING_MAP: Record<SpacingOption, string> = {
  none: '0mm',
  small: '2.5mm',
  large: '6mm'
};

const CARDS_PER_ROW_OPTIONS = [2, 3, 4, 6, 8] as const;

type PageSizeOption = 'a4' | 'a5' | 'letter' | 'legal';
type OrientationOption = 'portrait' | 'landscape';

const CSS_PAGE_SIZE_MAP: Record<PageSizeOption, string> = {
  a4: 'A4',
  a5: 'A5',
  letter: 'letter',
  legal: 'legal'
};

const paperDims = {
  a4: { w: 210, h: 297 },
  a5: { w: 148, h: 210 },
  letter: { w: 216, h: 279 },
  legal: { w: 216, h: 356 }
};

function DeckProxyPrint({ isOpen, onClose, cards }: DeckProxyPrintProps) {
  const { t } = useTranslation();
  const [useRealSize, setUseRealSize] = useState<boolean>(true);
  const [spacing, setSpacing] = useState<SpacingOption>('small');
  const [cuttingGuide, setCuttingGuide] = useState<CuttingGuide>('dotted');
  const [cardsPerRow, setCardsPerRow] = useState<number>(3);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('portrait');

  const filteredCards = useMemo(() => {
    if (zoneFilter === 'all') return cards;
    if (zoneFilter === 'main') return cards.filter((c) => !c.zone || c.zone === 'main');
    return cards.filter((c) => c.zone === 'sideboard');
  }, [cards, zoneFilter]);

  const cols = useMemo(() => {
    if (useRealSize) {
      const dims = paperDims[pageSize];
      const paperW = orientation === 'portrait' ? dims.w : dims.h;
      const margins = 20; // 10mm margins on left + right
      const usableW = paperW - margins;
      const spacingMm = spacing === 'none' ? 0 : spacing === 'small' ? 2.5 : 6;
      return Math.max(1, Math.floor((usableW + spacingMm) / (63 + spacingMm)));
    }
    return cardsPerRow;
  }, [useRealSize, pageSize, orientation, spacing, cardsPerRow]);

  const rows = useMemo(() => {
    if (useRealSize) {
      const dims = paperDims[pageSize];
      const paperH = orientation === 'portrait' ? dims.h : dims.w;
      const margins = 20; // 10mm margins on top + bottom
      const usableH = paperH - margins;
      const spacingMm = spacing === 'none' ? 0 : spacing === 'small' ? 2.5 : 6;
      return Math.max(1, Math.floor((usableH + spacingMm) / (88 + spacingMm)));
    }
    return 3; // default 3 rows for non-real size page chunking
  }, [useRealSize, pageSize, orientation, spacing]);

  const cardsPerPage = useMemo(() => {
    return cols * rows;
  }, [cols, rows]);

  const estimatedPages = useMemo(() => {
    return Math.ceil(filteredCards.length / cardsPerPage);
  }, [filteredCards.length, cardsPerPage]);

  const gapValue = SPACING_MAP[spacing];
  const printGapValue = PRINT_SPACING_MAP[spacing];

  const borderStyle = useMemo(() => {
    if (cuttingGuide === 'none') return 'none';
    if (cuttingGuide === 'solid') return '1px solid #aaa';
    return '1px dashed #aaa';
  }, [cuttingGuide]);

  const chunkedCards = useMemo(() => {
    const chunks: Card[][] = [];
    const size = cardsPerPage;
    for (let i = 0; i < filteredCards.length; i += size) {
      chunks.push(filteredCards.slice(i, i + size));
    }
    return chunks;
  }, [filteredCards, cardsPerPage]);

  const paperW = paperDims[pageSize].w;
  const paperH = paperDims[pageSize].h;

  const handlePrint = () => {
    // Inject print-specific styles and trigger native print dialog
    const style = document.createElement('style');
    style.id = 'proxy-print-override';
    const cssSize = `${CSS_PAGE_SIZE_MAP[pageSize]} ${orientation}`;
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #proxy-print-root { display: block !important; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; }
        @page {
          size: ${cssSize};
          margin: 0mm !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('proxy-print-override');
      if (el) el.remove();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Screen modal */}
      <div className="modal-overlay animate-fadeIn" style={{ zIndex: 9999 }}>
        <div className="proxy-modal-container">
          {/* Header */}
          <div className="modal-header-container">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">
              <FaPrint className="text-blue-500" />
              {t('printProxiesTitle')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          {/* Settings bar */}
          <div className="proxy-settings-bar flex-wrap">
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700 mr-2">
              <FaCog className="text-gray-400 text-sm shrink-0" />
              {/* Real Size Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useRealSize}
                  onChange={(e) => setUseRealSize(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-750 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer bg-white dark:bg-gray-800"
                />
                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {t('printRealSize')}
                </span>
              </label>
            </div>

            {/* Zone filter */}
            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('selectZoneToPrint')}</label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as ZoneFilter)}
                className="proxy-select"
              >
                <option value="all">{t('printZoneAll')}</option>
                <option value="main">{t('printZoneMain')}</option>
                <option value="sideboard">{t('printZoneSide')}</option>
              </select>
            </div>

            {/* Paper Size selector */}
            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('paperSize')}</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                className="proxy-select"
              >
                <option value="a4">{t('paperSizeA4')}</option>
                <option value="a5">{t('paperSizeA5')}</option>
                <option value="letter">{t('paperSizeLetter')}</option>
                <option value="legal">{t('paperSizeLegal')}</option>
              </select>
            </div>

            {/* Orientation selector */}
            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('orientation')}</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                className="proxy-select"
              >
                <option value="portrait">{t('portrait')}</option>
                <option value="landscape">{t('landscape')}</option>
              </select>
            </div>

            {/* Cards per row */}
            <div
              className={`proxy-setting-group transition-all duration-200 ${useRealSize ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <label className="proxy-setting-label">
                {t('cardsPerRow')}
                {useRealSize && (
                  <span className="text-[10px] text-blue-500 font-extrabold ml-1 font-mono">({cols})</span>
                )}
              </label>
              <div className="flex gap-1">
                {CARDS_PER_ROW_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={useRealSize}
                    onClick={() => setCardsPerRow(n)}
                    className={`proxy-option-btn ${cardsPerRow === n ? 'proxy-option-btn-active' : ''}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('printSpacing')}</label>
              <div className="flex gap-1">
                {(['none', 'small', 'large'] as SpacingOption[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpacing(s)}
                    className={`proxy-option-btn ${spacing === s ? 'proxy-option-btn-active' : ''}`}
                  >
                    {t(
                      `spacing${s.charAt(0).toUpperCase() + s.slice(1)}` as
                        | 'spacingNone'
                        | 'spacingSmall'
                        | 'spacingLarge'
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Cutting guide */}
            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('cuttingGuide')}</label>
              <div className="flex gap-1">
                {(['none', 'solid', 'dotted'] as CuttingGuide[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setCuttingGuide(g)}
                    className={`proxy-option-btn ${cuttingGuide === g ? 'proxy-option-btn-active' : ''}`}
                  >
                    {t(g === 'none' ? 'cuttingGuideNone' : g === 'solid' ? 'cuttingGuideLine' : 'cuttingGuideDotted')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info Banner for Real Size Printing */}
          <div className="mx-6 my-3 p-3.5 bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/15 rounded-xl text-left space-y-1.5 animate-fadeIn">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <FaInfoCircle className="text-blue-500 text-xs shrink-0" />
              {t('realSizeGuaranteed')}
            </h4>
            <div className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium flex items-start gap-1.5">
              <span>
                {t('realSizeDescription')}{' '}
                <strong className="text-gray-900 dark:text-white font-extrabold">63mm x 88mm</strong>{' '}
                {t('realSizeDescriptionSleeves')}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-gray-600 dark:text-gray-400 pt-2 border-t border-blue-500/10">
              <div className="flex items-start gap-1.5">
                <FaFileAlt className="text-gray-400 dark:text-gray-500 text-xs shrink-0 mt-0.5" />
                <span>
                  <strong className="text-gray-800 dark:text-gray-300">{t('pageYield')}:</strong>{' '}
                  {t('cardsPerPageText')}{' '}
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs">{cardsPerPage}</span>{' '}
                  {t('cardsPerPageTextSuffix')} (<span className="uppercase font-bold">{pageSize}</span> ·{' '}
                  {orientation === 'portrait' ? t('portrait') : t('landscape')}).
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <FaExclamationTriangle className="text-red-500 dark:text-red-400 text-xs shrink-0 mt-0.5" />
                <span>
                  <strong className="text-red-500 dark:text-red-400">{t('importantInstructions')}:</strong>{' '}
                  {t('printInstructionsText')}{' '}
                  <strong className="text-gray-800 dark:text-gray-300 underline font-bold">{t('scaleOption')}</strong>{' '}
                  {t('printInstructionsTextSuffix')}
                </span>
              </div>
            </div>
          </div>

          {/* Preview area */}
          <div className="proxy-preview-scroll">
            <div className="flex flex-col items-center gap-8 py-6 bg-slate-900/10 dark:bg-slate-950/20 rounded-xl p-4">
              {chunkedCards.length === 0 ? (
                <div className="text-gray-500 py-12">{t('noResults')}</div>
              ) : (
                chunkedCards.map((pageCards, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="bg-white text-slate-950 shadow-2xl border border-gray-300 dark:border-slate-800 relative flex flex-col shrink-0 select-none rounded-lg p-6 transition-all duration-300 transform hover:scale-[1.01]"
                    style={{
                      width: orientation === 'portrait' ? '170mm' : '240mm',
                      aspectRatio: orientation === 'portrait' ? '210/297' : '297/210',
                      padding: '10mm',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Page tag on screen */}
                    <span className="absolute -top-3 -left-3 bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-md z-10 select-none">
                      PÁG. {pageIndex + 1} / {estimatedPages}
                    </span>

                    <div
                      className="grid w-full h-full"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                        gap: gapValue,
                        justifyContent: 'center',
                        alignContent: 'center'
                      }}
                    >
                      {pageCards.map((card, cardIndex) => {
                        const imgUrl = card.selectedPrintImageUri || getCardImageUrl(card);
                        return (
                          <div
                            key={cardIndex}
                            className="proxy-card-cell border"
                            style={{
                              aspectRatio: '63/88',
                              border: borderStyle,
                              borderRadius: cuttingGuide !== 'none' ? '4px' : '0'
                            }}
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt={card.name} className="proxy-card-image" loading="lazy" />
                            ) : (
                              <div className="proxy-card-placeholder">
                                <span className="text-[10px] text-gray-400 text-center px-1 font-bold">
                                  {card.name}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer-container">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 text-left">
              {filteredCards.length} {t('cards')} &bull; {t('estimatedPages')}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-300">{estimatedPages}</span>
            </span>
            <button type="button" onClick={onClose} className="secondary-button text-xs py-2 px-4">
              {t('cancel')}
            </button>
            <button type="button" onClick={handlePrint} className="primary-button text-xs py-2 px-4">
              <FaPrint className="text-xs shrink-0" />
              {t('printAll')}
            </button>
          </div>
        </div>
      </div>

      {/* Print-only DOM node — always in DOM but hidden on screen */}
      <div
        id="proxy-print-root"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          background: 'white',
          zIndex: 99999,
          boxSizing: 'border-box'
        }}
      >
        {chunkedCards.map((pageCards, pageIndex) => (
          <div
            key={pageIndex}
            className="print-page"
            style={{
              width: orientation === 'portrait' ? `${paperW}mm` : `${paperH}mm`,
              height: orientation === 'portrait' ? `${paperH}mm` : `${paperW}mm`,
              padding: '10mm',
              boxSizing: 'border-box',
              pageBreakAfter: 'always',
              breakAfter: 'page',
              display: 'grid',
              gridTemplateColumns: useRealSize ? `repeat(${cols}, 63mm)` : `repeat(${cols}, 1fr)`,
              gridTemplateRows: useRealSize ? `repeat(${rows}, 88mm)` : `repeat(${rows}, 1fr)`,
              gap: useRealSize ? printGapValue : gapValue,
              justifyContent: 'center',
              alignContent: 'center',
              background: 'white',
              overflow: 'hidden'
            }}
          >
            {pageCards.map((card, cardIndex) => {
              const imgUrl = card.selectedPrintImageUri || getCardImageUrl(card);
              return (
                <div
                  key={`print-${card.id}-${cardIndex}`}
                  style={{
                    width: useRealSize ? '63mm' : '100%',
                    height: useRealSize ? '88mm' : '100%',
                    boxSizing: 'border-box',
                    border: borderStyle,
                    borderRadius: cuttingGuide !== 'none' ? '1.5mm' : '0',
                    overflow: 'hidden',
                    breakInside: 'avoid',
                    background: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={card.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '8px',
                        color: '#aaa',
                        textAlign: 'center',
                        padding: '4px',
                        fontFamily: 'system-ui, sans-serif'
                      }}
                    >
                      {card.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

export default DeckProxyPrint;
