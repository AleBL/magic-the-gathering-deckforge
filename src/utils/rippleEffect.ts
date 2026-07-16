/**
 * Spawns a single Material-style ripple span inside `element`, centered on
 * (clientX, clientY), and removes it once its CSS animation finishes.
 * Shared by useRipple (per-callsite wiring) and useGlobalRipple (delegated).
 */
export function spawnRippleAt(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = clientX - rect.left - size / 2;
  const y = clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  element.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}
