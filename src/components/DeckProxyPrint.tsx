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

const CARDS_PER_ROW_OPTIONS = [2, 3, 4] as const;

function DeckProxyPrint({ isOpen, onClose, cards, deckName }: DeckProxyPrintProps) {
  const { t } = useTranslation();
  const [spacing, setSpacing] = useState<SpacingOption>('small');
  const [cuttingGuide, setCuttingGuide] = useState<CuttingGuide>('dotted');
  const [cardsPerRow, setCardsPerRow] = useState<number>(3);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const filteredCards = useMemo(() => {
    if (zoneFilter === 'all') return cards;
    if (zoneFilter === 'main') return cards.filter((c) => !c.zone || c.zone === 'main');
    return cards.filter((c) => c.zone === 'sideboard');
  }, [cards, zoneFilter]);

  const gapValue = SPACING_MAP[spacing];

  const borderStyle = useMemo(() => {
    if (cuttingGuide === 'none') return 'none';
    if (cuttingGuide === 'solid') return '1px solid #aaa';
    return '1px dashed #aaa';
  }, [cuttingGuide]);

  const handlePrint = () => {
    // Inject print-specific styles and trigger native print dialog
    const style = document.createElement('style');
    style.id = 'proxy-print-override';
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #proxy-print-root { display: flex !important; }
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
          <div className="proxy-settings-bar">
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
                    {t(`spacing${s.charAt(0).toUpperCase() + s.slice(1)}` as
                      | 'spacingNone'
                      | 'spacingSmall'
                      | 'spacingLarge')}
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
                    {t(
                      g === 'none'
                        ? 'cuttingGuideNone'
                        : g === 'solid'
                          ? 'cuttingGuideLine'
                          : 'cuttingGuideDotted'
                    )}
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
                const imgUrl = getCardImageUrl(card);
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
                      <img
                        src={imgUrl}
                        alt={card.name}
                        className="proxy-card-image"
                        loading="lazy"
                      />
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
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
              {filteredCards.length} {t('cards')}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="secondary-button text-xs py-2 px-4"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="primary-button text-xs py-2 px-4"
            >
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
        <p style={{ fontSize: '10px', color: '#999', marginBottom: '4mm' }}>
          {deckName || 'MTG Deck Forge'} — Proxy Print
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)`,
            gap: gapValue
          }}
        >
          {filteredCards.map((card, index) => {
            const imgUrl = getCardImageUrl(card);
            return (
              <div
                key={`print-${card.id}-${index}`}
                style={{
                  aspectRatio: '5/7',
                  border: borderStyle,
                  borderRadius: cuttingGuide !== 'none' ? '4px' : '0',
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
                  <span style={{ fontSize: '8px', color: '#aaa', textAlign: 'center', padding: '4px' }}>
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
