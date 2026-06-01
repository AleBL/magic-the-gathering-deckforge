import { useTranslation } from 'react-i18next';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { Card } from '../types/Card';

interface PlaytestTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (tokenCard: Card) => void;
}

export interface TokenPreset {
  id: string;
  name: string;
  type_line: string;
  colors: string[];
  power?: string;
  toughness?: string;
  oracle_text: string;
  rarity: string;
  set_name: string;
  localeKey: string;
  imageUrl?: string;
}

export function PlaytestTokenModal({ isOpen, onClose, onSelectToken }: PlaytestTokenModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const tokenPresets: TokenPreset[] = [
    {
      id: 'token-soldier',
      name: 'Soldier',
      type_line: 'Token Creature — Soldier',
      colors: ['W'],
      power: '1',
      toughness: '1',
      oracle_text: '',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'soldierToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/d/e/dede70d6-ff7d-4171-bc01-f2f2cf53c5f4.jpg' // High-quality Soldier token
    },
    {
      id: 'token-zombie',
      name: 'Zombie',
      type_line: 'Token Creature — Zombie',
      colors: ['B'],
      power: '2',
      toughness: '2',
      oracle_text: '',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'zombieToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/a/1/a1cd54b2-4d57-41ab-851c-6d9b936d5ad0.jpg' // Zombie token
    },
    {
      id: 'token-goblin',
      name: 'Goblin',
      type_line: 'Token Creature — Goblin',
      colors: ['R'],
      power: '1',
      toughness: '1',
      oracle_text: 'Haste',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'goblinToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/1/7/17b2b73b-b27b-4bb8-86d1-d227c244bebf.jpg' // Goblin token
    },
    {
      id: 'token-thopter',
      name: 'Thopter',
      type_line: 'Token Artifact Creature — Thopter',
      colors: [],
      power: '1',
      toughness: '1',
      oracle_text: 'Flying',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'thopterToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/7/8/7864f164-9b68-4b6c-918e-4a6c6e6e6e6e.jpg' // Thopter token
    },
    {
      id: 'token-saproling',
      name: 'Saproling',
      type_line: 'Token Creature — Saproling',
      colors: ['G'],
      power: '1',
      toughness: '1',
      oracle_text: '',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'saprolingToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/d/a/da908b98-ea24-4f3b-ba2c-ed4a0e980ea2.jpg' // Saproling token
    },
    {
      id: 'token-bird',
      name: 'Bird',
      type_line: 'Token Creature — Bird',
      colors: ['U'],
      power: '1',
      toughness: '1',
      oracle_text: 'Flying',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'birdToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd42c4db-9cb8-4f81-a9c4-dc1e35f8d386.jpg' // Bird token
    },
    {
      id: 'token-beast',
      name: 'Beast',
      type_line: 'Token Creature — Beast',
      colors: ['G'],
      power: '3',
      toughness: '3',
      oracle_text: '',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'beastToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bdc35353-8b77-4b7b-89da-0b89da1be79b.jpg' // Beast token
    },
    {
      id: 'token-treasure',
      name: 'Treasure',
      type_line: 'Token Artifact — Treasure',
      colors: [],
      oracle_text: '{T}, Sacrifice: Add one mana of any color.',
      rarity: 'common',
      set_name: 'Tokens',
      localeKey: 'treasureToken',
      imageUrl: 'https://cards.scryfall.io/normal/front/c/c/ccb10a30-e380-482d-88b9-ebcba6e8a7ea.jpg' // Treasure token
    }
  ];

  const handleCreateToken = (preset: TokenPreset) => {
    // Generate a valid Card object structure
    const tokenCard: Card = {
      id: `token-${preset.id}-${Math.random().toString(36).substring(2, 9)}`,
      oracle_id: `token-oracle-${preset.id}`,
      name: preset.name,
      printed_name: t(preset.localeKey),
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

    onSelectToken(tokenCard);
  };

  const getColorClass = (colors: string[]) => {
    if (colors.length === 0) return 'border-slate-700 bg-slate-800/40 text-slate-300';
    if (colors.includes('W')) return 'border-yellow-500/50 bg-yellow-500/5 text-yellow-300';
    if (colors.includes('U')) return 'border-blue-500/50 bg-blue-500/5 text-blue-300';
    if (colors.includes('B')) return 'border-purple-950 bg-purple-950/10 text-purple-400';
    if (colors.includes('R')) return 'border-red-500/50 bg-red-500/5 text-red-400';
    if (colors.includes('G')) return 'border-green-500/50 bg-green-500/5 text-green-400';
    return 'border-slate-700 bg-slate-800/40 text-slate-300';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FaPlus className="text-indigo-500" />
            {t('tokenPool')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {tokenPresets.map((preset) => {
            const colorClass = getColorClass(preset.colors);
            return (
              <div
                key={preset.id}
                onClick={() => handleCreateToken(preset)}
                className={`border rounded-xl p-3 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-lg ${colorClass} group`}
              >
                {/* Visual miniature representation */}
                <div className="w-20 h-28 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 mb-3 shadow-md flex items-center justify-center relative">
                  {preset.imageUrl ? (
                    <img
                      src={preset.imageUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold">{preset.name}</span>
                  )}
                  {preset.power && preset.toughness && (
                    <div className="absolute bottom-1 right-1 bg-slate-900/90 border border-slate-700/50 rounded px-1 text-[8px] font-bold text-slate-300 shadow">
                      {preset.power}/{preset.toughness}
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <h4 className="text-xs font-bold text-slate-200 truncate leading-tight group-hover:text-indigo-400 transition-colors">
                    {t(preset.localeKey)}
                  </h4>
                  <p className="text-[9px] text-slate-500 truncate mt-0.5">
                    {preset.power && preset.toughness ? `${preset.power}/${preset.toughness}` : ''}{' '}
                    {preset.oracle_text || preset.name}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-3 w-full justify-center bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg py-1 text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <FaPlus className="text-[8px]" />
                  {t('create')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
