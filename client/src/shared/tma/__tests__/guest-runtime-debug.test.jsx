import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../App.jsx';
import { TMAProvider } from '../TMAProvider.jsx';
import { LanguageProvider } from '../../i18n/LanguageContext.jsx';

vi.stubEnv('DEV', false);

function renderGuestApp() {
  render(
    <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
      <App />
    </TMAProvider>,
  );

  return waitFor(() => screen.getByRole('heading', { name: /কী করতে চান/i }));
}

async function continueAsGuest() {
  await renderGuestApp();
}

describe('guest mode routing', () => {
  beforeEach(() => {
    cleanup();
    window.location.hash = '#/';
  });

  it('renders the guest dashboard as the landing page', async () => {
    render(
      <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
        <App />
      </TMAProvider>,
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: /কী করতে চান/i })).toBeTruthy());
    expect(screen.getByRole('status', { name: /অতিথি মোড/i })).toBeTruthy();
  });

  it('explains guest data storage and offers a dismissible onboarding guide', async () => {
    render(
      <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
        <App />
      </TMAProvider>,
    );

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

  it('keeps every knowledge top-menu destination rendered after navigation', async () => {
    await continueAsGuest();

    fireEvent.click(within(screen.getByRole('navigation', { name: /প্রধান নেভিগেশন/i })).getByRole('link', { name: /জ্ঞানভাণ্ডার/i }));
    expect(await screen.findByRole('heading', { name: /স্বাগতম!/i })).toBeTruthy();

    const knowledgeNavigation = screen.getByRole('navigation', { name: /জ্ঞানভাণ্ডার নেভিগেশন/i });
    const destinations = [
      { label: 'হিসাব', heading: /হিসাব করুন/i },
      { label: 'পোকা ও রোগ', heading: /পোকামাকড় ও রোগ/i },
      { label: 'ফসল পঞ্জিকা', heading: /ফসল পঞ্জিকা/i },
      { label: 'শব্দকোষ', heading: /শব্দকোষ/i },
      { label: 'শুরু', heading: /স্বাগতম!/i },
    ];

    for (const destination of destinations) {
      fireEvent.click(within(knowledgeNavigation).getByRole('link', { name: destination.label }));
      expect(await screen.findByRole('heading', { name: destination.heading })).toBeTruthy();
    }
  });

  it('opens the calculator from the reported deep-link path', async () => {
    window.location.hash = '#/knowledge/pests/calculator';

    render(
      <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
        <App />
      </TMAProvider>,
    );

    expect(await screen.findByRole('heading', { name: /হিসাব করুন/i })).toBeTruthy();
  });

  it('keeps the dashboard and records page in English after switching language', async () => {
    render(
      <LanguageProvider>
        <TMAProvider authEndpoint="https://example.com/api/auth/telegram">
          <App />
        </TMAProvider>
      </LanguageProvider>,
    );

    await waitFor(() => screen.getByRole('heading', { name: /কী করতে চান/i }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(await screen.findByRole('heading', { name: /What would you like to do/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: /My records/i }));
    expect(await screen.findByRole('heading', { name: /Record today.s farm work/i })).toBeTruthy();
    expect(screen.queryByText(/আজকের জমির কাজ লিখুন/i)).toBeNull();
  });
});
