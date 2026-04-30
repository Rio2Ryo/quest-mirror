import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  window.history.replaceState(null, '', '/');
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
    },
    configurable: true,
  });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

describe('App interactions', () => {
  it('updates the RPG card from user input and action buttons', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('冒険者名（任意）'), 'リョウ');
    expect(screen.getByRole('heading', { name: 'リョウ' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /補給する/ }));
    expect(screen.getByDisplayValue('おやつ神殿で補給した。世界の解像度が上がった。')).toBeInTheDocument();
    expect(screen.getByText(/行動で世界線が少しずれました/)).toBeInTheDocument();
  });

  it('copies a shareable result', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'コピー' }));

    expect(screen.getByText(/共有文をコピーしました/)).toBeInTheDocument();
  });
});
