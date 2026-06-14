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
        <h4 key={k} className="text-xs font-extrabold text-blue-400 mt-4 mb-2 uppercase select-none">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      nodes.push(
        <h3
          key={k}
          className="text-sm font-extrabold text-indigo-400 mt-5 mb-2 border-b border-slate-800/80 pb-1 select-none"
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
        <p key={k} className="text-slate-800 dark:text-slate-300 leading-relaxed my-0.5">
          {renderInline(line)}
        </p>
      );
    }
  });

  return nodes;
}

// ---------------------------------------------------------------------------

function DeckNotesEditor({ initialNotes, isEditable = true, onSave }: DeckNotesEditorProps) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [notesInput, setNotesInput] = useState(initialNotes);

  // Update when the selected deck changes
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
    <div className="space-y-4 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-left animate-fadeIn">
      <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-slate-800">
        <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5 select-none">
          <FaPencilAlt className="text-blue-500 shrink-0 text-xs" />
          <span>{t('strategyGuide')}</span>
        </h4>
        {isEditable && (
          <button type="button" onClick={handleToggleEdit} className="primary-button text-xs py-1 px-3 shadow-xs">
            {editMode ? t('save') : t('edit')}
          </button>
        )}
      </div>

      {editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder={t('strategyGuidePlaceholder')}
            className="w-full h-full text-xs font-mono p-3 bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-slate-200 border border-gray-300 dark:border-slate-850 rounded-lg outline-none resize-none focus:ring-1 focus:ring-blue-500"
          />
          {/* Live preview - pure JSX, no dangerouslySetInnerHTML */}
          <div className="w-full h-full overflow-y-auto p-4 bg-white/80 dark:bg-slate-950/20 border border-gray-200 dark:border-slate-850 rounded-lg max-h-96 text-xs">
            {renderedNodes.length > 0 ? (
              renderedNodes
            ) : (
              <p className="text-gray-400 italic text-center py-12 select-none">{t('preview')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-48 p-4 bg-white/40 dark:bg-slate-950/20 rounded-lg border border-gray-150 dark:border-slate-800/60 max-h-96 overflow-y-auto text-xs">
          {notesInput.trim() ? (
            renderedNodes
          ) : (
            <p className="text-xs text-gray-400 italic text-center py-12 select-none">
              {isEditable ? t('edit') + ' →  ' : ''} {t('noStrategyNotes')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DeckNotesEditor;
