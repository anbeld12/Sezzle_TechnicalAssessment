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
    'bg-white text-slate-800 border-slate-200 border-b-slate-300 hover:bg-slate-50 dark:bg-[#282D37] dark:text-slate-100 dark:border-[#353B48] dark:border-b-[#1C2027] dark:hover:bg-[#2F3542]',
  'basic-op':
    'bg-[#FFE5D9] text-[#D85A32] border-[#F5C6B3] border-b-[#E5A894] hover:bg-[#FFD8C7] dark:bg-[#422923] dark:text-[#FFA07A] dark:border-[#5C382E] dark:border-b-[#2C1813] dark:hover:bg-[#4E312B]',
  'advanced-op':
    'bg-[#E8EAFF] text-[#4F5BD5] border-[#C9CEFF] border-b-[#B0B7F8] hover:bg-[#DCE0FF] dark:bg-[#252B4E] dark:text-[#9AA5FF] dark:border-[#363E6E] dark:border-b-[#1B203E] dark:hover:bg-[#2D345F]',
  equals:
    'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7] border-b-[#95D5B2] hover:bg-[#C7EFCF] dark:bg-[#1E3A2F] dark:text-[#74C69D] dark:border-[#2D5A46] dark:border-b-[#142A21] dark:hover:bg-[#254739]',
  danger:
    'bg-[#FFE5EC] text-[#C9184A] border-[#FFCCD5] border-b-[#FFB3C1] hover:bg-[#FFD6E0] dark:bg-[#3D1E28] dark:text-[#FF758F] dark:border-[#5A2C3C] dark:border-b-[#251017] dark:hover:bg-[#4A2432]',
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
  const activeClass = isActive ? 'ring-2 ring-offset-1 ring-[#D85A32] dark:ring-[#FFA07A] dark:ring-offset-[#1E222A]' : '';
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
