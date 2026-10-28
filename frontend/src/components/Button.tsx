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
    'bg-white text-slate-800 border-slate-200 border-b-slate-300 hover:bg-slate-50 dark:bg-[#334155] dark:hover:bg-[#3E4C63] dark:text-white dark:border-[#475569] dark:border-b-[#0F172A]',
  'basic-op':
    'bg-[#FFE5D9] text-[#D85A32] border-[#F5C6B3] border-b-[#E5A894] hover:bg-[#FFD8C7] dark:bg-[#3B231E] dark:hover:bg-[#4A2C26] dark:text-[#FFBDA8] dark:border-[#5C372F] dark:border-b-[#241411]',
  'advanced-op':
    'bg-[#E8EAFF] text-[#4F5BD5] border-[#C9CEFF] border-b-[#B0B7F8] hover:bg-[#DCE0FF] dark:bg-[#25294A] dark:hover:bg-[#2F345E] dark:text-[#C7CEFF] dark:border-[#3D4478] dark:border-b-[#15182E]',
  equals:
    'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7] border-b-[#95D5B2] hover:bg-[#C7EFCF] dark:bg-[#143829] dark:hover:bg-[#1B4936] dark:text-[#8CE9AC] dark:border-[#235C44] dark:border-b-[#0B2118]',
  danger:
    'bg-[#FFE5EC] text-[#C9184A] border-[#FFCCD5] border-b-[#FFB3C1] hover:bg-[#FFD6E0] dark:bg-[#421C29] dark:hover:bg-[#522333] dark:text-[#FFADC5] dark:border-[#692C41] dark:border-b-[#291018]',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'number',
  onClick,
  ariaLabel,
  isActive = false,
  isPressed = false,
  disabled = false,
  className = '',
  testId,
}) => {
  const variantClass = VARIANT_STYLES[variant];
  const activeClass = isActive ? 'ring-2 ring-offset-1 ring-[#D85A32] dark:ring-[#FFBDA8] dark:ring-offset-[#1E293B]' : '';
  const physicalStateClass = isPressed
    ? 'border-b-0 translate-y-[3px] shadow-none'
    : 'border-b-4 translate-y-0 shadow-sm active:border-b-0 active:translate-y-[3px] active:shadow-none';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId}
      data-keycap="true"
      className={`
        rounded-2xl font-semibold text-lg sm:text-xl min-h-[3.5rem] sm:min-h-[3.75rem]
        transition-all duration-75 select-none
        flex items-center justify-center gap-1.5 border border-t-0 border-x-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClass}
        ${physicalStateClass}
        ${activeClass}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
