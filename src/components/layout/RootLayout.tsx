import { ReactNode, useState, useEffect } from 'react';
import Header from '../Header';
import AmbientGlow from '../ui/AmbientGlow';
import Toast from '../ui/Toast';
import CustomDialog from '../ui/CustomDialog';
import CommandPalette from '../CommandPalette';
import AppShortcutsOverlay from '../AppShortcutsOverlay';
import useDarkMode from '../../hooks/useDarkMode';
import { useDeckStore } from '../../store/useDeckStore';
import useDialog from '../../hooks/useDialog';
import { ToastAction, ToastVariant } from '../../types/Toast';

interface RootLayoutProps {
  children: ReactNode;
  activeTab: 'search' | 'deck';
  setActiveTab: (tab: 'search' | 'deck') => void;
  toastMessage: string | null;
  toastVariant: ToastVariant;
  toastAction: ToastAction | undefined;
}

export default function RootLayout({
  children,
  activeTab,
  setActiveTab,
  toastMessage,
  toastVariant,
  toastAction
}: RootLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const { dialogState, closeDialog } = useDialog();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // The playtest is a fullscreen mode with its own shortcuts; don't fire app-level ones underneath it.
      if (document.body.dataset.playtestOpen === 'true') return;
      const target = e.target as HTMLElement;
      const inField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (e.key === '?' && !inField) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentDeckLength = useDeckStore((state) => state.currentDeck.length);
  const editingDeck = useDeckStore((state) => state.editingDeck);
  const cancelEdit = useDeckStore((state) => state.cancelEdit);

  return (
    <div className="page-container">
      <AmbientGlow />
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentDeckLength={currentDeckLength}
        editingDeck={editingDeck}
        onCancelEdit={cancelEdit}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <main className="main-content">{children}</main>

      {toastMessage && <Toast message={toastMessage} variant={toastVariant} action={toastAction} />}
      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={closeDialog}
        variant={dialogState.variant}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onShowShortcuts={() => setIsShortcutsOpen(true)}
      />
      <AppShortcutsOverlay isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
