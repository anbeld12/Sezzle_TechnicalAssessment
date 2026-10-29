import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutsModal } from './ShortcutsModal';

describe('ShortcutsModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ShortcutsModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog and all shortcuts when isOpen is true', () => {
    render(<ShortcutsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Enter numbers and decimal')).toBeInTheDocument();
    expect(screen.getByText('Basic arithmetic operations')).toBeInTheDocument();
    expect(screen.getByText(/Exponentiation/)).toBeInTheDocument();
    expect(screen.getByText('Calculate result')).toBeInTheDocument();
    expect(screen.getByText(/Delete last character/)).toBeInTheDocument();
    expect(screen.getByText('Clear all (AC)')).toBeInTheDocument();
    expect(screen.getByText(/Copy current display value/)).toBeInTheDocument();
    expect(screen.getByText(/Paste number into calculator/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('btn-close-shortcuts'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside on the backdrop', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    const backdrop = screen.getByTestId('shortcuts-modal');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
