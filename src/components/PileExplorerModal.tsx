import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlaytestCard } from '../types/Playtest';
import { FaTimes, FaSearch } from 'react-icons/fa';

import { PlaytestZone } from '../types/enums';

export interface PileExplorerModalProps {
  title: string;
  cards: PlaytestCard[];
  onClose: () => void;
  onMoveCard: (
    playtestId: string,
    destination: PlaytestZone
  ) => void;
}

export default function PileExplorerModal({ title, cards, onClose, onMoveCard }: PileExplorerModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{ playtestId: string; x: number; y: number } | null>(null);

  const filteredCards = cards.filter((c) => {
    if (!searchTerm) return true;
    const name = (c.card.printed_name || c.card.name || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const handleContextMenu = (e: React.MouseEvent, playtestId: string) => {
    e.preventDefault();
    const menuHeight = 220;
    let y = e.clientY;
    if (window.innerHeight - y < menuHeight) {
      y -= menuHeight;
    }
    setContextMenu({ playtestId, x: e.clientX, y });
  };

  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="w-full max-w-6xl mx-4 bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 flex flex-col h-[80vh] animate-fadeIn relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {title} <span className="text-slate-400 text-lg font-normal">({cards.length})</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('common.searchCards')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {filteredCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCards.map((item) => (
                <div
                  key={item.playtestId}
                  className="relative group cursor-context-menu"
                  onContextMenu={(e) => handleContextMenu(e, item.playtestId)}
                >
                  <img
                    src={item.card.image_uris?.normal || item.card.card_faces?.[0]?.image_uris?.normal || ''}
                    alt={item.card.name}
                    className="w-full rounded-xl shadow-md transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-lg">{t('common.noCardsFound')}</p>
            </div>
          )}
        </div>

        {contextMenu && (
          <div
            className="fixed z-[3100] bg-slate-800 border border-slate-700 shadow-2xl rounded-xl py-1 w-48 animate-fadeIn"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 transition-colors"
              onClick={() => {
                onMoveCard(contextMenu.playtestId, PlaytestZone.HAND);
                setContextMenu(null);
              }}
            >
              {t('playtest.moveToHand')}
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 transition-colors"
              onClick={() => {
                onMoveCard(contextMenu.playtestId, PlaytestZone.BATTLEFIELD);
                setContextMenu(null);
              }}
            >
              {t('playtest.moveToBattlefield')}
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 transition-colors"
              onClick={() => {
                onMoveCard(contextMenu.playtestId, PlaytestZone.LIBRARY_TOP);
                setContextMenu(null);
              }}
            >
              {t('playtest.moveToLibraryTop')}
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 transition-colors"
              onClick={() => {
                onMoveCard(contextMenu.playtestId, PlaytestZone.LIBRARY_BOTTOM);
                setContextMenu(null);
              }}
            >
              {t('playtest.moveToLibraryBottom')}
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 transition-colors"
              onClick={() => {
                onMoveCard(contextMenu.playtestId, PlaytestZone.GRAVEYARD);
                setContextMenu(null);
              }}
            >
              {t('playtest.moveToGraveyard')}
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 transition-colors"
              onClick={() => {
                onMoveCard(contextMenu.playtestId, PlaytestZone.EXILE);
                setContextMenu(null);
              }}
            >
              {t('playtest.moveToExile')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
