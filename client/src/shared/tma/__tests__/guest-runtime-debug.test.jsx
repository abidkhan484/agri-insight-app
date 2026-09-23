import { render, screen, waitFor, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../../../App.jsx';
import { TMAProvider } from '../TMAProvider.jsx';

vi.stubEnv('DEV', false);

function renderGuestApp() {
  render(
    <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
      <App />
    </TMAProvider>,
  );

  return waitFor(() => screen.getByText(/অতিথি হিসেবে চালিয়ে যান/));
}

async function continueAsGuest() {
  (await renderGuestApp()).click();
  await waitFor(() => screen.getByRole('heading', { name: /কী করতে চান/i }));
}

describe('guest mode routing', () => {
  it('renders the dashboard after continuing as guest', async () => {
    render(
      <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
        <App />
      </TMAProvider>,
    );

    await waitFor(() => expect(screen.getByText(/অতিথি হিসেবে চালিয়ে যান/)).toBeTruthy());
    screen.getByText(/অতিথি হিসেবে চালিয়ে যান/).click();
    await waitFor(() => expect(screen.getByRole('heading', { name: /কী করতে চান/i })).toBeTruthy());
  });

  it('explains guest data storage and offers a dismissible onboarding guide', async () => {
    render(
      <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
        <App />
      </TMAProvider>,
    );

    await waitFor(() => expect(screen.getByText(/অতিথি হিসেবে চালিয়ে যান/)).toBeTruthy());
    screen.getByText(/অতিথি হিসেবে চালিয়ে যান/).click();

    await waitFor(() => expect(screen.getByRole('status', { name: /অতিথি মোড/i })).toBeTruthy());
    expect(screen.getByText(/এই ডিভাইসেই সংরক্ষিত/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /কীভাবে শুরু করবেন/i })).toBeTruthy();

    screen.getByRole('button', { name: /বুঝেছি/i }).click();
    await waitFor(() => expect(screen.queryByRole('heading', { name: /কীভাবে শুরু করবেন/i })).toBeNull());
  });

  it('renders task navigation with Bangla labels and accessible landmarks', async () => {
    render(
      <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
        <App />
      </TMAProvider>,
    );

    await waitFor(() => expect(screen.getByText(/অতিথি হিসেবে চালিয়ে যান/)).toBeTruthy());
    screen.getByText(/অতিথি হিসেবে চালিয়ে যান/).click();

    const navigation = await waitFor(() => screen.getByRole('navigation', { name: /প্রধান নেভিগেশন/i }));
    expect(within(navigation).getByRole('link', { name: /আমার রেকর্ড/i })).toBeTruthy();
    expect(within(navigation).getByRole('link', { name: /রোগ ও পোকা/i })).toBeTruthy();
    expect(within(navigation).getByRole('link', { name: /জ্ঞানভাণ্ডার/i })).toBeTruthy();
  });

  it('supports the guest journey across records, knowledge, disease, and map routes', async () => {
    await continueAsGuest();

    fireEvent.click(screen.getByRole('link', { name: /আমার রেকর্ড/i }));
    expect(await screen.findByRole('heading', { name: /আজকের জমির কাজ লিখুন/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'সংরক্ষণ করুন' }));
    expect(await screen.findByText('জমি নির্বাচন করুন')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: /জ্ঞানভাণ্ডার/i }));
    expect(await screen.findByRole('heading', { name: /স্বাগতম!/i })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/জ্ঞানভাণ্ডারে খুঁজুন/i), { target: { value: 'জীবামৃত' } });
    expect(await screen.findByText(/জীবামৃত তৈরি ও প্রয়োগ/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: /রোগ ও পোকা/i }));
    expect(await screen.findByRole('heading', { name: /ফসলের রোগ ও পোকা শনাক্তকরণ/i })).toBeTruthy();
    expect(screen.getByText(/ইন্টারনেট সংযোগ প্রয়োজন/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: /কমিউনিটি ম্যাপ/i }));
    expect(await screen.findByText(/মানচিত্র লোড হচ্ছে/i)).toBeTruthy();
  });
});
