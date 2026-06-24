import { useState, useCallback } from 'react';

export type SupportedDialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface DialogState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  onConfirm: () => void;
  variant: SupportedDialogVariant;
}

const INITIAL_DIALOG_STATE: DialogState = {
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  onConfirm: () => {},
  variant: 'info'
};

export default function useDialog() {
  const [dialogState, setDialogState] = useState<DialogState>(INITIAL_DIALOG_STATE);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = useCallback(
    (title: string, message: string, variant: SupportedDialogVariant = 'info') => {
      setDialogState({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: closeDialog,
        variant
      });
    },
    [closeDialog]
  );

  const showConfirm = useCallback(
    (title: string, message: string, onConfirmAction: () => void, variant: SupportedDialogVariant = 'warning') => {
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          onConfirmAction();
          closeDialog();
        },
        variant
      });
    },
    [closeDialog]
  );

  return {
    dialogState,
    showAlert,
    showConfirm,
    closeDialog
  };
}
