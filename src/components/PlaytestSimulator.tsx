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
  FaInfoCircle
} from 'react-icons/fa';
import { Card } from '../types/Card';
import CardDetailModal from './CardDetailModal';
import { PlaytestTokenModal } from './PlaytestTokenModal';

interface PlaytestSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  deckCards: Card[];
  deckFormat?: string;
}

interface PlaytestCard {
  playtestId: string; // Unique ID to track card instances independently in simulator
  card: Card;
  isTapped: boolean;
}

function PlaytestSimulator({ isOpen, onClose, deckCards, deckFormat }: PlaytestSimulatorProps) {
  const { t } = useTranslation();
  const [library, setLibrary] = useState<PlaytestCard[]>([]);
  const [hand, setHand] = useState<PlaytestCard[]>([]);
  const [battlefield, setBattlefield] = useState<PlaytestCard[]>([]);
  const [graveyard, setGraveyard] = useState<PlaytestCard[]>([]);
  const [lifeTotal, setLifeTotal] = useState(20);
  const [mulligans, setMulligans] = useState(0);
  const [isMulliganPhase, setIsMulliganPhase] = useState(false);
  const [selectedToBottom, setSelectedToBottom] = useState<Set<string>>(new Set()); // Stores playtestId values
  const [isGraveyardOpen, setIsGraveyardOpen] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<Card | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const handleSummonToken = (tokenCard: Card) => {
    setBattlefield((previousBattlefield) => [
      ...previousBattlefield,
      {
        playtestId: tokenCard.id,
        card: tokenCard,
        isTapped: false
      }
    ]);
    setIsTokenModalOpen(false);
  };

  // Maps standard Cards to wrapper PlaytestCards
  const mapToPlaytestCards = (cards: Card[]): PlaytestCard[] => {
    return cards.map((card, index) => ({
      playtestId: `${card.id}-${index}-${Math.random().toString(36).substring(2, 9)}`,
      card,
      isTapped: false
    }));
  };

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
    setLifeTotal(deckFormat === 'commander' ? 40 : 20);
    setMulligans(0);
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());
    setIsGraveyardOpen(false);
  }, [deckCards, deckFormat]);

  // Start simulation when modal opens
  useEffect(() => {
    if (isOpen) {
      startSimulation();
    }
  }, [isOpen, startSimulation]);

  if (!isOpen) return null;

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
  };

  const handleDrawCard = () => {
    if (library.length === 0 || isMulliganPhase) return;

    const nextCard = library[0];
    setLibrary((previousLibrary) => previousLibrary.slice(1));
    setHand((previousHand) => [...previousHand, nextCard]);
  };

  const handleKeepHand = () => {
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());
  };

  // Move card from hand to battlefield
  const handlePlayCard = (playtestId: string) => {
    if (isMulliganPhase) return;

    const targetCard = hand.find((item) => item.playtestId === playtestId);
    if (!targetCard) return;

    setHand((previousHand) => previousHand.filter((item) => item.playtestId !== playtestId));
    setBattlefield((previousBattlefield) => [...previousBattlefield, { ...targetCard, isTapped: false }]);
  };

  // Toggle Tap / Untap card on battlefield
  const handleToggleTapCard = (playtestId: string) => {
    setBattlefield((previousBattlefield) =>
      previousBattlefield.map((item) => (item.playtestId === playtestId ? { ...item, isTapped: !item.isTapped } : item))
    );
  };

  // Move card from battlefield to graveyard
  const handleSendToGraveyard = (playtestId: string) => {
    const targetCard = battlefield.find((item) => item.playtestId === playtestId);
    if (!targetCard) return;

    setBattlefield((previousBattlefield) => previousBattlefield.filter((item) => item.playtestId !== playtestId));
    setGraveyard((previousGraveyard) => [targetCard, ...previousGraveyard]);
  };

  // Discard card from hand directly to graveyard
  const handleDiscardFromHand = (playtestId: string) => {
    if (isMulliganPhase) return;

    const targetCard = hand.find((item) => item.playtestId === playtestId);
    if (!targetCard) return;

    setHand((previousHand) => previousHand.filter((item) => item.playtestId !== playtestId));
    setGraveyard((previousGraveyard) => [targetCard, ...previousGraveyard]);
  };

  // Return card to hand from either battlefield or graveyard
  const handleReturnToHand = (playtestId: string, fromZone: 'battlefield' | 'graveyard') => {
    if (fromZone === 'battlefield') {
      const targetCard = battlefield.find((item) => item.playtestId === playtestId);
      if (!targetCard) return;

      setBattlefield((previousBattlefield) => previousBattlefield.filter((item) => item.playtestId !== playtestId));
      setHand((previousHand) => [...previousHand, { ...targetCard, isTapped: false }]);
    } else {
      const targetCard = graveyard.find((item) => item.playtestId === playtestId);
      if (!targetCard) return;

      setGraveyard((previousGraveyard) => previousGraveyard.filter((item) => item.playtestId !== playtestId));
      setHand((previousHand) => [...previousHand, { ...targetCard, isTapped: false }]);
    }
  };

  // Untap all permanents on the battlefield
  const handleUntapAll = () => {
    setBattlefield((previousBattlefield) => previousBattlefield.map((item) => ({ ...item, isTapped: false })));
  };

  const getCardImageUrl = (card: Card): string => {
    const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
    if (!imageUris) return '';
    if (card.image_uris?.gatherer) return card.image_uris.gatherer;
    return imageUris.normal || imageUris.large || '';
  };

  const remainingToSelect = mulligans - selectedToBottom.size;

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

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-all focus:outline-none"
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
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold px-4 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1"
                >
                  <FaCheck />
                  {t('confirmMulligan')}
                </button>
              )}
              <button
                type="button"
                onClick={handleKeepHand}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                {t('keepHand')}
              </button>
            </div>
          </div>
        )}

        {/* Main Simulator Workspace */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/20 flex flex-col gap-6 min-h-[480px]">
          {/* Deck pile + Battlefield Area */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Shuffled library pile & Graveyard */}
            <div className="flex flex-row lg:flex-col gap-4 items-center justify-center p-4 border border-slate-800/40 rounded-xl bg-slate-900/30 w-full lg:w-48 shrink-0">
              {/* Library pile card back */}
              <div className="flex flex-col items-center">
                <div
                  onClick={handleDrawCard}
                  className={`relative w-28 h-40 rounded-lg bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-indigo-500/40 shadow-2xl flex items-center justify-center cursor-pointer select-none group transition-all duration-300 hover:border-indigo-400 ${isMulliganPhase || library.length === 0 ? 'opacity-40 pointer-events-none' : 'hover:scale-105'}`}
                >
                  {/* Visual Card Back */}
                  <div className="absolute inset-1.5 border border-indigo-500/10 rounded-md flex flex-col items-center justify-center gap-1">
                    <div className="w-12 h-12 rounded-full border border-indigo-400/20 flex items-center justify-center bg-indigo-950/30 group-hover:scale-110 transition-transform">
                      <span className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300">MTG</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">
                      {library.length} {t('cards')}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-2.5">
                  {t('library')}
                </span>
              </div>

              {/* Graveyard pile face-up card */}
              <div className="flex flex-col items-center relative">
                <div
                  onClick={() => graveyard.length > 0 && setIsGraveyardOpen(!isGraveyardOpen)}
                  className={`relative w-28 h-40 rounded-lg border-2 shadow-2xl flex items-center justify-center cursor-pointer select-none group transition-all duration-300 ${graveyard.length === 0 ? 'border-dashed border-slate-800 opacity-40 pointer-events-none' : 'border-red-500/40 hover:border-red-400 hover:scale-105'}`}
                >
                  {graveyard.length > 0 ? (
                    <>
                      <img
                        src={getCardImageUrl(graveyard[0].card)}
                        alt="Graveyard top"
                        className="w-full h-full object-cover rounded-md pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 flex flex-col items-center justify-center gap-1 transition-all rounded-md">
                        <FaSkull className="text-red-500 text-xl drop-shadow" />
                        <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                          {graveyard.length} {t('cards')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-600">
                      <FaSkull className="text-lg" />
                      <span className="text-[9px] uppercase tracking-wider font-extrabold">{t('empty')}</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-2.5">
                  {t('graveyard')}
                </span>

                {/* Graveyard browser dropdown */}
                {isGraveyardOpen && graveyard.length > 0 && (
                  <div className="absolute top-full lg:top-auto lg:bottom-full left-1/2 -translate-x-1/2 lg:-translate-y-2 mt-2 lg:mt-0 lg:mb-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 scrollbar-thin">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <span>
                        {t('graveyard')} ({graveyard.length})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGraveyardOpen(false);
                        }}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      {graveyard.map((playtestCard) => (
                        <div
                          key={playtestCard.playtestId}
                          className="flex items-center justify-between p-1.5 hover:bg-slate-800/60 rounded-lg transition-colors gap-2"
                        >
                          <span className="text-[10px] text-slate-200 truncate font-semibold block flex-1">
                            {playtestCard.card.printed_name || playtestCard.card.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReturnToHand(playtestCard.playtestId, 'graveyard');
                            }}
                            className="text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white px-2 py-0.5 rounded transition-all font-bold shrink-0 uppercase tracking-wider"
                          >
                            {t('retrieve')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sandbox battlefield mat ("Campo de Batalha") */}
            <div className="flex-1 border-2 border-dashed border-slate-800/80 rounded-2xl p-4 min-h-[360px] bg-slate-950/45 flex flex-wrap gap-4 items-center justify-center relative overflow-hidden">
              {/* Sandbox playmat battlefield */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
                <FaDiceD20 className="text-[260px] text-slate-400" />
              </div>
              <div className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-widest text-slate-600/60 pointer-events-none select-none">
                {t('battlefield')}
              </div>

              {battlefield.length === 0 ? (
                <div className="text-center p-6 pointer-events-none max-w-sm">
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
                        {/* stable outer container to prevent layout reflow, visual inner card rotates */}
                        <div className="relative w-24 h-34 sm:w-28 sm:h-40 flex items-center justify-center">
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

                            {/* Tapped badge overlay */}
                            {isTapped && (
                              <div className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 text-[6px] font-extrabold px-1 rounded shadow uppercase tracking-wider animate-pulse">
                                {t('tapped').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Floating quick control actions on card hover */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 z-30 bg-slate-900/95 border border-slate-700/80 rounded-full px-2 py-1 shadow-2xl backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailCard(card);
                            }}
                            title={t('viewCardDetails')}
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-blue-400 border border-slate-700 hover:bg-blue-500 hover:text-white transition-all text-[9px]"
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
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-amber-400 border border-slate-700 hover:bg-amber-500 hover:text-slate-950 transition-all text-[9px]"
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
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-indigo-400 border border-slate-700 hover:bg-indigo-500 hover:text-white transition-all text-[9px]"
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
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-red-400 border border-slate-700 hover:bg-red-500 hover:text-white transition-all text-[9px]"
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
            <div className="flex items-center justify-between mb-3 text-xs uppercase font-extrabold tracking-widest text-slate-500">
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
                          className={`relative w-24 h-34 sm:w-28 sm:h-40 rounded-xl overflow-hidden shadow-lg border bg-slate-900 transition-all duration-300 select-none cursor-pointer ${isMulliganPhase ? 'hover:border-amber-400' : 'hover:-translate-y-4 hover:scale-105 hover:border-indigo-500'} ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/50 scale-95 opacity-80' : 'border-slate-800'}`}
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

                          {/* Mulligan Selection overlay indicator */}
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

                        {/* Hand Info and Discard Buttons (on hover, outside mulligan phase) */}
                        {!isMulliganPhase && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailCard(card);
                              }}
                              title={t('viewCardDetails')}
                              className="absolute -top-2.5 -left-2 w-5.5 h-5.5 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 shadow-lg text-slate-400 hover:text-blue-400 hover:border-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-[8px]"
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
                              className="absolute -top-2.5 -right-2 w-5.5 h-5.5 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 shadow-lg text-slate-400 hover:text-red-400 hover:border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-[8px]"
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

          {/* Action buttons footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 pt-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDrawCard}
                disabled={library.length === 0 || isMulliganPhase}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2 px-5 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <FaArrowRight className="text-[10px]" />
                {t('drawCard')}
              </button>

              <button
                type="button"
                onClick={handleUntapAll}
                disabled={battlefield.length === 0 || isMulliganPhase}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <FaSync className="text-[10px]" />
                {t('untapAll')}
              </button>

              <button
                type="button"
                onClick={() => setIsTokenModalOpen(true)}
                disabled={isMulliganPhase}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-2 px-5 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <FaUndo className="text-[10px] rotate-90" />
                {t('mulligan')}
              </button>
              <button
                type="button"
                onClick={startSimulation}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <FaUndo className="text-[10px]" />
                {t('resetSimulator')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Token Summoner Modal */}
      <PlaytestTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSelectToken={handleSummonToken}
      />

      {/* Card Detail Modal */}
      {selectedDetailCard && (
        <CardDetailModal
          card={selectedDetailCard}
          imageUrl={getCardImageUrl(selectedDetailCard)}
          onClose={() => setSelectedDetailCard(null)}
        />
      )}
    </div>
  );
}

export default PlaytestSimulator;
