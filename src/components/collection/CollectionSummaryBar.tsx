import { useTranslation } from 'react-i18next';
import { FaBoxOpen, FaLayerGroup, FaHeart, FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import { Currency } from '../../types/Collection';
import { CollectionSummary, formatCurrency } from '../../utils/collectionMath';

interface CollectionSummaryBarProps {
  summary: CollectionSummary;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

/** Totals strip: owned copies, unique printings, wishlist count and estimated value. */
export function CollectionSummaryBar({ summary, currency, onCurrencyChange }: CollectionSummaryBarProps) {
  const { t } = useTranslation();

  const stat = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 shadow-sm">
      <span className="text-primary shrink-0">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2.5">
        {stat(<FaBoxOpen className="text-base" />, t('collection.totalCards'), String(summary.totalCopies))}
        {stat(<FaLayerGroup className="text-base" />, t('collection.uniquePrintings'), String(summary.uniquePrintings))}
        {stat(<FaHeart className="text-base" />, t('collection.wishlist'), String(summary.wishlistCount))}
        {stat(
          <FaDollarSign className="text-base" />,
          t('collection.estimatedValue'),
          formatCurrency(summary.totalValue, currency)
        )}

        <div className="flex items-center rounded-full bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 p-0.5 shadow-sm">
          {(['usd', 'eur'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onCurrencyChange(code)}
              aria-pressed={currency === code}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                currency === code
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Scryfall has no prices for non-English printings; when we borrowed the
          English printing's price as an estimate, say so. */}
      {summary.fallbackPricedCount > 0 ? (
        <p className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <FaInfoCircle className="text-blue-400 shrink-0" />
          {t('collection.priceFallbackNote', { count: summary.fallbackPricedCount })}
        </p>
      ) : null}
    </div>
  );
}
