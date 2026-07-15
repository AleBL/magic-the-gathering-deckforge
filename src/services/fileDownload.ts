import { dispatchToast } from '../utils/toastHelper';
import i18n from '../plugins/i18n';

/**
 * Downloads data as a JSON file by creating a temporary Blob URL and triggering a click.
 */
export function downloadAsJson(data: unknown, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
    dispatchToast(i18n.t('common.unexpectedError') as string, 'danger');
  }
}
