import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaPrint, FaTimes, FaCog, FaInfoCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { Card } from '../types/Card';
import { getCardImageUrl } from '../utils/deckGrouping';
import { DeckRelatedToken } from '../types/Deck';
import { DeckZone, PrintZoneFilter } from '../types/enums';

interface DeckProxyPrintProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  deckName?: string;
  deckRelatedTokens?: DeckRelatedToken[];
  defaultZone?: DeckZone;
}

type SpacingOption = 'none' | 'small' | 'large';
type CuttingGuide = 'none' | 'solid' | 'dotted';

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

const PAPER_DIMENSIONS_MM = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
  letter: { width: 216, height: 279 },
  legal: { width: 216, height: 356 }
};

function DeckProxyPrint({ isOpen, onClose, cards, deckRelatedTokens = [], defaultZone = DeckZone.MAIN }: DeckProxyPrintProps) {
  const { t } = useTranslation();
  const [useRealSize, setUseRealSize] = useState<boolean>(true);
  const [spacing, setSpacing] = useState<SpacingOption>('small');
  const [cuttingGuide, setCuttingGuide] = useState<CuttingGuide>('dotted');
  const [cardsPerRow, setCardsPerRow] = useState<number>(3);
  const [zoneFilter, setZoneFilter] = useState<PrintZoneFilter>(defaultZone as unknown as PrintZoneFilter || PrintZoneFilter.ALL);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('portrait');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const printRootRef = useRef<HTMLDivElement>(null);

  const tokenCards = useMemo(
    () => deckRelatedTokens.map((relatedToken) => relatedToken.tokenCard),
    [deckRelatedTokens]
  );

  const mainCards = useMemo(() => cards.filter((card) => !card.zone || card.zone === DeckZone.MAIN), [cards]);

  const sideboardCards = useMemo(() => cards.filter((card) => card.zone === DeckZone.SIDEBOARD), [cards]);

  const maybeboardCards = useMemo(() => cards.filter((card) => card.zone === DeckZone.MAYBEBOARD), [cards]);

  const filteredCards = useMemo(() => {
    switch (zoneFilter) {
      case PrintZoneFilter.MAIN:
        return mainCards;
      case PrintZoneFilter.SIDEBOARD:
        return sideboardCards;
      case PrintZoneFilter.MAYBEBOARD:
        return maybeboardCards;
      case PrintZoneFilter.TOKENS:
        return tokenCards;
      case PrintZoneFilter.MAIN_TOKENS:
        return [...mainCards, ...tokenCards];
      case PrintZoneFilter.MAIN_SIDEBOARD:
        return [...mainCards, ...sideboardCards];
      case PrintZoneFilter.MAIN_MAYBEBOARD:
        return [...mainCards, ...maybeboardCards];
      case PrintZoneFilter.SIDEBOARD_MAYBEBOARD:
        return [...sideboardCards, ...maybeboardCards];
      case PrintZoneFilter.MAIN_SIDEBOARD_MAYBEBOARD:
        return [...mainCards, ...sideboardCards, ...maybeboardCards];
      default:
        return [...cards, ...tokenCards]; // 'all'
    }
  }, [cards, zoneFilter, tokenCards, mainCards, sideboardCards, maybeboardCards]);

  const calculatedColumns = useMemo(() => {
    if (useRealSize) {
      const currentPaperDimensions = PAPER_DIMENSIONS_MM[pageSize];
      const paperWidthMm = orientation === 'portrait' ? currentPaperDimensions.width : currentPaperDimensions.height;
      const leftRightMarginsMm = 10; // 5mm margins on left + right
      const usableWidthMm = paperWidthMm - leftRightMarginsMm;
      return Math.max(1, Math.floor(usableWidthMm / 63));
    }
    return cardsPerRow;
  }, [useRealSize, pageSize, orientation, cardsPerRow]);

  const calculatedRows = useMemo(() => {
    const currentPaperDimensions = PAPER_DIMENSIONS_MM[pageSize];
    const paperHeightMm = orientation === 'portrait' ? currentPaperDimensions.height : currentPaperDimensions.width;
    const topBottomMarginsMm = 10; // 5mm margins on top + bottom
    const usableHeightMm = paperHeightMm - topBottomMarginsMm;

    if (useRealSize) {
      return Math.max(1, Math.floor(usableHeightMm / 88));
    }

    const paperWidthMm = orientation === 'portrait' ? currentPaperDimensions.width : currentPaperDimensions.height;
    const leftRightMarginsMm = 10;
    const usableWidthMm = paperWidthMm - leftRightMarginsMm;
    const spacingMarginMm = spacing === 'none' ? 0 : spacing === 'small' ? 2.5 : 6;

    const totalGapWidth = spacingMarginMm * (cardsPerRow - 1);
    const cardWidthMm = (usableWidthMm - totalGapWidth) / cardsPerRow;
    const cardHeightMm = cardWidthMm * (88 / 63);

    const rowsThatFit = Math.floor((usableHeightMm + spacingMarginMm) / (cardHeightMm + spacingMarginMm) + 0.05);
    return Math.max(1, rowsThatFit);
  }, [useRealSize, pageSize, orientation, spacing, cardsPerRow]);

  const cardsPerPage = useMemo(() => {
    return calculatedColumns * calculatedRows;
  }, [calculatedColumns, calculatedRows]);

  useEffect(() => {
    if (useRealSize) {
      setCardsPerRow(calculatedColumns);
    }
  }, [useRealSize, calculatedColumns]);

  const cssGridGapValue = SPACING_MAP[spacing];
  const printGridGapValue = PRINT_SPACING_MAP[spacing];

  const borderStyle = useMemo(() => {
    if (cuttingGuide === 'none') return 'none';
    if (cuttingGuide === 'solid') return '1px solid #aaa';
    return '1px dashed #aaa';
  }, [cuttingGuide]);

  const facesToPrint = useMemo(() => {
    const faces: { card: Card; faceIndex: number; id: string }[] = [];
    filteredCards.forEach((card) => {
      faces.push({ card, faceIndex: 0, id: `${card.id}-front` });
      if (card.card_faces && card.card_faces.length > 1 && card.card_faces[1].image_uris) {
        faces.push({ card, faceIndex: 1, id: `${card.id}-back` });
      }
    });
    return faces;
  }, [filteredCards]);

  const chunkedCards = useMemo(() => {
    const cardChunks: { card: Card; faceIndex: number; id: string }[][] = [];
    const chunkSize = cardsPerPage;
    for (let index = 0; index < facesToPrint.length; index += chunkSize) {
      cardChunks.push(facesToPrint.slice(index, index + chunkSize));
    }
    return cardChunks;
  }, [facesToPrint, cardsPerPage]);

  const estimatedPages = useMemo(() => {
    return Math.ceil(facesToPrint.length / cardsPerPage);
  }, [facesToPrint.length, cardsPerPage]);

  const currentPaperWidthMm = PAPER_DIMENSIONS_MM[pageSize].width;
  const currentPaperHeightMm = PAPER_DIMENSIONS_MM[pageSize].height;

  const handlePrint = useCallback(async () => {
    setIsPrinting(true);

    const waitForImagesToLoad = (): Promise<void> => {
      const printRootElement = printRootRef.current;
      if (!printRootElement) return Promise.resolve();
      const imageElements = Array.from(printRootElement.querySelectorAll('img'));
      const pendingImages = imageElements.filter((imgElement) => !imgElement.complete);
      if (pendingImages.length === 0) return Promise.resolve();
      return new Promise((resolve) => {
        let loadedImagesCount = 0;
        const handleImageLoadOrError = () => {
          loadedImagesCount++;
          if (loadedImagesCount >= pendingImages.length) resolve();
        };
        pendingImages.forEach((imgElement) => {
          imgElement.addEventListener('load', handleImageLoadOrError, { once: true });
          imgElement.addEventListener('error', handleImageLoadOrError, { once: true });
        });
        setTimeout(resolve, 8000);
      });
    };

    await waitForImagesToLoad();

    const style = document.createElement('style');
    style.id = 'proxy-print-override';
    const cssSize = `${CSS_PAGE_SIZE_MAP[pageSize]} ${orientation}`;
    style.textContent = `
      @media print {
        html, body {
          height: auto !important;
          min-height: 100% !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        body > *:not(#proxy-print-root) {
          display: none !important;
        }
        #proxy-print-root {
          display: block !important;
          position: static !important;
          width: auto !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          visibility: visible !important;
        }
        #proxy-print-root * { visibility: visible !important; }
        @page {
          size: ${cssSize};
          margin: 0mm;
        }
      }
    `;
    document.head.appendChild(style);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setTimeout(() => {
          const styleElement = document.getElementById('proxy-print-override');
          if (styleElement) styleElement.remove();
          setIsPrinting(false);
        }, 500);
      });
    });
  }, [pageSize, orientation]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay animate-fadeIn" style={{ zIndex: 9999 }}>
        <div className="proxy-modal-container">
          <div className="modal-header-container">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">
              <FaPrint className="text-blue-500" />
              {t('print.printProxiesTitle')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          <div className="proxy-settings-bar flex-wrap">
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700 mr-2">
              <FaCog className="text-gray-400 text-sm shrink-0" />
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useRealSize}
                  onChange={(e) => setUseRealSize(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-750 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer bg-white dark:bg-gray-800"
                />
                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {t('print.printRealSize')}
                </span>
              </label>
            </div>

            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('print.selectZoneToPrint')}</label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as PrintZoneFilter)}
                className="proxy-select"
              >
                <optgroup label={t('print.printGroupSingle')}>
                  <option value={PrintZoneFilter.ALL}>{t('print.printZoneAll')}</option>
                  <option
                    value={PrintZoneFilter.MAIN}
                    label={
                      mainCards.length > 0 ? t('deck.printFilters.mainCount', { count: mainCards.length }) : t('deck.printFilters.main')
                    }
                  />
                  <option
                    value={PrintZoneFilter.SIDEBOARD}
                    label={
                      sideboardCards.length > 0 ? t('deck.printFilters.sideboardCount', { count: sideboardCards.length }) : t('deck.printFilters.sideboard')
                    }
                  />
                  <option
                    value={PrintZoneFilter.MAYBEBOARD}
                    label={
                      maybeboardCards.length > 0 ? t('deck.printFilters.maybeboardCount', { count: maybeboardCards.length }) : t('deck.printFilters.maybeboard')
                    }
                  />
                  {tokenCards.length > 0 && <option value={PrintZoneFilter.TOKENS}>{t('print.printZoneTokens')}</option>}
                </optgroup>
                <optgroup label={t('print.printGroupCombined')}>
                  {mainCards.length > 0 && sideboardCards.length > 0 && (
                    <option
                      value={PrintZoneFilter.MAIN_SIDEBOARD}
                      label={t('deck.printFilters.mainAndSideCount', { count: mainCards.length + sideboardCards.length })}
                    />
                  )}
                  {mainCards.length > 0 && tokenCards.length > 0 && (
                    <option value={PrintZoneFilter.MAIN_TOKENS}>{t('print.printZoneMainTokens')}</option>
                  )}
                  {mainCards.length > 0 && maybeboardCards.length > 0 && (
                    <option
                      value={PrintZoneFilter.MAIN_MAYBEBOARD}
                      label={t('deck.printFilters.mainAndMaybeCount', { count: mainCards.length + maybeboardCards.length })}
                    />
                  )}
                  {sideboardCards.length > 0 && maybeboardCards.length > 0 && (
                    <option
                      value={PrintZoneFilter.SIDEBOARD_MAYBEBOARD}
                      label={t('deck.printFilters.sideAndMaybeCount', { count: sideboardCards.length + maybeboardCards.length })}
                    />
                  )}
                  {sideboardCards.length > 0 && maybeboardCards.length > 0 && mainCards.length > 0 && (
                    <option
                      value={PrintZoneFilter.MAIN_SIDEBOARD_MAYBEBOARD}
                      label={t('deck.printFilters.mainSideMaybeCount', {
                        count: mainCards.length + sideboardCards.length + maybeboardCards.length
                      })}
                    />
                  )}
                </optgroup>
              </select>
            </div>

            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('print.paperSize')}</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                className="proxy-select"
              >
                <option value="a4">{t('print.paperSizeA4')}</option>
                <option value="a5">{t('print.paperSizeA5')}</option>
                <option value="letter">{t('print.paperSizeLetter')}</option>
                <option value="legal">{t('print.paperSizeLegal')}</option>
              </select>
            </div>

            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('print.orientation')}</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                className="proxy-select"
              >
                <option value="portrait">{t('print.portrait')}</option>
                <option value="landscape">{t('print.landscape')}</option>
              </select>
            </div>

            <div
              className={`proxy-setting-group transition-all duration-200 ${useRealSize ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <label className="proxy-setting-label">{t('print.cardsPerRow')}</label>
              <div className="flex gap-1">
                {CARDS_PER_ROW_OPTIONS.map((cardsPerRowOption) => (
                  <button
                    key={cardsPerRowOption}
                    type="button"
                    disabled={useRealSize}
                    onClick={() => setCardsPerRow(cardsPerRowOption)}
                    className={`proxy-option-btn ${cardsPerRow === cardsPerRowOption ? 'proxy-option-btn-active' : ''}`}
                  >
                    {cardsPerRowOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('print.printSpacing')}</label>
              <div className="flex gap-1">
                {(['none', 'small', 'large'] as SpacingOption[]).map((spacingOptionValue) => (
                  <button
                    key={spacingOptionValue}
                    type="button"
                    onClick={() => setSpacing(spacingOptionValue)}
                    className={`proxy-option-btn ${spacing === spacingOptionValue ? 'proxy-option-btn-active' : ''}`}
                  >
                    {t(
                      `spacing${spacingOptionValue.charAt(0).toUpperCase() + spacingOptionValue.slice(1)}` as
                      | 'spacingNone'
                      | 'spacingSmall'
                      | 'spacingLarge'
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('print.cuttingGuide')}</label>
              <div className="flex gap-1">
                {(['none', 'solid', 'dotted'] as CuttingGuide[]).map((guideOption) => (
                  <button
                    key={guideOption}
                    type="button"
                    onClick={() => setCuttingGuide(guideOption)}
                    className={`proxy-option-btn ${cuttingGuide === guideOption ? 'proxy-option-btn-active' : ''}`}
                  >
                    {t(
                      guideOption === 'none'
                        ? 'cuttingGuideNone'
                        : guideOption === 'solid'
                          ? 'cuttingGuideLine'
                          : 'cuttingGuideDotted'
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {useRealSize ? (
            <div className="mx-6 my-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex flex-col sm:flex-row gap-3 items-start sm:items-center text-xs animate-fadeIn">
              <FaInfoCircle className="text-blue-500 shrink-0 text-lg" />
              <div className="flex-1 text-gray-700 dark:text-gray-300">
                <strong>{t('print.realSizeGuaranteed')} (63x88mm):</strong> {t('print.printInstructionsText')}{' '}
                <strong className="text-gray-900 dark:text-white underline">{t('print.scaleOption')}</strong>{' '}
                {t('print.printInstructionsTextSuffix')}
              </div>
              <div className="text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded">
                {cardsPerPage} {t('print.cardsPerPageTextSuffix')}
              </div>
            </div>
          ) : (
            <div className="mx-6 my-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex flex-col sm:flex-row gap-3 items-start sm:items-center text-xs animate-fadeIn">
              <FaExclamationTriangle className="text-amber-500 shrink-0 text-lg" />
              <div className="flex-1 text-gray-700 dark:text-gray-300">
                <strong>{t('print.customSizeLabel')}</strong> {t('print.customSizeWarning')}
              </div>
              <div className="text-amber-700 dark:text-amber-300 font-medium whitespace-nowrap bg-amber-100 dark:bg-amber-800/50 px-2 py-1 rounded">
                {cardsPerPage} {t('print.cardsPerPageSimple')}
              </div>
            </div>
          )}

          <div className="proxy-preview-scroll">
            <div className="flex flex-col items-center gap-8 py-6 bg-slate-900/10 dark:bg-slate-950/20 rounded-xl p-4">
              {chunkedCards.length === 0 ? (
                <div className="text-gray-500 py-12">{t('search.noResults')}</div>
              ) : (
                chunkedCards.map((pageCards, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="bg-white text-slate-950 shadow-2xl border border-gray-300 dark:border-slate-800 relative flex flex-col shrink-0 select-none rounded-lg p-6 transition-all duration-300 transform hover:scale-[1.01]"
                    style={{
                      width: orientation === 'portrait' ? '170mm' : '240mm',
                      aspectRatio: orientation === 'portrait' ? '210/297' : '297/210',
                      padding: '5mm',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span className="absolute -top-3 -left-3 bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-md z-10 select-none">
                      PÁG. {pageIndex + 1} / {estimatedPages}
                    </span>

                    <div
                      className="grid w-full h-full"
                      style={{
                        gridTemplateColumns: `repeat(${calculatedColumns}, 1fr)`,
                        gridTemplateRows: useRealSize
                          ? `repeat(${calculatedRows}, minmax(0, 1fr))`
                          : `repeat(${calculatedRows}, max-content)`,
                        alignContent: useRealSize ? 'center' : 'start',
                        gap: cssGridGapValue,
                        justifyContent: 'center'
                      }}
                    >
                      {pageCards.map(({ card, faceIndex }, cardIndex) => {
                        const imageUris =
                          faceIndex === 0
                            ? (card.image_uris ?? card.card_faces?.[0]?.image_uris)
                            : card.card_faces?.[faceIndex]?.image_uris;
                        const baseUrl = imageUris ? imageUris.normal || imageUris.large || '' : '';
                        const cardImageUrl =
                          faceIndex === 0 && card.selectedPrintImageUri
                            ? card.selectedPrintImageUri
                            : baseUrl || getCardImageUrl(card);
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
                            {cardImageUrl ? (
                              <img src={cardImageUrl} alt={card.name} className="proxy-card-image" />
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
              {facesToPrint.length} {t('common.cards')} &bull; {t('print.estimatedPages')}{' '}
              <span className="font-bold text-gray-700 dark:text-gray-300">{estimatedPages}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isPrinting}
              className="secondary-button text-xs py-2 px-4"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="primary-button text-xs py-2 px-4 flex items-center gap-2"
            >
              {isPrinting ? (
                <FaSpinner className="text-xs shrink-0 animate-spin" />
              ) : (
                <FaPrint className="text-xs shrink-0" />
              )}
              {isPrinting ? t('print.preparing') : t('print.printAll')}
            </button>
          </div>
        </div>
      </div>

      {/* Print-only DOM node — visible to browser (so images load) but invisible on screen */}
      {createPortal(
        <div
          ref={printRootRef}
          id="proxy-print-root"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            background: 'white',
            zIndex: -1,
            pointerEvents: 'none',
            visibility: 'hidden'
          }}
        >
          {chunkedCards.map((pageCards, pageIndex) => (
            <div
              key={pageIndex}
              className="print-page"
              style={{
                width: orientation === 'portrait' ? `${currentPaperWidthMm}mm` : `${currentPaperHeightMm}mm`,
                height: orientation === 'portrait' ? `${currentPaperHeightMm}mm` : `${currentPaperWidthMm}mm`,
                padding: '5mm',
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                breakAfter: 'page',
                display: 'grid',
                gridTemplateColumns: useRealSize
                  ? `repeat(${calculatedColumns}, 63mm)`
                  : `repeat(${calculatedColumns}, 1fr)`,
                gridTemplateRows: useRealSize
                  ? `repeat(${calculatedRows}, 88mm)`
                  : `repeat(${calculatedRows}, max-content)`,
                alignContent: useRealSize ? 'center' : 'start',
                gap: useRealSize ? printGridGapValue : cssGridGapValue,
                justifyContent: 'center',
                background: 'white',
                overflow: 'hidden'
              }}
            >
              {pageCards.map(({ card, faceIndex, id }, cardIndex) => {
                const imageUris =
                  faceIndex === 0
                    ? (card.image_uris ?? card.card_faces?.[0]?.image_uris)
                    : card.card_faces?.[faceIndex]?.image_uris;
                const baseUrl = imageUris ? imageUris.normal || imageUris.large || '' : '';
                const cardImageUrl =
                  faceIndex === 0 && card.selectedPrintImageUri
                    ? card.selectedPrintImageUri
                    : baseUrl || getCardImageUrl(card);

                return (
                  <div
                    key={`print-${id}-${cardIndex}`}
                    style={{
                      width: useRealSize ? '63mm' : '100%',
                      height: useRealSize ? '88mm' : 'auto',
                      aspectRatio: useRealSize ? 'auto' : '63/88',
                      boxSizing: 'border-box',
                      border: borderStyle,
                      borderRadius: cuttingGuide !== 'none' ? '1.5mm' : '0',
                      overflow: 'hidden',
                      breakInside: 'avoid',
                      background: '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      alignSelf: 'center'
                    }}
                  >
                    {cardImageUrl ? (
                      <img
                        src={cardImageUrl}
                        alt={card.name}
                        loading="eager"
                        decoding="sync"
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
        </div>,
        document.body
      )}
    </>
  );
}

export default DeckProxyPrint;
