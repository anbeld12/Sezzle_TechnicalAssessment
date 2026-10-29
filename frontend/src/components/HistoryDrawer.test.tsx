import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HistoryDrawer } from './HistoryDrawer';
import type { HistoryEntry } from '../types/calculator';

describe('HistoryDrawer Component', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  const sampleHistory: HistoryEntry[] = [
    {
      id: 'entry-1',
      expression: '20 + 22 = 42',
      result: 42,
      timestamp: '10:00:00 AM',
    },
    {
      id: 'entry-2',
      expression: '100 / 4 = 25',
      result: 25,
      timestamp: '10:05:00 AM',
    },
  ];

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <HistoryDrawer
        isOpen={false}
        onClose={vi.fn()}
        history={sampleHistory}
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state when history is empty', () => {
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        history={[]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByText('Calculation History')).toBeInTheDocument();
    expect(screen.getByText('No calculations recorded yet.')).toBeInTheDocument();
    expect(screen.getByLabelText('Clear all history')).toBeDisabled();
  });

  it('renders history entries and does NOT contain any misleading enter symbol (↵)', () => {
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        history={sampleHistory}
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    );

    // Verify entries are visible
    expect(screen.getByText('20 + 22 = 42')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('100 / 4 = 25')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    // Verify NO enter glyph (↵) is present anywhere in the drawer
    const drawer = screen.getByTestId('history-drawer');
    expect(drawer.textContent).not.toContain('↵');
    expect(drawer.textContent).not.toContain('Use result ↵');

    // Verify explicit "Click to load" label is present
    expect(screen.getAllByText(/Click to load/i)).toHaveLength(2);
  });

  it('calls onSelect and onClose when clicking a history entry card', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={onClose}
        history={sampleHistory}
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const items = screen.getAllByTestId('history-entry-item');
    fireEvent.click(items[0]);

    expect(onSelect).toHaveBeenCalledWith(42);
    expect(onClose).toHaveBeenCalled();
  });

  it('allows keyboard activation (Enter or Space) on history entry card', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={onClose}
        history={sampleHistory}
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const items = screen.getAllByTestId('history-entry-item');
    fireEvent.keyDown(items[1], { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(25);
    expect(onClose).toHaveBeenCalled();

    onSelect.mockClear();
    onClose.mockClear();

    fireEvent.keyDown(items[0], { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(42);
    expect(onClose).toHaveBeenCalled();
  });

  it('copies result to clipboard and shows "Copied!" feedback without triggering onSelect or onClose', async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={onClose}
        history={sampleHistory}
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const copyButtons = screen.getAllByTestId('btn-copy-history');
    expect(copyButtons).toHaveLength(2);

    // Click copy on first item
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });

    // Expect clipboard copy with raw result string
    expect(writeTextMock).toHaveBeenCalledWith('42');

    // Crucial: card's onSelect and onClose must NOT be called
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    // Check that button shows "Copied!" feedback
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    // Fast-forward 1800ms
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    // Should return to idle copy icon
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('copies using document.execCommand fallback if clipboard API is unavailable', async () => {
    // Remove navigator.clipboard to trigger fallback
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={onClose}
        history={sampleHistory}
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const copyButtons = screen.getAllByTestId('btn-copy-history');
    await act(async () => {
      fireEvent.click(copyButtons[1]);
    });

    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={onClose}
        history={sampleHistory}
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Close history'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        history={sampleHistory}
        onSelect={vi.fn()}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByLabelText('Clear all history'));
    expect(onClear).toHaveBeenCalled();
  });

  it('handles rapid consecutive copies by resetting active timer', async () => {
    vi.useFakeTimers();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        history={sampleHistory}
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    );

    const copyButtons = screen.getAllByTestId('btn-copy-history');
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });
    // Click second copy button immediately before 1800ms timer expires
    await act(async () => {
      fireEvent.click(copyButtons[1]);
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('stops event propagation on copy button keydown', () => {
    const onSelect = vi.fn();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        history={sampleHistory}
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const copyButtons = screen.getAllByTestId('btn-copy-history');
    fireEvent.keyDown(copyButtons[0], { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('logs error if clipboard write fails gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        history={sampleHistory}
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    );

    const copyButtons = screen.getAllByTestId('btn-copy-history');
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to copy history item:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
