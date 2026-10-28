import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Calculator } from './Calculator';
import * as apiService from '../services/api';

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>();
  return {
    ...actual,
    calculateOnServer: vi.fn(),
  };
});

describe('Calculator Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all calculator surfaces and key buttons', () => {
    render(<Calculator />);

    expect(screen.getByTestId('calculator-chassis')).toBeInTheDocument();
    expect(screen.getByTestId('display-value')).toHaveTextContent('0');
    expect(screen.getByTestId('btn-ac')).toBeInTheDocument();
    expect(screen.getByTestId('btn-del')).toBeInTheDocument();
    expect(screen.getByTestId('btn-add')).toBeInTheDocument();
    expect(screen.getByTestId('btn-subtract')).toBeInTheDocument();
    expect(screen.getByTestId('btn-multiply')).toBeInTheDocument();
    expect(screen.getByTestId('btn-divide')).toBeInTheDocument();
    expect(screen.getByTestId('btn-power')).toBeInTheDocument();
    expect(screen.getByTestId('btn-sqrt')).toBeInTheDocument();
    expect(screen.getByTestId('btn-percentage')).toBeInTheDocument();
    expect(screen.getByTestId('btn-equals')).toBeInTheDocument();
  });

  it('performs basic addition via keypad button clicks', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 20,
      operation: 'add',
      operand1: 12.5,
      operand2: 7.5,
      expression: '12.5 + 7.5 = 20',
    });

    render(<Calculator />);

    // Enter 12.5
    fireEvent.click(screen.getByTestId('btn-1'));
    fireEvent.click(screen.getByTestId('btn-2'));
    fireEvent.click(screen.getByTestId('btn-decimal'));
    fireEvent.click(screen.getByTestId('btn-5'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('12.5');

    // Click +
    fireEvent.click(screen.getByTestId('btn-add'));
    expect(screen.getByTestId('expression-trail')).toHaveTextContent('12.5 +');

    // Enter 7.5
    fireEvent.click(screen.getByTestId('btn-7'));
    fireEvent.click(screen.getByTestId('btn-decimal'));
    fireEvent.click(screen.getByTestId('btn-5'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('7.5');

    // Click =
    fireEvent.click(screen.getByTestId('btn-equals'));

    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith({
        operand1: 12.5,
        operand2: 7.5,
        operation: 'add',
      });
      expect(screen.getByTestId('display-value')).toHaveTextContent('20');
      expect(screen.getByTestId('expression-trail')).toHaveTextContent('12.5 + 7.5 = 20');
    });
  });

  it('performs advanced square root and power operations', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 9,
      operation: 'sqrt',
      operand1: 81,
      expression: '√(81) = 9',
    });

    render(<Calculator />);

    // Sqrt of 81
    fireEvent.click(screen.getByTestId('btn-8'));
    fireEvent.click(screen.getByTestId('btn-1'));
    fireEvent.click(screen.getByTestId('btn-sqrt'));

    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith({
        operand1: 81,
        operation: 'sqrt',
      });
      expect(screen.getByTestId('display-value')).toHaveTextContent('9');
    });

    // Power: 9 ^ 2 = 81
    mockCalculate.mockResolvedValueOnce({
      result: 81,
      operation: 'power',
      operand1: 9,
      operand2: 2,
      expression: '9 ^ 2 = 81',
    });

    fireEvent.click(screen.getByTestId('btn-power'));
    fireEvent.click(screen.getByTestId('btn-2'));
    fireEvent.click(screen.getByTestId('btn-equals'));

    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith({
        operand1: 9,
        operand2: 2,
        operation: 'power',
      });
      expect(screen.getByTestId('display-value')).toHaveTextContent('81');
    });
  });

  it('responds correctly to physical keyboard events', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 16,
      operation: 'multiply',
      operand1: 8,
      operand2: 2,
      expression: '8 × 2 = 16',
    });

    render(<Calculator />);

    // Press '8'
    fireEvent.keyDown(window, { key: '8' });
    expect(screen.getByTestId('display-value')).toHaveTextContent('8');

    // Press '*'
    fireEvent.keyDown(window, { key: '*' });
    expect(screen.getByTestId('expression-trail')).toHaveTextContent('8 ×');

    // Press '2'
    fireEvent.keyDown(window, { key: '2' });
    expect(screen.getByTestId('display-value')).toHaveTextContent('2');

    // Press 'Enter' (=)
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith({
        operand1: 8,
        operand2: 2,
        operation: 'multiply',
      });
      expect(screen.getByTestId('display-value')).toHaveTextContent('16');
    });

    // Press Backspace then Escape
    fireEvent.keyDown(window, { key: 'Backspace' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('display-value')).toHaveTextContent('0');
  });

  it('displays API error alert and auto-clears on new input', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockRejectedValueOnce(
      new apiService.CalculatorApiError('division by zero is undefined', 'DIVISION_BY_ZERO', 422)
    );

    render(<Calculator />);

    fireEvent.click(screen.getByTestId('btn-5'));
    fireEvent.click(screen.getByTestId('btn-divide'));
    fireEvent.click(screen.getByTestId('btn-0'));
    fireEvent.click(screen.getByTestId('btn-equals'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent("Can't divide by zero");
      expect(screen.getByRole('alert')).toHaveTextContent('Try dividing by any other number.');
    });

    // Typing a new digit clears the error
    fireEvent.click(screen.getByTestId('btn-9'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('display-value')).toHaveTextContent('9');
  });

  it('opens history drawer, shows calculations, and can select or clear them', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 42,
      operation: 'add',
      operand1: 40,
      operand2: 2,
      expression: '40 + 2 = 42',
    });

    render(<Calculator />);

    // Perform 40 + 2 = 42
    fireEvent.click(screen.getByTestId('btn-4'));
    fireEvent.click(screen.getByTestId('btn-0'));
    fireEvent.click(screen.getByTestId('btn-add'));
    fireEvent.click(screen.getByTestId('btn-2'));
    fireEvent.click(screen.getByTestId('btn-equals'));

    await waitFor(() => {
      expect(screen.getByTestId('display-value')).toHaveTextContent('42');
    });

    // Toggle history drawer
    fireEvent.click(screen.getByTestId('btn-history-toggle'));
    const drawer = screen.getByTestId('history-drawer');
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText('40 + 2 = 42')).toBeInTheDocument();

    // Click history item to load into display
    fireEvent.click(screen.getByTestId('history-entry-item'));
    expect(screen.queryByTestId('history-drawer')).not.toBeInTheDocument();
    expect(screen.getByTestId('display-value')).toHaveTextContent('42');

    // Open history drawer again and clear it
    fireEvent.click(screen.getByTestId('btn-history-toggle'));
    fireEvent.click(screen.getByLabelText('Clear all history'));
    expect(screen.getByText('No calculations recorded yet.')).toBeInTheDocument();
  });

  it('triggers all keypad operators and keyboard shortcuts', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    render(<Calculator />);

    // Click all digit buttons to exercise handlers
    fireEvent.click(screen.getByTestId('btn-3'));
    fireEvent.click(screen.getByTestId('btn-6'));
    fireEvent.click(screen.getByTestId('btn-toggle-sign'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('-36');

    fireEvent.click(screen.getByTestId('btn-del'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('-3');

    fireEvent.click(screen.getByTestId('btn-ac'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('0');

    // Exercise keypad operators
    fireEvent.click(screen.getByTestId('btn-7'));
    fireEvent.click(screen.getByTestId('btn-subtract'));
    fireEvent.click(screen.getByTestId('btn-divide'));
    fireEvent.click(screen.getByTestId('btn-multiply'));
    expect(screen.getByTestId('expression-trail')).toHaveTextContent('7 ×');

    // Keyboard shortcuts: -, /, ^, %, r, c
    mockCalculate.mockResolvedValueOnce({
      result: 4,
      operation: 'percentage',
      operand1: 400,
      expression: '400% = 4',
    });

    fireEvent.keyDown(window, { key: 'c' });
    fireEvent.keyDown(window, { key: '4' });
    fireEvent.keyDown(window, { key: '0' });
    fireEvent.keyDown(window, { key: '0' });
    fireEvent.keyDown(window, { key: '%' });

    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith({
        operand1: 400,
        operation: 'percentage',
      });
      expect(screen.getByTestId('display-value')).toHaveTextContent('4');
      expect(screen.getByTestId('expression-trail')).toHaveTextContent('400% = 4');
    });

    // Keyboard power shortcut
    fireEvent.keyDown(window, { key: '^' });
    expect(screen.getByTestId('expression-trail')).toHaveTextContent('4 ^');

    // Keyboard divide shortcut (replaces operator)
    fireEvent.keyDown(window, { key: '/' });
    expect(screen.getByTestId('expression-trail')).toHaveTextContent('4 ÷');

    // Keyboard subtract shortcut (replaces operator)
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByTestId('expression-trail')).toHaveTextContent('4 −');

    // Keyboard sqrt shortcut ('r')
    mockCalculate.mockResolvedValueOnce({
      result: 2,
      operation: 'sqrt',
      operand1: 4,
      expression: '√(4) = 2',
    });
    fireEvent.keyDown(window, { key: 'r' });
    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith({
        operand1: 4,
        operation: 'sqrt',
      });
      expect(screen.getByTestId('display-value')).toHaveTextContent('2');
    });
  });

  it('renders tactile branding, model badge, and live status pill', () => {
    render(<Calculator />);

    expect(screen.getByTestId('model-badge')).toHaveTextContent('CALC-01');
    expect(screen.getByTestId('api-status-pill')).toHaveTextContent('API Ready');
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('toggles Day/Night theme and persists preference in localStorage', () => {
    render(<Calculator />);

    const themeBtn = screen.getByTestId('theme-toggle');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle to Dark Mode
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('calc-theme')).toBe('dark');

    // Toggle back to Light Mode
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('calc-theme')).toBe('light');
  });

  it('handles clipboard paste events on window and loads parsed number', () => {
    render(<Calculator />);

    // Paste formatted number "7,284,123"
    fireEvent.paste(window, {
      clipboardData: {
        getData: (format: string) => (format === 'text' ? '7,284,123' : ''),
      },
    });

    // Main display should show formatted number with thousands separators
    expect(screen.getByTestId('display-value')).toHaveTextContent('7,284,123');

    // Paste non-numeric string should be gracefully ignored
    fireEvent.paste(window, {
      clipboardData: {
        getData: (format: string) => (format === 'text' ? 'not-a-number' : ''),
      },
    });

    // Should remain 7,284,123
    expect(screen.getByTestId('display-value')).toHaveTextContent('7,284,123');
  });

  it('provides visual feedback on physical keyboard key press', () => {
    render(<Calculator />);

    const btn7 = screen.getByTestId('btn-7');
    // Initially resting state has border-b-4
    expect(btn7.className).toContain('border-b-4');

    // Press key '7'
    fireEvent.keyDown(window, { key: '7' });
    // Tactile depressed state applies border-b-0 and translate-y-[3px]
    expect(btn7.className).toContain('border-b-0');
    expect(btn7.className).toContain('translate-y-[3px]');
  });
});
