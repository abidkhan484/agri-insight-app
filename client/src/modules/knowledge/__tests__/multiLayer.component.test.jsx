import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MultiLayer from '../pages/MultiLayer';

describe('Multi-layer compatibility page', () => {
  it('shows the complete catalogue and searchable controls', () => {
    render(<MultiLayer />);

    expect(screen.getByRole('heading', { name: /একসঙ্গে মানানসই ফসল/i })).toBeTruthy();
    expect(screen.getByText('110 / 110')).toBeTruthy();
    expect(screen.getByRole('searchbox')).toBeTruthy();
  });

  it('narrows visible combinations when a crop is searched', () => {
    render(<MultiLayer />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Turmeric' } });

    expect(screen.getByText('64 / 110')).toBeTruthy();
  });

  it('shows an empty state when no crop matches', () => {
    render(<MultiLayer />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dragon fruit' } });

    expect(screen.getByText(/কোনো সমন্বয় পাওয়া যায়নি/)).toBeTruthy();
    expect(screen.getByText('0 / 110')).toBeTruthy();
  });
});
