import { ReactNode } from 'react';
import { LuChevronDown, LuX } from 'react-icons/lu';

interface ProfileMenuBackHeaderProps {
  readonly title: ReactNode;
  readonly onBack: () => void;
  readonly onClose: () => void;
}

/** The "‹ Title  ✕" header shared by every non-main section of the profile menu. */
export function ProfileMenuBackHeader({ title, onBack, onClose }: ProfileMenuBackHeaderProps) {
  return (
    <div className="profile-menu-back-header">
      <button type="button" onClick={onBack} className="profile-back-btn">
        <LuChevronDown className="rotate-90 text-xs" />
        <span className="text-sm font-semibold text-fg">{title}</span>
      </button>
      <button type="button" onClick={onClose} className="text-gray-400 hover:text-fg-secondary p-1 rounded">
        <LuX className="text-xs" />
      </button>
    </div>
  );
}
