import React, { createContext, useContext, ReactNode, useState } from 'react';
import { usePlaytestSimulator } from '../../hooks/usePlaytestSimulator';
import { Card } from '../../types/Card';

type PlaytestState = ReturnType<typeof usePlaytestSimulator>;

export interface ExtendedPlaytestState extends PlaytestState {
  isLogOpen: boolean;
  setIsLogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dragOverZone: 'battlefield' | 'graveyard' | 'hand' | 'library' | 'exile' | null;
  setDragOverZone: React.Dispatch<React.SetStateAction<'battlefield' | 'graveyard' | 'hand' | 'library' | 'exile' | null>>;
  contextMenu: { playtestId: string; x: number; y: number; zone: 'battlefield' | 'hand' | 'graveyard' | 'exile' } | null;
  setContextMenu: React.Dispatch<
    React.SetStateAction<{ playtestId: string; x: number; y: number; zone: 'battlefield' | 'hand' | 'graveyard' | 'exile' } | null>
  >;
  libraryContextMenu: { x: number; y: number } | null;
  setLibraryContextMenu: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  positionPrompt: { playtestId: string } | null;
  setPositionPrompt: React.Dispatch<React.SetStateAction<{ playtestId: string } | null>>;
  pileExplorerConfig: { title: string; pile: 'library' | 'graveyard' | 'exile' } | null;
  setPileExplorerConfig: React.Dispatch<React.SetStateAction<{ title: string; pile: 'library' | 'graveyard' | 'exile' } | null>>;
  scrySurveilPrompt: { type: 'scry' | 'surveil' } | null;
  setScrySurveilPrompt: React.Dispatch<React.SetStateAction<{ type: 'scry' | 'surveil' } | null>>;
  scrySurveilConfig: { type: 'scry' | 'surveil'; amount: number } | null;
  setScrySurveilConfig: React.Dispatch<React.SetStateAction<{ type: 'scry' | 'surveil'; amount: number } | null>>;
  isTokenModalOpen: boolean;
  setIsTokenModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDetailCard: Card | null;
  setSelectedDetailCard: React.Dispatch<React.SetStateAction<Card | null>>;
  getCardImageUrl: (card: Card) => string;
}

const PlaytestContext = createContext<ExtendedPlaytestState | null>(null);

interface PlaytestProviderProps {
  children: ReactNode;
  deckCards: Card[];
  deckFormat?: string;
  isOpen: boolean;
}

export function PlaytestProvider({ children, deckCards, deckFormat, isOpen }: PlaytestProviderProps) {
  const baseState = usePlaytestSimulator(deckCards, deckFormat, isOpen);

  const [isLogOpen, setIsLogOpen] = useState(true);
  const [dragOverZone, setDragOverZone] = useState<'battlefield' | 'graveyard' | 'hand' | 'library' | 'exile' | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    playtestId: string;
    x: number;
    y: number;
    zone: 'battlefield' | 'hand' | 'graveyard' | 'exile';
  } | null>(null);
  const [libraryContextMenu, setLibraryContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [positionPrompt, setPositionPrompt] = useState<{ playtestId: string } | null>(null);
  const [scrySurveilPrompt, setScrySurveilPrompt] = useState<{ type: 'scry' | 'surveil' } | null>(null);
  const [pileExplorerConfig, setPileExplorerConfig] = useState<{ title: string; pile: 'library' | 'graveyard' | 'exile' } | null>(
    null
  );
  const [scrySurveilConfig, setScrySurveilConfig] = useState<{ type: 'scry' | 'surveil'; amount: number } | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<Card | null>(null);

  const getCardImageUrl = (card: Card): string => {
    if (card.selectedPrintImageUri) return card.selectedPrintImageUri;
    if (card.image_uris?.gatherer) return card.image_uris.gatherer;
    const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
    if (!imageUris) return '';
    return imageUris.normal || imageUris.large || '';
  };

  const value: ExtendedPlaytestState = {
    ...baseState,
    isLogOpen,
    setIsLogOpen,
    dragOverZone,
    setDragOverZone,
    contextMenu,
    setContextMenu,
    libraryContextMenu,
    setLibraryContextMenu,
    positionPrompt,
    setPositionPrompt,
    scrySurveilPrompt,
    setScrySurveilPrompt,
    pileExplorerConfig,
    setPileExplorerConfig,
    scrySurveilConfig,
    setScrySurveilConfig,
    isTokenModalOpen,
    setIsTokenModalOpen,
    selectedDetailCard,
    setSelectedDetailCard,
    getCardImageUrl
  };

  return <PlaytestContext.Provider value={value}>{children}</PlaytestContext.Provider>;
}

export const usePlaytestContext = () => {
  const context = useContext(PlaytestContext);
  if (!context) throw new Error('usePlaytestContext must be used within PlaytestProvider');
  return context;
};
