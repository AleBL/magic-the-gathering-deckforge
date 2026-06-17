export function dispatchToast(message: string, variant: 'success' | 'danger' | 'warning' | 'info' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { message, variant } }));
  }
}
