import { useVisualEffects } from '../../hooks/useVisualEffects';

interface LowLifeWashProps {
  /** Shown only while the life total is critical. */
  active: boolean;
}

/**
 * A still red wash at the top of the playtest table while life is critical. It is the one
 * place the table changes colour, so it reads as a warning rather than as decoration; the
 * life counter carries the same state as text. Part of the opt-in visual-effects package.
 */
function LowLifeWash({ active }: LowLifeWashProps) {
  const { effectsEnabled } = useVisualEffects();
  if (!active || !effectsEnabled) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-danger-soft), transparent 70%)' }}
      aria-hidden="true"
    />
  );
}

export default LowLifeWash;
