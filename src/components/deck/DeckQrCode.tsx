import { useEffect, useMemo, useRef } from 'react';
import { generateQrMatrix } from '../../utils/qrCode';

interface DeckQrCodeProps {
  /** Text to encode (typically a shareable deck URL). */
  value: string;
  /** Rendered pixel size of the square canvas. */
  size?: number;
  /** Quiet-zone width in modules (spec recommends 4). */
  quietZone?: number;
  className?: string;
  /** Rendered when the value is too large to fit a QR code. */
  fallback?: React.ReactNode;
}

/**
 * Renders `value` as a QR code on a plain `<canvas>` using the in-house encoder
 * (no external library). Kept intentionally light-touch: it draws crisp black
 * modules on a white background so the code scans in either app theme.
 */
export function DeckQrCode({ value, size = 220, quietZone = 4, className, fallback = null }: DeckQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Encoding can throw when the payload exceeds version-40 capacity; degrade to
  // the fallback instead of crashing the dialog.
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value);
    } catch {
      return null;
    }
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix) return;

    const modules = matrix.length;
    const totalModules = modules + quietZone * 2;
    // Integer module size keeps every module the same width — no blurry seams.
    const scale = Math.max(1, Math.floor(size / totalModules));
    const pixelSize = scale * totalModules;

    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pixelSize, pixelSize);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (matrix[r][c]) {
          ctx.fillRect((c + quietZone) * scale, (r + quietZone) * scale, scale, scale);
        }
      }
    }
  }, [matrix, size, quietZone]);

  if (!matrix) return <>{fallback}</>;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      role="img"
      aria-label="QR code"
    />
  );
}

export default DeckQrCode;
