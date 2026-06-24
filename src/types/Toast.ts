export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastState {
  message: string | null;
  variant: ToastVariant;
  action?: ToastAction;
}
