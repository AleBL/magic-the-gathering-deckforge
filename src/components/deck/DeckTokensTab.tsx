import { useTranslation } from 'react-i18next';
import { FaSpinner, FaPalette, FaInfoCircle, FaTrash, FaPlus, FaSync } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { DeckRelatedToken } from '../../types/Deck';
import { RelatedToken } from '../../hooks/useCardRelatedTokens';
import { useDeckTokens } from '../../hooks/useDeckTokens';
import { getCardImageUrl } from '../../utils/deckGrouping';
import CardDetailModal from '../card/CardDetailModal';
import { TokenSearchModal } from './TokenSearchModal';
import EmptyState from '../ui/EmptyState';

interface DeckTokensTabProps {
  cards: Card[];
  cachedTokens?: DeckRelatedToken[];
  onTokensLoaded?: (tokens: RelatedToken[]) => void;
  onTokenClick?: (token: Card) => void;
  onlyHeader?: boolean;
  isEditMode?: boolean;
}

function DeckTokensTab({
  cards,
  cachedTokens,
  onTokensLoaded,
  onTokenClick,
  onlyHeader = false,
  isEditMode = false
}: DeckTokensTabProps) {
  const { t } = useTranslation();
  const {
    presets,
    isSearchModalOpen,
    setIsSearchModalOpen,
    openSearchModal,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    searchError,
    selectedTokenForDetail,
    setSelectedTokenForDetail,
    tokenDetailImageUrl,
    handleViewTokenDetail,
    isLoading,
    localTokens,
    handleDeleteToken,
    handlePresetClick,
    handleSearchTokens,
    handleConfirmAddToken,
    handleAnalyzeDeck
  } = useDeckTokens({ cards, cachedTokens, onTokensLoaded });

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
        <FaSpinner className="text-3xl text-indigo-500 animate-spin" />
        <p className="text-xs font-semibold">{t('tokens.loadingTokens')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left animate-fadeIn">
      {/* Tab Header with Add Token Button */}
      {isEditMode && (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 relative">
          <div className="flex items-center gap-2">
            {/* Analyze deck manually */}
            <button
              type="button"
              onClick={handleAnalyzeDeck}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs py-1.5 px-3 rounded-lg transition-all cursor-pointer"
              title={t('deck.analyzeDeck')}
            >
              <FaSync className="text-[10px]" />
              {t('deck.analyzeDeck')}
            </button>

            {/* Trigger Token Search Modal */}
            <button
              type="button"
              onClick={openSearchModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <FaPlus className="text-[10px]" />
              {t('tokens.addToken')}
            </button>
          </div>
        </div>
      )}

      {localTokens.length === 0 ? (
        <EmptyState
          icon={<FaInfoCircle />}
          title={t('tokens.noTokensFound')}
          description={t('tokens.noTokensExplanation')}
          action={isEditMode ? { label: t('deck.analyzeDeck'), onClick: handleAnalyzeDeck } : undefined}
        />
      ) : (
        !onlyHeader && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {localTokens.map(({ tokenCard, generatorCardName }) => {
              const imgUrl = getCardImageUrl(tokenCard);

              return (
                <div
                  key={tokenCard.id}
                  className="relative border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-800/10 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-xs hover:shadow-md transition-all duration-300 group"
                >
                  {/* Trash/Delete icon button */}
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteToken(tokenCard.id)}
                      title={t('tokens.deleteToken')}
                      className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer shadow-sm"
                    >
                      <FaTrash className="text-[10px]" />
                    </button>
                  )}

                  {/* Token Miniature Image */}
                  <div
                    onClick={() => onTokenClick?.(tokenCard)}
                    className="relative w-full h-34 rounded-lg overflow-hidden border border-gray-150 dark:border-gray-800 bg-slate-950 flex items-center justify-center mb-2 cursor-pointer group/img shrink-0"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={tokenCard.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 p-1 text-center w-full h-full bg-slate-900 border border-slate-800 rounded-lg">
                        <FaPalette className="text-indigo-500/40 text-xs shrink-0" />
                        <span className="text-[8px] text-gray-400 font-bold leading-tight break-words line-clamp-3 select-none">
                          {tokenCard.name}
                        </span>
                      </div>
                    )}
                    {/* Click hint overlay */}
                    <div className="absolute inset-0 bg-indigo-900/0 group-hover/img:bg-indigo-900/25 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow">
                        {t('tokens.viewLabel')}
                      </span>
                    </div>
                  </div>

                  {/* Text metadata */}
                  <div className="w-full text-center space-y-0.5 min-w-0">
                    <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
                      {tokenCard.printed_name || tokenCard.name}
                    </h5>
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 truncate font-semibold uppercase tracking-wider">
                      {t('common.generatedBy')}:{' '}
                      <span className="font-extrabold text-indigo-500">{generatorCardName}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Visual Token Search & Quick Presets Modal */}
      {isSearchModalOpen && (
        <TokenSearchModal
          onClose={() => setIsSearchModalOpen(false)}
          presets={presets}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchResults={searchResults}
          isSearching={isSearching}
          searchError={searchError}
          onSearch={handleSearchTokens}
          onPresetClick={handlePresetClick}
          onSelectToken={handleViewTokenDetail}
          onConfirmAdd={handleConfirmAddToken}
        />
      )}

      {selectedTokenForDetail && (
        <CardDetailModal
          card={selectedTokenForDetail}
          imageUrl={tokenDetailImageUrl}
          onAddToDeck={handleConfirmAddToken}
          onAddTokenToDeck={handleConfirmAddToken}
          onClose={() => setSelectedTokenForDetail(null)}
          isToken={true}
        />
      )}
    </div>
  );
}

export default DeckTokensTab;
