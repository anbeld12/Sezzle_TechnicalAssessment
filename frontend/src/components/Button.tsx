import React from 'react';
import type { ButtonVariant } from '../types/calculator';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick: () => void;
  ariaLabel: string;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  number: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/70 shadow-sm',
  'basic-op': 'bg-[#FFE5D9] text-[#D85A32] hover:bg-[#FFD8C7] border-[#F5C6B3]/60 shadow-sm',
  'advanced-op': 'bg-[#E8EAFF] text-[#4F5BD5] hover:bg-[#DCE0FF] border-[#C9CEFF]/60 shadow-sm',
  equals: 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#C7EFCF] border-[#B7E4C7]/80 shadow-sm',
  danger: 'bg-[#FFE5EC] text-[#C9184A] hover:bg-[#FFD6E0] border-[#FFCCD5]/80 shadow-sm',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'number',
  onClick,
  ariaLabel,
  isActive = false,
  disabled = false,
  className = '',
  testId,
}) => {
  const variantClass = VARIANT_STYLES[variant];
  const activeClass = isActive ? 'ring-2 ring-offset-1 ring-[#D85A32]' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId}
      className={`
        rounded-2xl font-semibold text-lg sm:text-xl min-h-[3.5rem] sm:min-h-[3.75rem]
        transition-all duration-150 active:scale-95 select-none
        flex items-center justify-center gap-1.5 border
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClass}
        ${activeClass}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
