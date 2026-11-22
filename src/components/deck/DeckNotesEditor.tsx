import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPencilAlt } from 'react-icons/fa';

interface DeckNotesEditorProps {
  /** Notas iniciais (salvas ou em edição). */
  initialNotes: string;
  /** Se false, apenas leitura (deck salvo sendo visualizado). */
  isEditable?: boolean;
  onSave?: (notes: string) => void;
}

// Markdown -> ReactNode Renderer (NO dangerouslySetInnerHTML - zero XSS risk)

/** Renders a line of text supporting **bold** and *italic*. */
function renderInline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  // Split preserving delimiters to reprocess
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);

  boldParts.forEach((part, bi) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      result.push(<strong key={`b${bi}`}>{inner}</strong>);
    } else {
      // Inside non-bold parts, process simple italics
      const italicParts = part.split(/(\*[^*]+\*)/g);
      italicParts.forEach((ip, ii) => {
        if (ip.startsWith('*') && ip.endsWith('*')) {
          result.push(<em key={`i${bi}-${ii}`}>{ip.slice(1, -1)}</em>);
        } else {
          result.push(ip);
        }
      });
    }
  });

  return result;
}

/** Converts markdown string to ReactNode[] without injecting raw HTML. */
function parseMarkdownToJSX(md: string): ReactNode[] {
  if (!md.trim()) return [];

  const lines = md.split('\n');
  const nodes: ReactNode[] = [];
  let key = 0;

  lines.forEach((line) => {
    const k = key++;

    if (line.startsWith('### ')) {
      nodes.push(
        <h4 key={k} className="text-xs font-extrabold text-accent mt-4 mb-2 uppercase select-none">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      nodes.push(
        <h3
          key={k}
          className="text-sm font-extrabold text-accent mt-5 mb-2 border-b border-slate-800/80 pb-1 select-none"
        >
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      nodes.push(
        <h2
          key={k}
          className="text-base font-extrabold text-white mt-6 mb-3 border-b border-slate-700/60 pb-2 select-none"
        >
          {line.slice(2)}
        </h2>
      );
    } else if (/^\s*-\s/.test(line)) {
      nodes.push(
        <li key={k} className="ml-4 list-disc text-slate-300 dark:text-slate-400 my-1 font-medium">
          {renderInline(line.replace(/^\s*-\s/, ''))}
        </li>
      );
    } else if (line.trim() === '') {
      nodes.push(<br key={k} />);
    } else {
      nodes.push(
        <p key={k} className="text-fg leading-relaxed my-0.5">
          {renderInline(line)}
        </p>
      );
    }
  });

  return nodes;
}

function DeckNotesEditor({ initialNotes, isEditable = true, onSave }: DeckNotesEditorProps) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [notesInput, setNotesInput] = useState(initialNotes);

  useEffect(() => {
    setNotesInput(initialNotes);
    setEditMode(false);
  }, [initialNotes]);

  const handleToggleEdit = () => {
    if (editMode && onSave) {
      onSave(notesInput);
    }
    setEditMode((prev) => !prev);
  };

  const renderedNodes = parseMarkdownToJSX(notesInput);

  return (
    <div className="space-y-4 p-4 rounded-xl border border-line bg-surface-1/50 text-left animate-fadeIn">
      <div className="flex justify-between items-center pb-2 border-b border-line">
        <h4 className="text-sm font-bold text-fg-secondary uppercase tracking-widest flex items-center gap-1.5 select-none">
          <FaPencilAlt className="text-accent shrink-0 text-xs" />
          <span>{t('strategy.strategyGuide')}</span>
        </h4>
        {isEditable && (
          <button type="button" onClick={handleToggleEdit} className="primary-button text-xs py-1 px-3 shadow-xs">
            {editMode ? t('deck.save') : t('common.edit')}
          </button>
        )}
      </div>

      {editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder={t('strategy.strategyGuidePlaceholder')}
            className="w-full h-full text-xs font-mono p-3 bg-surface-2 text-fg border border-line-strong rounded-lg outline-none resize-none focus:ring-1 focus:ring-focus"
          />
          <div className="w-full h-full overflow-y-auto p-4 bg-surface-1/80 border border-line rounded-lg max-h-96 text-xs">
            {renderedNodes.length > 0 ? (
              renderedNodes
            ) : (
              <p className="text-gray-400 italic text-center py-12 select-none">{t('strategy.preview')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-48 p-4 bg-surface-1/40 rounded-lg border border-line max-h-96 overflow-y-auto text-xs">
          {notesInput.trim() ? (
            renderedNodes
          ) : (
            <p className="text-xs text-gray-400 italic text-center py-12 select-none">
              {isEditable ? t('common.edit') + ' →  ' : ''} {t('strategy.noStrategyNotes')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DeckNotesEditor;
