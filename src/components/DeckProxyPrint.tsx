import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPrint, FaTimes, FaCog } from 'react-icons/fa';
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

const CARDS_PER_ROW_OPTIONS = [2, 3, 4] as const;

type PageSizeOption = 'a4' | 'a5' | 'letter' | 'legal';
type OrientationOption = 'portrait' | 'landscape';

const CSS_PAGE_SIZE_MAP: Record<PageSizeOption, string> = {
  a4: 'A4',
  a5: 'A5',
  letter: 'letter',
  legal: 'legal'
};

const getCardsPerPage = (size: PageSizeOption, orient: OrientationOption, spacingOpt: SpacingOption) => {
  const paperDims = {
    a4: { w: 210, h: 297 },
    a5: { w: 148, h: 210 },
    letter: { w: 216, h: 279 },
    legal: { w: 216, h: 356 }
  };
  const dims = paperDims[size];
  const paperW = orient === 'portrait' ? dims.w : dims.h;
  const paperH = orient === 'portrait' ? dims.h : dims.w;

  const margins = 20; // 10mm margins on both sides
  const usableW = paperW - margins;
  const usableH = paperH - margins;

  const spacingMm = spacingOpt === 'none' ? 0 : spacingOpt === 'small' ? 2.5 : 6;

  const cols = Math.floor((usableW + spacingMm) / (63 + spacingMm));
  const rows = Math.floor((usableH + spacingMm) / (88 + spacingMm));

  return Math.max(1, cols * rows);
};

function DeckProxyPrint({ isOpen, onClose, cards, deckName }: DeckProxyPrintProps) {
  const { t } = useTranslation();
  const [spacing, setSpacing] = useState<SpacingOption>('small');
  const [cuttingGuide, setCuttingGuide] = useState<CuttingGuide>('dotted');
  const [cardsPerRow, setCardsPerRow] = useState<number>(3);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('portrait');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const filteredCards = useMemo(() => {
    if (zoneFilter === 'all') return cards;
    if (zoneFilter === 'main') return cards.filter((c) => !c.zone || c.zone === 'main');
    return cards.filter((c) => c.zone === 'sideboard');
  }, [cards, zoneFilter]);

  const cardsPerPage = useMemo(() => {
    return getCardsPerPage(pageSize, orientation, spacing);
  }, [pageSize, orientation, spacing]);

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

  const handlePrint = () => {
    // Inject print-specific styles and trigger native print dialog
    const style = document.createElement('style');
    style.id = 'proxy-print-override';
    const cssSize = `${CSS_PAGE_SIZE_MAP[pageSize]} ${orientation}`;
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #proxy-print-root { display: block !important; }
        @page {
          size: ${cssSize};
          margin: 10mm;
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
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              <FaTimes />
            </button>
          </div>

          {/* Settings bar */}
          <div className="proxy-settings-bar flex-wrap">
            <FaCog className="text-gray-400 text-sm shrink-0" />

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
                <option value="a5">{t('paperSizeA5', 'A5')}</option>
                <option value="letter">{t('paperSizeLetter')}</option>
                <option value="legal">{t('paperSizeLegal', 'US Legal')}</option>
              </select>
            </div>

            {/* Orientation selector */}
            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('orientation', 'Orientation')}</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                className="proxy-select"
              >
                <option value="portrait">{t('portrait', 'Portrait')}</option>
                <option value="landscape">{t('landscape', 'Landscape')}</option>
              </select>
            </div>

            {/* Cards per row */}
            <div className="proxy-setting-group">
              <label className="proxy-setting-label">{t('cardsPerRow')}</label>
              <div className="flex gap-1">
                {CARDS_PER_ROW_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
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

          {/* Preview area */}
          <div className="proxy-preview-scroll">
            <div
              ref={printAreaRef}
              className="proxy-card-grid"
              style={{
                gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)`,
                gap: gapValue
              }}
            >
              {filteredCards.map((card, index) => {
                const imgUrl = card.selectedPrintImageUri || getCardImageUrl(card);
                return (
                  <div
                    key={`${card.id}-${index}`}
                    className="proxy-card-cell"
                    style={{
                      border: borderStyle,
                      borderRadius: cuttingGuide !== 'none' ? '4px' : '0'
                    }}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={card.name} className="proxy-card-image" loading="lazy" />
                    ) : (
                      <div className="proxy-card-placeholder">
                        <span className="text-xs text-gray-400 text-center px-2">{card.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
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
          padding: '8mm',
          boxSizing: 'border-box'
        }}
      >
        <p style={{ fontSize: '10px', color: '#999', marginBottom: '4mm', fontFamily: 'system-ui, sans-serif' }}>
          {deckName || 'MTG Deck Forge'} — Proxy Print
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: printGapValue,
            justifyContent: 'flex-start',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {filteredCards.map((card, index) => {
            const imgUrl = card.selectedPrintImageUri || getCardImageUrl(card);
            return (
              <div
                key={`print-${card.id}-${index}`}
                style={{
                  width: '63mm',
                  height: '88mm',
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
      </div>
    </>
  );
}

export default DeckProxyPrint;
