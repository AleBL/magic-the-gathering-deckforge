export function clampMenuYToViewport(clientY: number, estimatedMenuHeight: number, margin: number): number {
  if (window.innerHeight - clientY < estimatedMenuHeight) {
    return window.innerHeight - (estimatedMenuHeight + margin);
  }
  return clientY;
}
