import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Card } from '../types/Card';
import { getCardImageUrl } from '../utils/deckGrouping';
import { DeckRelatedToken } from '../types/Deck';
import { DeckZone, PrintZoneFilter } from '../types/enums';

/** Resolves the printable image URL for a specific card face, falling back to the deck grouping helper. */
export function resolveFaceImageUrl(card: Card, faceIndex: number): string {
  const imageUris =
    faceIndex === 0 ? (card.image_uris ?? card.card_faces?.[0]?.image_uris) : card.card_faces?.[faceIndex]?.image_uris;
  const baseUrl = imageUris ? imageUris.normal || imageUris.large || '' : '';
  return faceIndex === 0 && card.selectedPrintImageUri ? card.selectedPrintImageUri : baseUrl || getCardImageUrl(card);
}

export type SpacingOption = 'none' | 'small' | 'large';
export type CuttingGuide = 'none' | 'solid' | 'dotted';
export type PageSizeOption = 'a4' | 'a5' | 'letter' | 'legal';
export type OrientationOption = 'portrait' | 'landscape';

export const CARDS_PER_ROW_OPTIONS = [2, 3, 4, 6, 8] as const;

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

interface UseProxyPrintArgs {
  cards: Card[];
  deckRelatedTokens: DeckRelatedToken[];
  defaultZone: DeckZone;
}

/** All state, layout math, and the print routine for the proxy-print modal. */
export function useProxyPrint({ cards, deckRelatedTokens, defaultZone }: UseProxyPrintArgs) {
  const [useRealSize, setUseRealSize] = useState<boolean>(true);
  const [spacing, setSpacing] = useState<SpacingOption>('small');
  const [cuttingGuide, setCuttingGuide] = useState<CuttingGuide>('dotted');
  const [cardsPerRow, setCardsPerRow] = useState<number>(3);
  const [zoneFilter, setZoneFilter] = useState<PrintZoneFilter>(
    (defaultZone as unknown as PrintZoneFilter) || PrintZoneFilter.ALL
  );
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

  const cardsPerPage = useMemo(() => calculatedColumns * calculatedRows, [calculatedColumns, calculatedRows]);

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

  const estimatedPages = useMemo(
    () => Math.ceil(facesToPrint.length / cardsPerPage),
    [facesToPrint.length, cardsPerPage]
  );

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

  return {
    useRealSize,
    setUseRealSize,
    spacing,
    setSpacing,
    cuttingGuide,
    setCuttingGuide,
    cardsPerRow,
    setCardsPerRow,
    zoneFilter,
    setZoneFilter,
    pageSize,
    setPageSize,
    orientation,
    setOrientation,
    isPrinting,
    printRootRef,
    tokenCards,
    mainCards,
    sideboardCards,
    maybeboardCards,
    calculatedColumns,
    calculatedRows,
    cardsPerPage,
    cssGridGapValue,
    printGridGapValue,
    borderStyle,
    facesToPrint,
    chunkedCards,
    estimatedPages,
    currentPaperWidthMm,
    currentPaperHeightMm,
    handlePrint
  };
}
