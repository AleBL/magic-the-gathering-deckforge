import { CSSProperties } from 'react';

interface FlipCardProps {
  frontSrc: string;
  backSrc: string;
  isFlipped: boolean;
  alt: string;
  /** When false (effects off / reduced motion) faces swap instantly with no spin. */
  animated?: boolean;
  className?: string;
  imgClassName?: string;
  imgStyle?: CSSProperties;
  loading?: 'lazy' | 'eager';
}

/**
 * CSS-only 3D flip for double-faced cards (transform: rotateY). No animation
 * library — the spin is a plain transform transition on `.flip-card-inner`,
 * defined in motion-effects.css. Both faces render at once so the flip never
 * waits on an image load.
 */
function FlipCard({
  frontSrc,
  backSrc,
  isFlipped,
  alt,
  animated = true,
  className = '',
  imgClassName = '',
  imgStyle,
  loading = 'lazy'
}: FlipCardProps) {
  return (
    <div className={`flip-card ${animated ? '' : 'flip-card-static'} ${className}`}>
      <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="flip-card-face flip-card-face--front">
          <img src={frontSrc} alt={alt} className={imgClassName} style={imgStyle} loading={loading} />
        </div>
        <div className="flip-card-face flip-card-face--back" aria-hidden={!isFlipped}>
          <img src={backSrc} alt={`${alt} — back`} className={imgClassName} style={imgStyle} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default FlipCard;
