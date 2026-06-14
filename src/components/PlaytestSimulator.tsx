import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaTimes,
  FaUndo,
  FaArrowRight,
  FaInbox,
  FaDiceD20,
  FaCheck,
  FaExclamationTriangle,
  FaSkull,
  FaSync,
  FaPlus,
  FaMinus,
  FaInfoCircle,
  FaFileAlt,
  FaLayerGroup
} from 'react-icons/fa';
import { Card } from '../types/Card';
import { DeckRelatedToken } from '../types/Deck';
import CardDetailModal from './CardDetailModal';
import { PlaytestTokenModal } from './PlaytestTokenModal';
import cardBack from '../assets/card-back.jpg';

interface PlaytestSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  deckCards: Card[];
  deckFormat?: string;
  deckRelatedTokens?: DeckRelatedToken[];
}

interface PlaytestCard {
  playtestId: string; // Unique ID to track card instances independently in simulator
  card: Card;
  isTapped: boolean;
}

interface LogEntry {
  id: string;
  text: string;
  timestamp: string;
}

function PlaytestSimulator({ isOpen, onClose, deckCards, deckFormat, deckRelatedTokens }: PlaytestSimulatorProps) {
  const { t } = useTranslation();
  const [library, setLibrary] = useState<PlaytestCard[]>([]);
  const [hand, setHand] = useState<PlaytestCard[]>([]);
  const [battlefield, setBattlefield] = useState<PlaytestCard[]>([]);
  const [graveyard, setGraveyard] = useState<PlaytestCard[]>([]);
  const [lifeTotal, setLifeTotal] = useState(20);
  const [mulligans, setMulligans] = useState(0);
  const [isMulliganPhase, setIsMulliganPhase] = useState(false);
  const [selectedToBottom, setSelectedToBottom] = useState<Set<string>>(new Set()); // Stores playtestId values
  const [, setIsGraveyardOpen] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<Card | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const activeDeckTokens = deckRelatedTokens || [];

  // Turn, Phase, and Life Log states
  const [turn, setTurn] = useState(1);
  const [lifeLog, setLifeLog] = useState<LogEntry[]>([]);
  const [prevLifeTotal, setPrevLifeTotal] = useState<number | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(true);

  // Fisher-Yates Shuffle algorithm with highly descriptive variables
  const shuffleDeck = (cards: PlaytestCard[]): PlaytestCard[] => {
    const shuffledCards = [...cards];

    for (let currentIndex = shuffledCards.length - 1; currentIndex > 0; currentIndex--) {
      const randomIndex = Math.floor(Math.random() * (currentIndex + 1));

      // Traditional swap utilizing an explicit temporary variable to avoid array destructuring confusion
      const temporaryCardHolder = shuffledCards[currentIndex];
      shuffledCards[currentIndex] = shuffledCards[randomIndex];
      shuffledCards[randomIndex] = temporaryCardHolder;
    }

    return shuffledCards;
  };

  // Maps standard Cards to wrapper PlaytestCards
  const mapToPlaytestCards = (cards: Card[]): PlaytestCard[] => {
    return cards.map((card, index) => ({
      playtestId: `${card.id}-${index}-${Math.random().toString(36).substring(2, 9)}`,
      card,
      isTapped: false
    }));
  };

  const logAction = useCallback((text: string) => {
    setLifeLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
  }, []);

  const startSimulation = useCallback(() => {
    if (deckCards.length === 0) return;
    const mappedCards = mapToPlaytestCards(deckCards);
    const shuffled = shuffleDeck(mappedCards);
    const initialHand = shuffled.slice(0, 7);
    const initialLibrary = shuffled.slice(7);

    setHand(initialHand);
    setLibrary(initialLibrary);
    setBattlefield([]);
    setGraveyard([]);
    const initialLife = deckFormat === 'commander' ? 40 : 20;
    setLifeTotal(initialLife);
    setPrevLifeTotal(initialLife);
    setMulligans(0);
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());
    setIsGraveyardOpen(false);

    setTurn(1);
    setLifeLog([
      {
        id: 'start',
        text: t('gameStartedLog'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
  }, [deckCards, deckFormat, t]);

  // Start simulation when modal opens
  useEffect(() => {
    if (isOpen) {
      startSimulation();
    }
  }, [isOpen, startSimulation]);

  // Life total change log listener
  useEffect(() => {
    if (prevLifeTotal !== null && prevLifeTotal !== lifeTotal) {
      logAction(t('lifeChangedLog', { from: prevLifeTotal, to: lifeTotal }));
    }
    setPrevLifeTotal(lifeTotal);
  }, [lifeTotal, prevLifeTotal, logAction, t]);

  const handleMulligan = () => {
    const nextMulligans = mulligans + 1;
    const mappedCards = mapToPlaytestCards(deckCards);
    const shuffled = shuffleDeck(mappedCards);

    // London Mulligan: Draw exactly 7 cards, then we must choose 'nextMulligans' cards to put on bottom
    const initialHand = shuffled.slice(0, 7);
    const initialLibrary = shuffled.slice(7);

    setHand(initialHand);
    setLibrary(initialLibrary);
    setBattlefield([]);
    setGraveyard([]);
    setMulligans(nextMulligans);
    setIsMulliganPhase(true);
    setSelectedToBottom(new Set());
    setIsGraveyardOpen(false);

    logAction(t('mulliganLog', { cards: 7 }));
  };

  const handleToggleCardSelection = (playtestId: string) => {
    if (!isMulliganPhase) return;

    setSelectedToBottom((prevSelectedToBottom) => {
      const nextSelectedToBottom = new Set(prevSelectedToBottom);
      if (nextSelectedToBottom.has(playtestId)) {
        nextSelectedToBottom.delete(playtestId);
      } else {
        // Limit selection to exactly the number of mulligans taken
        if (nextSelectedToBottom.size < mulligans) {
          nextSelectedToBottom.add(playtestId);
        }
      }
      return nextSelectedToBottom;
    });
  };

  const handleConfirmMulligan = () => {
    if (selectedToBottom.size !== mulligans) return;

    // Separate hand cards: keep non-selected, send selected to bottom of library
    const cardsToKeep: PlaytestCard[] = [];
    const cardsToBottom: PlaytestCard[] = [];

    hand.forEach((item) => {
      if (selectedToBottom.has(item.playtestId)) {
        cardsToBottom.push(item);
      } else {
        cardsToKeep.push(item);
      }
    });

    setHand(cardsToKeep);
    setLibrary((previousLibrary) => [...previousLibrary, ...cardsToBottom]);
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());

    logAction(t('keptHandLog') + ` (London Mulligan para ${7 - mulligans} cartas)`);
  };

  const handleKeepHand = () => {
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());
    logAction(t('keptHandLog') + ` (${7 - mulligans} cartas)`);
  };

  const handleDrawCard = useCallback(() => {
    setLibrary((previousLibrary) => {
      if (previousLibrary.length === 0) return previousLibrary;
      const nextCard = previousLibrary[0];
      setHand((previousHand) => [...previousHand, nextCard]);
      const cardName = nextCard.card.printed_name || nextCard.card.name;
      logAction(t('drewCardLog', { name: cardName }));
      return previousLibrary.slice(1);
    });
  }, [logAction, t]);

  const handleShuffleLibrary = useCallback(() => {
    setLibrary((prevLibrary) => {
      if (prevLibrary.length === 0) return prevLibrary;
      const shuffled = shuffleDeck(prevLibrary);
      logAction(t('shuffleLibraryLog'));
      return shuffled;
    });
  }, [logAction, t]);

  // Move card from hand to battlefield
  const handlePlayCard = useCallback(
    (playtestId: string) => {
      setHand((previousHand) => {
        const targetCard = previousHand.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousHand;
        setBattlefield((previousBattlefield) => [...previousBattlefield, { ...targetCard, isTapped: false }]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(t('playedCardLog', { name: cardName }));
        return previousHand.filter((item) => item.playtestId !== playtestId);
      });
    },
    [logAction, t]
  );

  // Toggle Tap / Untap card on battlefield
  const handleToggleTapCard = useCallback(
    (playtestId: string) => {
      setBattlefield((previousBattlefield) => {
        const targetCard = previousBattlefield.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousBattlefield;
        const isTapped = !targetCard.isTapped;
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(isTapped ? t('tappedCardLog', { name: cardName }) : t('untappedCardLog', { name: cardName }));
        return previousBattlefield.map((item) => (item.playtestId === playtestId ? { ...item, isTapped } : item));
      });
    },
    [logAction, t]
  );

  // Move card from battlefield to graveyard
  const handleSendToGraveyard = useCallback(
    (playtestId: string) => {
      setBattlefield((previousBattlefield) => {
        const targetCard = previousBattlefield.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousBattlefield;
        setGraveyard((previousGraveyard) => [targetCard, ...previousGraveyard]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(t('graveyardCardLog', { name: cardName }));
        return previousBattlefield.filter((item) => item.playtestId !== playtestId);
      });
    },
    [logAction, t]
  );

  // Discard card from hand directly to graveyard
  const handleDiscardFromHand = useCallback(
    (playtestId: string) => {
      setHand((previousHand) => {
        const targetCard = previousHand.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousHand;
        setGraveyard((previousGraveyard) => [targetCard, ...previousGraveyard]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(t('discardedCardLog', { name: cardName }));
        return previousHand.filter((item) => item.playtestId !== playtestId);
      });
    },
    [logAction, t]
  );

  // Return card to hand from either battlefield or graveyard
  const handleReturnToHand = useCallback(
    (playtestId: string, fromZone: 'battlefield' | 'graveyard') => {
      if (fromZone === 'battlefield') {
        setBattlefield((previousBattlefield) => {
          const targetCard = previousBattlefield.find((item) => item.playtestId === playtestId);
          if (!targetCard) return previousBattlefield;
          setHand((previousHand) => [...previousHand, { ...targetCard, isTapped: false }]);
          const cardName = targetCard.card.printed_name || targetCard.card.name;
          logAction(t('returnedHandLog', { name: cardName }));
          return previousBattlefield.filter((item) => item.playtestId !== playtestId);
        });
      } else {
        setGraveyard((previousGraveyard) => {
          const targetCard = previousGraveyard.find((item) => item.playtestId === playtestId);
          if (!targetCard) return previousGraveyard;
          setHand((previousHand) => [...previousHand, { ...targetCard, isTapped: false }]);
          const cardName = targetCard.card.printed_name || targetCard.card.name;
          logAction(t('returnedHandLog', { name: cardName }));
          return previousGraveyard.filter((item) => item.playtestId !== playtestId);
        });
      }
    },
    [logAction, t]
  );

  // Untap all permanents on the battlefield
  const handleUntapAll = useCallback(() => {
    setBattlefield((previousBattlefield) => {
      if (previousBattlefield.length === 0) return previousBattlefield;
      logAction(t('untappedAllLog'));
      return previousBattlefield.map((item) => ({ ...item, isTapped: false }));
    });
  }, [logAction, t]);

  const handleSummonToken = useCallback(
    (tokenCard: Card) => {
      const uniquePlaytestId = `${tokenCard.id}-${Math.random().toString(36).substring(2, 9)}`;
      setBattlefield((previousBattlefield) => [
        ...previousBattlefield,
        {
          playtestId: uniquePlaytestId,
          card: tokenCard,
          isTapped: false
        }
      ]);
      setIsTokenModalOpen(false);
      const tokenName = tokenCard.printed_name || tokenCard.name;
      logAction(t('createdTokenLog', { name: tokenName }));
    },
    [logAction, t]
  );

  const handleNextTurn = useCallback(() => {
    setTurn((prevTurn) => {
      const nextTurn = prevTurn + 1;

      // Untap all
      setBattlefield((prevBattlefield) => prevBattlefield.map((item) => ({ ...item, isTapped: false })));

      // Draw card
      setLibrary((prevLibrary) => {
        let drawnCardName = '';
        if (prevLibrary.length > 0) {
          const nextCard = prevLibrary[0];
          drawnCardName = nextCard.card.printed_name || nextCard.card.name;
          setHand((prevHand) => [...prevHand, nextCard]);
        }

        // Logs
        logAction(t('turnStartedLog', { turn: nextTurn }));
        logAction(t('untappedAllLog'));
        if (drawnCardName) {
          logAction(t('drewCardLog', { name: drawnCardName }));
        }

        return prevLibrary.slice(1);
      });

      return nextTurn;
    });
  }, [logAction, t]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'd') {
        e.preventDefault();
        handleDrawCard();
      } else if (key === 's') {
        e.preventDefault();
        handleShuffleLibrary();
      } else if (key === 't') {
        e.preventDefault();
        handleNextTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleDrawCard, handleShuffleLibrary, handleNextTurn]);

  const getCardImageUrl = (card: Card): string => {
    // Prioritize the selected print art chosen in the deck editor
    if (card.selectedPrintImageUri) return card.selectedPrintImageUri;
    if (card.image_uris?.gatherer) return card.image_uris.gatherer;
    const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
    if (!imageUris) return '';
    return imageUris.normal || imageUris.large || '';
  };

  const remainingToSelect = mulligans - selectedToBottom.size;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaDiceD20 className="text-blue-500 text-xl animate-spin-slow" />
              <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">{t('playtestSimulator')}</h3>
            </div>

            {/* Glowing Life Total Counter */}
            <div className="flex items-center bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-1 shadow-inner gap-2">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t('life')}:</span>
              <button
                type="button"
                onClick={() => setLifeTotal((prev) => prev - 1)}
                className="w-5 h-5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
              >
                <FaMinus className="text-[8px]" />
              </button>
              <span className="text-sm font-extrabold text-white w-6 text-center select-none font-mono drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                {lifeTotal}
              </span>
              <button
                type="button"
                onClick={() => setLifeTotal((prev) => prev + 1)}
                className="w-5 h-5 rounded bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all text-xs font-bold"
              >
                <FaPlus className="text-[8px]" />
              </button>
            </div>

            {/* Turn Counter */}
            {!isMulliganPhase && (
              <div className="flex items-center bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-1 shadow-inner gap-2">
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">
                  {t('turnLabel', { turn })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Stats info */}
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <FaInbox className="text-slate-500" />
                {t('library')}: <strong className="text-slate-200">{library.length}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <FaCheck className="text-slate-500" />
                {t('hand')}: <strong className="text-slate-200">{hand.length}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <FaSkull className="text-slate-500" />
                {t('graveyard')}: <strong className="text-slate-200">{graveyard.length}</strong>
              </span>
              {mulligans > 0 && (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Mulligan: <strong>{mulligans}</strong>
                </span>
              )}
            </div>

            {/* Toggle Log button */}
            <button
              type="button"
              onClick={() => setIsLogOpen((prev) => !prev)}
              title={t('toggleLogPanel')}
              className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                isLogOpen
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaFileAlt className="text-xs shrink-0" />
              <span className="hidden md:inline font-bold">{t('playtestLog')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-all focus:outline-none cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Mulligan Warning Banner */}
        {isMulliganPhase && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
              <FaExclamationTriangle className="text-amber-500 shrink-0" />
              <span>
                {t(
                  'mulliganPhaseBanner',
                  'Mulligan {{mulligans}}: Select {{count}} card(s) from your hand to put to the bottom.'
                )
                  .replace('{{mulligans}}', String(mulligans))
                  .replace('{{count}}', String(remainingToSelect))}
              </span>
            </span>
            <div className="flex items-center gap-2 justify-center">
              {mulligans > 0 && remainingToSelect === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmMulligan}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold px-4 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FaCheck />
                  {t('confirmMulligan')}
                </button>
              )}
              <button
                type="button"
                onClick={handleKeepHand}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                {t('keepHand')}
              </button>
            </div>
          </div>
        )}

        {/* Split Sandbox and Log Panels */}
        <div className="flex-1 flex flex-row overflow-hidden min-h-[480px]">
          {/* Main Simulator Workspace */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950/20 flex flex-col gap-6">
            {/* Deck pile + Battlefield Area */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Shuffled library pile & Graveyard */}
              <div className="flex flex-row lg:flex-col gap-4 items-center justify-center p-4 border border-slate-800/40 rounded-xl bg-slate-900/30 w-full lg:w-48 shrink-0">
                {/* Library Pile */}
                <div
                  onClick={handleDrawCard}
                  className={`group relative w-24 aspect-[5/7] sm:w-28 sm:h-40 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-500/30 hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 select-none ${library.length === 0 ? 'opacity-30 border-slate-700 pointer-events-none' : ''}`}
                >
                  {library.length > 0 ? (
                    <>
                      {/* Card back image */}
                      <img
                        src={cardBack}
                        alt="MTG Card Back"
                        className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] object-cover rounded-[10px]"
                      />
                      <span className="absolute bottom-3 text-[10px] uppercase font-black tracking-widest text-white bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-xs group-hover:bg-slate-950/90 transition-colors shadow shadow-black/30">
                        {t('draw').toUpperCase()}
                      </span>
                      <div className="absolute -top-2 -right-2 bg-indigo-600 text-white font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 shadow shadow-indigo-500/40 z-10">
                        {library.length}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-slate-500">{t('empty').toUpperCase()}</span>
                  )}
                </div>

                {/* Graveyard Pile */}
                <div
                  onClick={() => graveyard.length > 0 && setIsGraveyardOpen(true)}
                  className={`group relative w-24 aspect-[5/7] sm:w-28 sm:h-40 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 select-none ${graveyard.length > 0 ? 'border-slate-700 hover:border-red-500/60 hover:shadow-red-500/5 bg-slate-950 hover:-translate-y-1 cursor-pointer' : 'border-dashed border-slate-800 bg-slate-950/20 pointer-events-none'}`}
                >
                  {graveyard.length > 0 ? (
                    <>
                      <img
                        src={getCardImageUrl(graveyard[0].card)}
                        alt="Graveyard Top"
                        className="w-full h-full object-cover rounded-2xl opacity-40 group-hover:opacity-30 group-hover:scale-98 transition-all"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                        <FaSkull className="text-red-500/70 text-lg mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] uppercase font-black tracking-widest text-slate-350">
                          {t('graveyard').toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-slate-800 text-slate-300 font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 shadow">
                        {graveyard.length}
                      </div>
                    </>
                  ) : (
                    <>
                      <FaSkull className="text-slate-800 text-lg mb-1" />
                      <span className="text-[8px] uppercase font-black tracking-widest text-slate-650">
                        {t('graveyard').toUpperCase()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Battlefield zone */}
              <div className="flex-1 border border-slate-800/60 rounded-2xl p-4 bg-slate-900/10 min-h-[300px] flex flex-col">
                <div className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-3 flex items-center justify-between select-none">
                  <div>{t('battlefield')}</div>
                </div>

                {battlefield.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 pointer-events-none w-full mx-auto">
                    <p className="text-sm text-slate-500 font-semibold italic">{t('emptyBattlefieldMessage')}</p>
                    <p className="text-xs text-slate-600 mt-1">{t('playCardsHint')}</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-wrap gap-4 items-center justify-center p-2 relative z-10">
                    {battlefield.map((playtestCard) => {
                      const { playtestId, card, isTapped } = playtestCard;
                      const imageUrl = getCardImageUrl(card);

                      return (
                        <div
                          key={playtestId}
                          className="group relative transition-all duration-300 flex items-center justify-center"
                        >
                          <div className="relative w-24 aspect-[5/7] sm:w-28 sm:h-40 flex items-center justify-center">
                            <div
                              onClick={() => handleToggleTapCard(playtestId)}
                              className={`absolute w-full h-full rounded-xl overflow-hidden shadow-lg border bg-slate-900 cursor-pointer select-none transition-all duration-300 ${isTapped ? 'border-amber-500/80 ring-2 ring-amber-500/30 rotate-90 scale-90' : 'border-slate-800 hover:scale-105 hover:border-indigo-500'}`}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={card.name}
                                  className="w-full h-full object-cover pointer-events-none"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full p-2 flex flex-col justify-between text-left">
                                  <span className="text-[9px] font-bold text-slate-200 leading-tight line-clamp-3">
                                    {card.printed_name || card.name}
                                  </span>
                                  <span className="text-[7px] text-slate-400 capitalize">{t(card.rarity)}</span>
                                </div>
                              )}

                              {isTapped && (
                                <div className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 text-[6px] font-extrabold px-1 rounded shadow uppercase tracking-wider animate-pulse">
                                  {t('tapped').toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 z-30 bg-slate-900/95 border border-slate-700/80 rounded-full px-2 py-1 shadow-2xl backdrop-blur-sm no-active-scale">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailCard(card);
                              }}
                              title={t('viewCardDetails')}
                              className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-blue-400 border border-slate-700 hover:bg-blue-500 hover:text-white transition-all text-[9px] cursor-pointer"
                            >
                              <FaInfoCircle />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTapCard(playtestId);
                              }}
                              title={t('tapUntap')}
                              className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-amber-400 border border-slate-700 hover:bg-amber-500 hover:text-slate-950 transition-all text-[9px] cursor-pointer"
                            >
                              <FaSync />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReturnToHand(playtestId, 'battlefield');
                              }}
                              title={t('returnToHand')}
                              className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-indigo-400 border border-slate-700 hover:bg-indigo-500 hover:text-white transition-all text-[9px] cursor-pointer"
                            >
                              <FaInbox />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendToGraveyard(playtestId);
                              }}
                              title={t('sendToGraveyard')}
                              className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-red-400 border border-slate-700 hover:bg-red-500 hover:text-white transition-all text-[9px] cursor-pointer"
                            >
                              <FaSkull />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Shuffled hand cards grid */}
            <div className="border border-slate-800/60 rounded-2xl p-4 bg-slate-900/10">
              <div className="flex items-center justify-between mb-3 text-xs uppercase font-extrabold tracking-widest text-slate-500 select-none">
                <span>
                  {t('hand')} ({hand.length})
                </span>
                {!isMulliganPhase && hand.length > 0 && (
                  <span className="text-[10px] text-slate-600 normal-case font-normal">{t('clickCardHint')}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-center min-h-[170px] p-2 bg-slate-950/15 rounded-xl border border-slate-900/30">
                {hand.length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-4">{t('handEmpty')}</p>
                ) : (
                  <div className="flex flex-wrap gap-4 items-center justify-center">
                    {hand.map((playtestCard) => {
                      const { playtestId, card } = playtestCard;
                      const isSelected = selectedToBottom.has(playtestId);
                      const imageUrl = getCardImageUrl(card);

                      return (
                        <div key={playtestId} className="group relative">
                          <div
                            onClick={() => {
                              if (isMulliganPhase) {
                                handleToggleCardSelection(playtestId);
                              } else {
                                handlePlayCard(playtestId);
                              }
                            }}
                            className={`relative w-24 aspect-[5/7] sm:w-28 sm:h-40 rounded-xl overflow-hidden shadow-lg border bg-slate-900 transition-all duration-300 select-none cursor-pointer ${isMulliganPhase ? 'hover:border-amber-400' : 'hover:-translate-y-4 hover:scale-105 hover:border-indigo-500'} ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/50 scale-95 opacity-80' : 'border-slate-800'}`}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={card.name}
                                className="w-full h-full object-cover pointer-events-none"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full p-2 flex flex-col justify-between text-left">
                                <span className="text-[9px] font-bold text-slate-200 leading-tight line-clamp-3">
                                  {card.printed_name || card.name}
                                </span>
                                <span className="text-[7px] text-slate-400 capitalize">{t(card.rarity)}</span>
                              </div>
                            )}

                            {isMulliganPhase && (
                              <div
                                className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500/20' : 'bg-black/10 hover:bg-black/0'}`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs border ${isSelected ? 'bg-amber-500 border-amber-600 text-slate-950 animate-pulse' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}
                                >
                                  {isSelected ? '✓' : ''}
                                </div>
                              </div>
                            )}
                          </div>

                          {!isMulliganPhase && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDetailCard(card);
                                }}
                                title={t('viewCardDetails')}
                                className="absolute -top-2.5 -left-2 w-5.5 h-5.5 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 shadow-lg text-slate-400 hover:text-blue-400 hover:border-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-[8px] cursor-pointer"
                              >
                                <FaInfoCircle />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDiscardFromHand(playtestId);
                                }}
                                title={t('discardCard')}
                                className="absolute -top-2.5 -right-2 w-5.5 h-5.5 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 shadow-lg text-slate-400 hover:text-red-400 hover:border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-[8px] cursor-pointer"
                              >
                                <FaSkull />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNextTurn}
                  disabled={isMulliganPhase}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2 px-5 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  title={`${t('nextTurn')} (T)`}
                >
                  <FaArrowRight className="text-[10px]" />
                  {t('nextTurn')}
                </button>

                <button
                  type="button"
                  onClick={handleDrawCard}
                  disabled={library.length === 0 || isMulliganPhase}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2 px-5 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <FaLayerGroup className="text-[10px]" />
                  {t('drawCard')}
                </button>

                <button
                  type="button"
                  onClick={handleShuffleLibrary}
                  disabled={library.length === 0 || isMulliganPhase}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <FaDiceD20 className="text-[10px]" />
                  {t('shuffle')}
                </button>

                <button
                  type="button"
                  onClick={handleUntapAll}
                  disabled={battlefield.length === 0 || isMulliganPhase}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <FaSync className="text-[10px]" />
                  {t('untapAll')}
                </button>

                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(true)}
                  disabled={isMulliganPhase}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <FaPlus className="text-[10px]" />
                  {t('summonToken')}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMulligan}
                  disabled={deckCards.length === 0 || isMulliganPhase}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-2 px-5 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <FaUndo className="text-[10px] rotate-90" />
                  {t('mulligan')}
                </button>
                <button
                  type="button"
                  onClick={startSimulation}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FaUndo className="text-[10px]" />
                  {t('resetSimulator')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Game Log Drawer */}
          {isLogOpen && (
            <div className="w-72 border-l border-slate-800/80 bg-slate-950/30 flex flex-col h-full shrink-0 animate-slide-in no-active-scale">
              <div className="p-3 border-b border-slate-850 flex justify-between items-center bg-slate-950/50">
                <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5 select-none">
                  <FaFileAlt className="text-indigo-400 text-xs" />
                  {t('playtestLog')}
                </h4>
                <button
                  type="button"
                  onClick={() => setLifeLog([])}
                  className="text-[9px] text-slate-500 hover:text-red-400 transition-colors uppercase font-bold cursor-pointer"
                >
                  {t('clearLog')}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px] select-text">
                {lifeLog.length === 0 ? (
                  <p className="text-slate-600 italic text-center py-8 select-none">Sem registros ainda</p>
                ) : (
                  [...lifeLog].reverse().map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-1.5 hover:bg-slate-800/20 p-1 rounded transition-colors border-b border-slate-850/30"
                    >
                      <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className="text-slate-300 break-words leading-tight">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <PlaytestTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSelectToken={handleSummonToken}
        deckRelatedTokens={activeDeckTokens}
      />

      {selectedDetailCard && (
        <CardDetailModal
          card={selectedDetailCard}
          imageUrl={getCardImageUrl(selectedDetailCard)}
          onClose={() => setSelectedDetailCard(null)}
          hidePrintsSidebar={true}
          hidePriceAndLegality={true}
        />
      )}
    </div>
  );
}

export default PlaytestSimulator;
