import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../../../App.jsx';
import { TMAProvider } from '../TMAProvider.jsx';

vi.stubEnv('DEV', false);
describe('guest mode routing', () => {
  it('renders the dashboard after continuing as guest', async () => {
    render(
      <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
        <App />
      </TMAProvider>,
    );

    await waitFor(() => expect(screen.getByText(/অতিথি হিসেবে চালিয়ে যান/)).toBeTruthy());
    screen.getByText(/অতিথি হিসেবে চালিয়ে যান/).click();
    await waitFor(() => expect(screen.getByText(/কৃষি রেকর্ড/)).toBeTruthy());
  });
});
