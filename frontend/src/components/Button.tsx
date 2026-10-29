import React from 'react';
import type { ButtonVariant } from '../types/calculator';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick: () => void;
  ariaLabel: string;
  isActive?: boolean;
  isPressed?: boolean;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  number:
    'bg-white text-slate-800 border-slate-200 border-b-slate-300 hover:bg-slate-50 dark:bg-[#252E3E] dark:hover:bg-[#2F3A4E] dark:text-white dark:border-[#3B475C] dark:border-b-[#111722]',
  'basic-op':
    'bg-[#FFE5D9] text-[#D85A32] border-[#F5C6B3] border-b-[#E5A894] hover:bg-[#FFD8C7] dark:bg-[#3D1E16] dark:hover:bg-[#4E271D] dark:text-[#FFC4B0] dark:border-[#6B3426] dark:border-b-[#24100B] font-bold',
  'advanced-op':
    'bg-[#E8EAFF] text-[#4F5BD5] border-[#C9CEFF] border-b-[#B0B7F8] hover:bg-[#DCE0FF] dark:bg-[#20254A] dark:hover:bg-[#2A3160] dark:text-[#D1D7FF] dark:border-[#404B8A] dark:border-b-[#12152E] font-bold',
  equals:
    'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7] border-b-[#95D5B2] hover:bg-[#C7EFCF] dark:bg-[#0E3522] dark:hover:bg-[#15462E] dark:text-[#9AF5BA] dark:border-[#1E6B44] dark:border-b-[#071F14] font-bold',
  danger:
    'bg-[#FFE5EC] text-[#C9184A] border-[#FFCCD5] border-b-[#FFB3C1] hover:bg-[#FFD6E0] dark:bg-[#3D1622] dark:hover:bg-[#4F1D2C] dark:text-[#FFB5CA] dark:border-[#6E283E] dark:border-b-[#240B13] font-bold',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'number',
  onClick,
  ariaLabel,
  isPressed = false,
  disabled = false,
  className = '',
  testId,
}) => {
  const variantClass = VARIANT_STYLES[variant];
  const physicalStateClass = isPressed
    ? 'border-b-0 translate-y-[3px] shadow-none'
    : 'border-b-4 translate-y-0 shadow-sm active:border-b-0 active:translate-y-[3px] active:shadow-none';

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        (e.currentTarget as HTMLElement)?.blur();
        onClick();
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId}
      data-keycap="true"
      className={`
        rounded-2xl font-semibold text-lg sm:text-xl min-h-[3.5rem] sm:min-h-[3.75rem]
        transition-all duration-75 select-none
        flex items-center justify-center gap-1.5 border border-t-0 border-x-0
        focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClass}
        ${physicalStateClass}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
