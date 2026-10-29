import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { App } from './App';

vi.mock('./services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/api')>();
  return {
    ...actual,
    calculateOnServer: vi.fn(),
    checkServerHealth: vi.fn().mockResolvedValue(true),
  };
});

describe('App Component', () => {
  it('renders author branding, API docs link and Keyboard Shortcuts button', () => {
    render(<App />);

    expect(screen.getByTestId('author-link')).toHaveAttribute(
      'href',
      'https://github.com/anbeld12'
    );
    expect(screen.getByText('API Docs ↗')).toBeInTheDocument();
    expect(screen.getByTestId('btn-open-shortcuts')).toBeInTheDocument();
  });

  it('opens and closes keyboard shortcuts modal from footer button', () => {
    render(<App />);

    expect(screen.queryByTestId('shortcuts-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-open-shortcuts'));
    const modal = screen.getByTestId('shortcuts-modal');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-close-shortcuts'));
    expect(screen.queryByTestId('shortcuts-modal')).not.toBeInTheDocument();
  });
});
