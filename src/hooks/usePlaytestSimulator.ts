import { useState, useEffect, useCallback } from 'react';
import { Card } from '../types/Card';
import { PlaytestCard, LogEntry } from '../types/Playtest';
import { useTranslation } from 'react-i18next';
import { PlaytestZone } from '../types/enums';

export function usePlaytestSimulator(deckCards: Card[], deckFormat?: string, isOpen?: boolean) {
  const { t } = useTranslation();
  const [library, setLibrary] = useState<PlaytestCard[]>([]);
  const [hand, setHand] = useState<PlaytestCard[]>([]);
  const [battlefield, setBattlefield] = useState<PlaytestCard[]>([]);
  const [graveyard, setGraveyard] = useState<PlaytestCard[]>([]);
  const [exile, setExile] = useState<PlaytestCard[]>([]);
  const [lifeTotal, setLifeTotal] = useState(20);
  const [mulligans, setMulligans] = useState(0);
  const [isMulliganPhase, setIsMulliganPhase] = useState(false);
  const [selectedToBottom, setSelectedToBottom] = useState<Set<string>>(new Set());

  const [turn, setTurn] = useState(1);
  const [lifeLog, setLifeLog] = useState<LogEntry[]>([]);
  const [prevLifeTotal, setPrevLifeTotal] = useState<number | null>(null);

  const shuffleDeck = (cards: PlaytestCard[]): PlaytestCard[] => {
    const shuffledCards = [...cards];
    for (let currentIndex = shuffledCards.length - 1; currentIndex > 0; currentIndex--) {
      const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
      const temporaryCardHolder = shuffledCards[currentIndex];
      shuffledCards[currentIndex] = shuffledCards[randomIndex];
      shuffledCards[randomIndex] = temporaryCardHolder;
    }
    return shuffledCards;
  };

  const mapToPlaytestCards = (cards: Card[]): PlaytestCard[] => {
    return cards.map((card, index) => ({
      playtestId: `${card.id}-${index}-${Math.random().toString(36).substring(2, 9)}`,
      card,
      isTapped: false,
      counters: 0,
      isFaceDown: true // Hidden in library by default
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
    const initialHand = shuffled.slice(0, 7).map((c) => ({ ...c, isFaceDown: false }));
    const initialLibrary = shuffled.slice(7);

    setHand(initialHand);
    setLibrary(initialLibrary);
    setBattlefield([]);
    setGraveyard([]);
    setExile([]);
    const initialLife = deckFormat === 'commander' ? 40 : 20;
    setLifeTotal(initialLife);
    setPrevLifeTotal(initialLife);
    setMulligans(0);
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());

    setTurn(1);
    setLifeLog([
      {
        id: 'start',
        text: t('playtest.gameStartedLog'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
  }, [deckCards, deckFormat, t]);

  useEffect(() => {
    if (isOpen) {
      startSimulation();
    }
  }, [isOpen, startSimulation]);

  useEffect(() => {
    if (prevLifeTotal !== null && prevLifeTotal !== lifeTotal) {
      logAction(t('playtest.lifeChangedLog', { from: prevLifeTotal, to: lifeTotal }));
    }
    setPrevLifeTotal(lifeTotal);
  }, [lifeTotal, prevLifeTotal, logAction, t]);

  const handleMulligan = () => {
    const nextMulligans = mulligans + 1;
    const mappedCards = mapToPlaytestCards(deckCards);
    const shuffled = shuffleDeck(mappedCards);

    const initialHand = shuffled.slice(0, 7).map((c) => ({ ...c, isFaceDown: false }));
    const initialLibrary = shuffled.slice(7);

    setHand(initialHand);
    setLibrary(initialLibrary);
    setBattlefield([]);
    setGraveyard([]);
    setExile([]);
    setMulligans(nextMulligans);
    setIsMulliganPhase(true);
    setSelectedToBottom(new Set());

    logAction(t('playtest.mulliganLog', { cards: 7 }));
  };

  const handleToggleCardSelection = (playtestId: string) => {
    if (!isMulliganPhase) return;

    setSelectedToBottom((prevSelectedToBottom) => {
      const nextSelectedToBottom = new Set(prevSelectedToBottom);
      if (nextSelectedToBottom.has(playtestId)) {
        nextSelectedToBottom.delete(playtestId);
      } else {
        if (nextSelectedToBottom.size < mulligans) {
          nextSelectedToBottom.add(playtestId);
        }
      }
      return nextSelectedToBottom;
    });
  };

  const handleConfirmMulligan = () => {
    if (selectedToBottom.size !== mulligans) return;

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
    setLibrary((previousLibrary) => [...previousLibrary, ...cardsToBottom.map((c) => ({ ...c, isFaceDown: true }))]);
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());

    logAction(t('playtest.keptHandLog') + ` (London Mulligan para ${7 - mulligans} cartas)`);
  };

  const handleKeepHand = () => {
    setIsMulliganPhase(false);
    setSelectedToBottom(new Set());
    logAction(t('playtest.keptHandLog') + ` (${7 - mulligans} cartas)`);
  };

  const handleDrawCard = useCallback(() => {
    setLibrary((previousLibrary) => {
      if (previousLibrary.length === 0) return previousLibrary;
      const nextCard = previousLibrary[0];
      setHand((previousHand) => [...previousHand, { ...nextCard, isFaceDown: false }]);
      const cardName = nextCard.card.printed_name || nextCard.card.name;
      logAction(t('playtest.drewCardLog', { name: cardName }));
      return previousLibrary.slice(1);
    });
  }, [logAction, t]);

  const handleShuffleLibrary = useCallback(() => {
    setLibrary((prevLibrary) => {
      if (prevLibrary.length === 0) return prevLibrary;
      const shuffled = shuffleDeck(prevLibrary);
      logAction(t('playtest.shuffleLibraryLog'));
      return shuffled;
    });
  }, [logAction, t]);

  const handlePlayCard = useCallback(
    (playtestId: string) => {
      setHand((previousHand) => {
        const targetCard = previousHand.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousHand;
        setBattlefield((previousBattlefield) => [...previousBattlefield, { ...targetCard, isTapped: false }]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(t('playtest.playedCardLog', { name: cardName }));
        return previousHand.filter((item) => item.playtestId !== playtestId);
      });
    },
    [logAction, t]
  );

  const handleToggleTapCard = useCallback(
    (playtestId: string) => {
      setBattlefield((previousBattlefield) => {
        const targetCard = previousBattlefield.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousBattlefield;
        const isTapped = !targetCard.isTapped;
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(
          isTapped ? t('playtest.tappedCardLog', { name: cardName }) : t('playtest.untappedCardLog', { name: cardName })
        );
        return previousBattlefield.map((item) => (item.playtestId === playtestId ? { ...item, isTapped } : item));
      });
    },
    [logAction, t]
  );

  const handleAddCounter = useCallback((playtestId: string) => {
    setBattlefield((prev) =>
      prev.map((item) => {
        if (item.playtestId === playtestId) {
          const cardName = item.card.printed_name || item.card.name;
          logAction(t('playtest.addedCounterLog', { name: cardName }));
          return { ...item, counters: (item.counters || 0) + 1 };
        }
        return item;
      })
    );
  }, [logAction, t]);

  const handleRemoveCounter = useCallback((playtestId: string) => {
    setBattlefield((prev) =>
      prev.map((item) => {
        if (item.playtestId === playtestId) {
          if ((item.counters || 0) > 0) {
            const cardName = item.card.printed_name || item.card.name;
            logAction(t('playtest.removedCounterLog', { name: cardName }));
          }
          return { ...item, counters: Math.max(0, (item.counters || 0) - 1) };
        }
        return item;
      })
    );
  }, [logAction, t]);

  const handleToggleFaceDown = useCallback((playtestId: string) => {
    setBattlefield((prev) =>
      prev.map((item) => {
        if (item.playtestId === playtestId) {
          const cardName = item.card.printed_name || item.card.name;
          const isFaceDown = !item.isFaceDown;
          logAction(
            isFaceDown ? t('playtest.turnedFaceDownLog', { name: cardName }) : t('playtest.turnedFaceUpLog', { name: cardName })
          );
          return { ...item, isFaceDown };
        }
        return item;
      })
    );
  }, [logAction, t]);

  const handleSendToGraveyard = useCallback(
    (playtestId: string) => {
      setBattlefield((previousBattlefield) => {
        const targetCard = previousBattlefield.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousBattlefield;
        // desvirar a carta ao ir pro cemitério
        const cardToGrave = { ...targetCard, isFaceDown: false };
        setGraveyard((previousGraveyard) => [cardToGrave, ...previousGraveyard]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(t('playtest.graveyardCardLog', { name: cardName }));
        return previousBattlefield.filter((item) => item.playtestId !== playtestId);
      });
    },
    [logAction, t]
  );

  const handleSendToExile = useCallback(
    (playtestId: string, source: PlaytestZone = PlaytestZone.BATTLEFIELD) => {
      let targetCard: PlaytestCard | undefined;
      
      if (source === PlaytestZone.BATTLEFIELD) {
        setBattlefield((prev) => {
          targetCard = prev.find((item) => item.playtestId === playtestId);
          return prev.filter((item) => item.playtestId !== playtestId);
        });
      } else if (source === PlaytestZone.GRAVEYARD) {
        setGraveyard((prev) => {
          targetCard = prev.find((item) => item.playtestId === playtestId);
          return prev.filter((item) => item.playtestId !== playtestId);
        });
      } else if (source === PlaytestZone.HAND) {
        setHand((prev) => {
          targetCard = prev.find((item) => item.playtestId === playtestId);
          return prev.filter((item) => item.playtestId !== playtestId);
        });
      }

      if (targetCard) {
        const cardToExile = { ...targetCard, isFaceDown: false };
        setExile((prev) => [cardToExile, ...prev]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(t('playtest.sentToExileLog', { name: cardName }));
      }
    },
    [logAction, t]
  );

  const handleLibraryToGraveyard = useCallback(
    (playtestId: string) => {
      setLibrary((previousLibrary) => {
        const targetCard = previousLibrary.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousLibrary;
        // desvirar a carta ao ir pro cemitério
        const cardToGrave = { ...targetCard, isFaceDown: false };
        setGraveyard((previousGraveyard) => [cardToGrave, ...previousGraveyard]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(
          t('playtest.movedFromPileLog', {
            name: cardName,
            source: t('playtest.library'),
            dest: t('playtest.graveyard')
          })
        );
        return previousLibrary.filter((item) => item.playtestId !== playtestId);
      });
    },
    [logAction, t]
  );

  const handleDiscardFromHand = useCallback(
    (playtestId: string) => {
      setHand((previousHand) => {
        const targetCard = previousHand.find((item) => item.playtestId === playtestId);
        if (!targetCard) return previousHand;
        setGraveyard((previousGraveyard) => [targetCard, ...previousGraveyard]);
        const cardName = targetCard.card.printed_name || targetCard.card.name;
        logAction(t('playtest.discardedCardLog', { name: cardName }));
        return previousHand.filter((item) => item.playtestId !== playtestId);
      });
    },
    [logAction, t]
  );

  const handleSendToLibraryPosition = useCallback(
    (playtestId: string, position: number, source: PlaytestZone = PlaytestZone.HAND) => {
      let targetCard: PlaytestCard | undefined;

      if (source === PlaytestZone.HAND) targetCard = hand.find((c) => c.playtestId === playtestId);
      else if (source === PlaytestZone.BATTLEFIELD) targetCard = battlefield.find((c) => c.playtestId === playtestId);
      else if (source === PlaytestZone.GRAVEYARD) targetCard = graveyard.find((c) => c.playtestId === playtestId);

      if (!targetCard) return;
      const card = targetCard;

      if (source === PlaytestZone.HAND) {
        setHand((prev) => prev.filter((item) => item.playtestId !== playtestId));
      } else if (source === PlaytestZone.BATTLEFIELD) {
        setBattlefield((prev) => prev.filter((item) => item.playtestId !== playtestId));
      } else if (source === PlaytestZone.GRAVEYARD) {
        setGraveyard((prev) => prev.filter((item) => item.playtestId !== playtestId));
      }

      setLibrary((prevLibrary) => {
        const nextLibrary = [...prevLibrary];
        const clampedPosition = Math.max(0, Math.min(position, nextLibrary.length));
        nextLibrary.splice(clampedPosition, 0, { ...card, isFaceDown: false });

        const cardName = card.card.printed_name || card.card.name;
        logAction(t('playtest.libraryPositionLog', { name: cardName, pos: clampedPosition + 1 }));

        return nextLibrary;
      });
    },
    [hand, battlefield, graveyard, logAction, t]
  );

  const handleReturnToHand = useCallback(
    (playtestId: string, fromZone: PlaytestZone) => {
      if (fromZone === PlaytestZone.BATTLEFIELD) {
        setBattlefield((previousBattlefield) => {
          const targetCard = previousBattlefield.find((item) => item.playtestId === playtestId);
          if (!targetCard) return previousBattlefield;
          setHand((previousHand) => [...previousHand, { ...targetCard, isTapped: false }]);
          const cardName = targetCard.card.printed_name || targetCard.card.name;
          logAction(t('playtest.returnedHandLog', { name: cardName }));
          return previousBattlefield.filter((item) => item.playtestId !== playtestId);
        });
      } else {
        setGraveyard((previousGraveyard) => {
          const targetCard = previousGraveyard.find((item) => item.playtestId === playtestId);
          if (!targetCard) return previousGraveyard;
          setHand((previousHand) => [...previousHand, { ...targetCard, isTapped: false }]);
          const cardName = targetCard.card.printed_name || targetCard.card.name;
          logAction(t('playtest.returnedHandLog', { name: cardName }));
          return previousGraveyard.filter((item) => item.playtestId !== playtestId);
        });
      }
    },
    [logAction, t]
  );

  const handleUntapAll = useCallback(() => {
    setBattlefield((previousBattlefield) => {
      if (previousBattlefield.length === 0) return previousBattlefield;
      logAction(t('playtest.untappedAllLog'));
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
      const tokenName = tokenCard.printed_name || tokenCard.name;
      logAction(t('playtest.createdTokenLog', { name: tokenName }));
    },
    [logAction, t]
  );

  const handleNextTurn = useCallback(() => {
    setTurn((prevTurn) => {
      const nextTurn = prevTurn + 1;

      setBattlefield((prevBattlefield) => prevBattlefield.map((item) => ({ ...item, isTapped: false })));

      setLibrary((prevLibrary) => {
        let drawnCardName = '';
        if (prevLibrary.length > 0) {
          const nextCard = prevLibrary[0];
          drawnCardName = nextCard.card.printed_name || nextCard.card.name;
          setHand((prevHand) => [...prevHand, { ...nextCard, isFaceDown: false }]);
        }

        logAction(t('playtest.turnStartedLog', { turn: nextTurn }));
        logAction(t('playtest.untappedAllLog'));
        if (drawnCardName) {
          logAction(t('playtest.drewCardLog', { name: drawnCardName }));
        }

        return prevLibrary.slice(1);
      });

      return nextTurn;
    });
  }, [logAction, t]);

  return {
    library,
    hand,
    battlefield,
    graveyard,
    exile,
    lifeTotal,
    setLifeTotal,
    mulligans,
    isMulliganPhase,
    selectedToBottom,
    turn,
    lifeLog,
    setLifeLog,
    startSimulation,
    handleMulligan,
    handleToggleCardSelection,
    handleConfirmMulligan,
    handleKeepHand,
    handleDrawCard,
    handleShuffleLibrary,
    handlePlayCard,
    handleToggleTapCard,
    handleAddCounter,
    handleRemoveCounter,
    handleToggleFaceDown,
    handleSendToGraveyard,
    handleSendToExile,
    handleLibraryToGraveyard,
    handleDiscardFromHand,
    handleSendToLibraryPosition,
    handleReturnToHand,
    handleUntapAll,
    handleSummonToken,
    handleNextTurn,
    setLibrary,
    setHand,
    setBattlefield,
    setGraveyard,
    setExile,
    logAction
  };
}
