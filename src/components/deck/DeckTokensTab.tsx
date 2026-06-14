import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaSpinner, FaPalette, FaInfoCircle, FaTrash, FaPlus, FaSync, FaTimes, FaSearch } from 'react-icons/fa';
import * as Scry from 'scryfall-sdk';
import { Card } from '../../types/Card';
import { DeckRelatedToken } from '../../types/Deck';
import { RelatedToken } from '../../hooks/useCardRelatedTokens';
import { tokenPresets, TokenPreset } from '../PlaytestTokenModal';
import { translateCards } from '../../utils/translationHelper';
import { getCardImageUrl } from '../../utils/deckGrouping';
import { CardWithScryfallMetadata, ScryfallCardPart, ScryfallSearchResponse } from '../../types/Scryfall';
import CardDetailModal from '../CardDetailModal';

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
  const { t, i18n } = useTranslation();

  const [presets, setPresets] = useState<TokenPreset[]>(tokenPresets);

  useEffect(() => {
    const fetchPresetImages = async () => {
      try {
        const query =
          't:token (name:soldier or name:zombie or name:goblin or name:thopter or name:saproling or name:bird or name:beast or name:treasure or name:food)';
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) return;
        const data = (await response.json()) as ScryfallSearchResponse;
        if (data.data && Array.isArray(data.data)) {
          const updated = tokenPresets.map((preset) => {
            const match = data.data?.find(
              (cardCandidate) => cardCandidate.name.toLowerCase() === preset.name.toLowerCase()
            );
            if (match) {
              const normalImg = match.image_uris?.normal || match.card_faces?.[0]?.image_uris?.normal;
              if (normalImg) {
                return { ...preset, imageUrl: normalImg };
              }
            }
            return preset;
          });
          setPresets(updated);
        }
      } catch {
        // Keep default preset images when dynamic fetch fails.
      }
    };
    fetchPresetImages();
  }, []);

  // Modal & Search States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTokenForDetail, setSelectedTokenForDetail] = useState<Card | null>(null);
  const [tokenDetailImageUrl, setTokenDetailImageUrl] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [localTokens, setLocalTokens] = useState<RelatedToken[]>([]);

  // Synchronize localTokens with incoming cached tokens
  useEffect(() => {
    if (cachedTokens !== undefined) {
      setLocalTokens(cachedTokens);
    } else {
      setLocalTokens([]);
    }
  }, [cachedTokens]);

  const handleDeleteToken = (tokenId: string) => {
    const updated = localTokens.filter((t) => t.tokenCard.id !== tokenId);
    setLocalTokens(updated);
    onTokensLoaded?.(updated);
  };

  const handlePresetClick = async (preset: TokenPreset) => {
    // Quick add: build a token card from the preset and add directly (no modal)
    const tokenCard: Card = {
      id: `token-${preset.id}-${Math.random().toString(36).substring(2, 9)}`,
      oracle_id: `token-oracle-${preset.id}`,
      name: preset.name,
      printed_name: t(preset.localeKey, preset.name),
      type_line: preset.type_line,
      printed_type_line: preset.type_line,
      oracle_text: preset.oracle_text,
      rarity: preset.rarity,
      set_name: preset.set_name,
      colors: preset.colors,
      color_identity: preset.colors,
      power: preset.power,
      toughness: preset.toughness,
      image_uris: preset.imageUrl
        ? {
            small: preset.imageUrl,
            normal: preset.imageUrl,
            large: preset.imageUrl,
            png: preset.imageUrl
          }
        : undefined
    };

    const newToken: RelatedToken = {
      tokenCard,
      generatorCardName: t('manualAddition')
    };
    const updated = [...localTokens, newToken];
    setLocalTokens(updated);
    onTokensLoaded?.(updated);
    // Close modal if open
    setIsSearchModalOpen(false);
  };

  const handleSearchTokens = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const query = `t:token lang:any ${searchTerm.trim()}`;
      const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }
        if (response.status === 503 || response.status === 504) {
          throw new Error('ScryfallOffline');
        }
        throw new Error('Falha ao buscar fichas');
      }

      const json = await response.json();
      if (json.data && Array.isArray(json.data)) {
        // Group tokens by unique identity: name + power/toughness + colors
        const grouped = new Map<string, Card>();
        (json.data as Card[]).forEach((token: Card) => {
          const key = [
            token.name?.toLowerCase().trim(),
            token.power || '',
            token.toughness || '',
            (token.colors || []).sort().join('')
          ].join('|');
          if (!grouped.has(key)) {
            grouped.set(key, token);
          }
        });
        setSearchResults(Array.from(grouped.values()));
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      if (err?.message === 'ScryfallOffline') {
        setSearchError(t('scryfallOffline'));
      } else {
        setSearchError(t('searchError'));
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmAddToken = async (selectedCard: Card) => {
    setIsSearching(true);
    try {
      const currentLang = i18n.language || 'en';
      const translated = await translateCards([selectedCard], currentLang);
      const finalCard = translated[0] || selectedCard;

      // Garantir que a ficha tem imagem associada e usar fallback para a de inglês caso não tenha normal
      const imgNormal = finalCard.image_uris?.normal || finalCard.card_faces?.[0]?.image_uris?.normal;
      const origNormal = selectedCard.image_uris?.normal || selectedCard.card_faces?.[0]?.image_uris?.normal;
      if (!imgNormal && origNormal) {
        finalCard.image_uris = {
          ...finalCard.image_uris,
          normal: origNormal,
          small: selectedCard.image_uris?.small || origNormal,
          large: selectedCard.image_uris?.large || origNormal,
          png: selectedCard.image_uris?.png || origNormal
        };
      }

      const uniqueTokenCard = {
        ...finalCard,
        id: `token-${finalCard.id || Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`
      };

      const newToken: RelatedToken = {
        tokenCard: uniqueTokenCard,
        generatorCardName: t('manualAddition')
      };

      const updated = [...localTokens, newToken];
      setLocalTokens(updated);
      onTokensLoaded?.(updated);
      setSelectedTokenForDetail(null);
      setIsSearchModalOpen(false);
    } catch {
      // Keep modal open state consistent even if token insertion fails.
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyzeDeck = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const tokenKeywords = [
      'token',
      'create',
      'ficha',
      'criar',
      'crea',
      'crie',
      'investig',
      'incub',
      'fabric',
      'acumul',
      'enrolar',
      'amass'
    ];
    const nonLandCards = cards.filter((c) => !c.type_line?.toLowerCase().includes('land'));

    // Find generators in cards
    const generators = nonLandCards.filter((c) => {
      const text = (c.oracle_text || (c as CardWithScryfallMetadata).printed_text || '').toLowerCase();
      return tokenKeywords.some((word) => text.includes(word));
    });

    if (generators.length === 0) {
      setIsLoading(false);
      onTokensLoaded?.([]);
      return;
    }

    const newTokensToAdd: RelatedToken[] = [];

    try {
      await Promise.all(
        generators.map(async (c) => {
          let allParts = (c as CardWithScryfallMetadata).all_parts;
          if (!allParts) {
            try {
              const fullCard = (await Scry.Cards.byName(c.name)) as CardWithScryfallMetadata;
              allParts = fullCard.all_parts || [];
            } catch {
              allParts = [];
            }
          }

          const tokenParts = allParts.filter((part) => part.id !== c.id && part.name !== c.name);

          if (tokenParts.length === 0) return;

          await Promise.all(
            tokenParts.map(async (part: ScryfallCardPart) => {
              try {
                const fetchedCard = await Scry.Cards.byId(part.id);
                if (fetchedCard) {
                  const currentLang = i18n.language || 'en';
                  const translated = await translateCards([fetchedCard as unknown as Card], currentLang);
                  const finalCard = translated[0] || fetchedCard;

                  // Garantir fallback de imagens na análise também
                  const imgNormal = finalCard.image_uris?.normal || finalCard.card_faces?.[0]?.image_uris?.normal;
                  const origNormal = fetchedCard.image_uris?.normal || fetchedCard.card_faces?.[0]?.image_uris?.normal;
                  if (!imgNormal && origNormal) {
                    finalCard.image_uris = {
                      ...finalCard.image_uris,
                      normal: origNormal,
                      small: fetchedCard.image_uris?.small || origNormal,
                      large: fetchedCard.image_uris?.large || origNormal,
                      png: fetchedCard.image_uris?.png || origNormal
                    };
                  }

                  newTokensToAdd.push({
                    tokenCard: finalCard,
                    generatorCardName: c.printed_name || c.name
                  });
                }
              } catch {
                // Ignore isolated token fetch failures.
              }
            })
          );
        })
      );

      // Merge results avoiding duplicate tokenCard IDs
      const existingIds = new Set(localTokens.map((t) => t.tokenCard.id));
      const filteredNew = newTokensToAdd.filter((t) => !existingIds.has(t.tokenCard.id));
      const updated = [...localTokens, ...filteredNew];

      setLocalTokens(updated);
      onTokensLoaded?.(updated);
    } catch {
      // Keep existing token list if analysis fails.
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
        <FaSpinner className="text-3xl text-indigo-500 animate-spin" />
        <p className="text-xs font-semibold">{t('loadingTokens')}</p>
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
              title={t('analyzeDeck')}
            >
              <FaSync className="text-[10px]" />
              {t('analyzeDeck')}
            </button>

            {/* Trigger Token Search Modal */}
            <button
              type="button"
              onClick={() => {
                setIsSearchModalOpen(true);
                setSearchTerm('');
                setSearchResults([]);
                setSearchError(null);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <FaPlus className="text-[10px]" />
              {t('addToken')}
            </button>
          </div>
        </div>
      )}

      {localTokens.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-450 dark:text-gray-500 text-center px-6">
          <FaInfoCircle className="text-3xl text-slate-500/80" />
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-350">{t('noTokensFound')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-650">{t('noTokensExplanation')}</p>
          </div>

          {isEditMode && (
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleAnalyzeDeck}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <FaSync className="text-[10px]" />
                {t('analyzeDeck')}
              </button>
            </div>
          )}
        </div>
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
                      title={t('deleteToken')}
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
                        {t('viewLabel')}
                      </span>
                    </div>
                  </div>

                  {/* Text metadata */}
                  <div className="w-full text-center space-y-0.5 min-w-0">
                    <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
                      {tokenCard.printed_name || tokenCard.name}
                    </h5>
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 truncate font-semibold uppercase tracking-wider">
                      {t('generatedBy')}: <span className="font-extrabold text-indigo-500">{generatorCardName}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Visual Token Search & Quick Presets Modal */}
      {isSearchModalOpen &&
        createPortal(
          <div
            className="modal-overlay bg-slate-950/85 backdrop-blur-sm animate-fadeIn z-[100]"
            style={{ zIndex: 100 }}
          >
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/40">
                <h3 className="text-base font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FaPalette className="text-indigo-500" />
                  {t('searchTokensTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Search Form */}
                <form onSubmit={handleSearchTokens} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('searchTokenPlaceholder')}
                      className="w-full text-sm py-2 px-3 pl-9 bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 border border-gray-300 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      autoFocus
                    />
                    <FaSearch className="absolute left-3 top-3 text-xs text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchTerm.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSearching ? <FaSpinner className="animate-spin text-xs" /> : <FaSearch className="text-xs" />}
                    {t('searchButton')}
                  </button>
                </form>

                {/* Quick Presets Section */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-150 dark:border-slate-850 pb-1 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{t('quickPresets')}</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-100 border border-gray-200 dark:border-slate-600 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-102"
                      >
                        {preset.imageUrl && (
                          <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-300 dark:border-slate-600 bg-slate-900 shrink-0">
                            <img src={preset.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span>{t(preset.localeKey)}</span>
                        {preset.power && preset.toughness && (
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">
                            {preset.power}/{preset.toughness}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Results Area */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-150 dark:border-slate-850 pb-1 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>{t('searchResults')}</span>
                  </h4>

                  {isSearching ? (
                    <div className="h-48 flex flex-col items-center justify-center gap-2.5 text-gray-400">
                      <FaSpinner className="text-2xl text-indigo-500 animate-spin" />
                      <span className="text-xs font-semibold">{t('searching')}</span>
                    </div>
                  ) : searchError ? (
                    <div className="h-48 flex items-center justify-center text-xs font-bold text-red-500">
                      {searchError}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 gap-1">
                      <span className="text-xs font-bold">{t('noTokensFoundSearch')}</span>
                      <span className="text-[10px] text-gray-400/80 dark:text-slate-600">
                        {t('searchInstructions')}
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {searchResults.map((token) => {
                        const imgUrl = getCardImageUrl(token);

                        return (
                          <div
                            key={token.id}
                            onClick={() => {
                              setSelectedTokenForDetail(token);
                              setTokenDetailImageUrl(getCardImageUrl(token));
                            }}
                            className="border border-gray-200 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl p-3 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-lg hover:border-indigo-500/50 group"
                          >
                            <div className="w-20 h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-slate-950 mb-2 shadow-md flex items-center justify-center relative shrink-0">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={token.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-1.5 p-1 text-center w-full h-full bg-slate-900 border border-slate-800 rounded-lg">
                                  <FaPalette className="text-indigo-500/40 text-xs shrink-0" />
                                  <span className="text-[8px] text-gray-400 font-bold leading-tight break-words line-clamp-3 select-none">
                                    {token.name}
                                  </span>
                                </div>
                              )}
                              {token.power && token.toughness && (
                                <div className="absolute bottom-1 right-1 bg-slate-900/90 border border-slate-700/50 rounded px-1 text-[8px] font-bold text-slate-350 shadow">
                                  {token.power}/{token.toughness}
                                </div>
                              )}
                            </div>

                            <div className="w-full min-w-0">
                              <h5 className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate leading-tight group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                {token.name}
                              </h5>
                              <p className="text-[9px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                                {token.type_line}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmAddToken(token);
                              }}
                              className="mt-3 w-full justify-center bg-indigo-650/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg py-1 text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <FaPlus className="text-[8px]" />
                              {t('add')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-750 dark:text-slate-200 font-extrabold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>,
          document.body
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
