import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Display } from './Display';
import { formatDisplayNumber } from '../utils/formatters';

describe('formatDisplayNumber helper', () => {
  it('formats large numbers with locale thousands separators', () => {
    expect(formatDisplayNumber('7284123')).toBe('7,284,123');
    expect(formatDisplayNumber('-987654321')).toBe('-987,654,321');
  });

  it('preserves trailing decimals and dots during active typing', () => {
    expect(formatDisplayNumber('12.00')).toBe('12.00');
    expect(formatDisplayNumber('12.')).toBe('12.');
    expect(formatDisplayNumber('0.0005')).toBe('0.0005');
  });

  it('formats scientific notation with superscripts', () => {
    expect(formatDisplayNumber('1.4134e+73')).toBe('1.4134 × 10⁷³');
    expect(formatDisplayNumber('2e-5')).toBe('2 × 10⁻⁵');
    expect(formatDisplayNumber('1e10')).toBe('1 × 10¹⁰');
  });

  it('handles empty or zero fallback gracefully', () => {
    expect(formatDisplayNumber('')).toBe('0');
    expect(formatDisplayNumber('0')).toBe('0');
  });
});

describe('Display Component', () => {
  it('renders expression trail and formatted display value', () => {
    render(
      <Display
        displayValue="7284123"
        expressionTrail="5000000 + 2284123 ="
        error={null}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('display-value')).toHaveTextContent('7,284,123');
    expect(screen.getByTestId('expression-trail')).toHaveTextContent('5000000 + 2284123 =');
  });

  it('renders loading indicator when isLoading is true', () => {
    render(
      <Display
        displayValue="0"
        expressionTrail=""
        error={null}
        isLoading={true}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Calculating...');
  });

  it('renders humanized error banner with title and helper text without truncate class', () => {
    render(
      <Display
        displayValue="0"
        expressionTrail=""
        error={{
          title: "Number is way too big!",
          message: 'This result exceeds the display capacity.',
        }}
        isLoading={false}
      />
    );

    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Number is way too big!');
    expect(banner).toHaveTextContent('This result exceeds the display capacity.');
    expect(banner.className).not.toContain('truncate');
    expect(banner.className).toContain('leading-snug');
  });

  it('supports string error fallback', () => {
    render(
      <Display
        displayValue="0"
        expressionTrail=""
        error="Legacy error message"
        isLoading={false}
      />
    );

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('Legacy error message');
  });

  it('adjusts font size dynamically based on length', () => {
    const { rerender } = render(
      <Display
        displayValue="12345"
        expressionTrail=""
        error={null}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('display-value').className).toContain('text-3xl');

    rerender(
      <Display
        displayValue="12345678901"
        expressionTrail=""
        error={null}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('display-value').className).toContain('text-2xl');

    rerender(
      <Display
        displayValue="12345678901234567"
        expressionTrail=""
        error={null}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('display-value').className).toContain('text-xl');
  });

  it('renders waiting indicator when awaiting second operand and dims display value 0', () => {
    const { rerender } = render(
      <Display
        displayValue="0"
        expressionTrail="42 +"
        error={null}
        isLoading={false}
        waitingForSecondOperand={true}
        pendingOperation="add"
      />
    );

    expect(screen.getByTestId('waiting-indicator')).toHaveTextContent('Next number');
    expect(screen.getByTestId('display-value').className).toContain('text-slate-400');

    // Once typing begins and waiting is false, indicator hides and display un-dims
    rerender(
      <Display
        displayValue="5"
        expressionTrail="42 +"
        error={null}
        isLoading={false}
        waitingForSecondOperand={false}
        pendingOperation="add"
      />
    );

    expect(screen.queryByTestId('waiting-indicator')).not.toBeInTheDocument();
    expect(screen.getByTestId('display-value').className).toContain('text-slate-700');
  });
});
