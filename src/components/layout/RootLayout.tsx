import { ReactNode } from 'react';
import Header from '../Header';
import AmbientGlow from '../ui/AmbientGlow';
import Toast from '../ui/Toast';
import CustomDialog from '../ui/CustomDialog';
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

      <main className="main-content">
        {children}
      </main>

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
    </div>
  );
}
