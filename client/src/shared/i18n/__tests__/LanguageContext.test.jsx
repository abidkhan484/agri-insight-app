import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider, LanguageSwitcher, useLanguage } from '../LanguageContext';

function Probe() {
  const { language } = useLanguage();
  return <span data-testid="language">{language}</span>;
}

describe('LanguageContext', () => {
  beforeEach(() => window.localStorage.clear());

  it('starts in Bangla and switches to English', () => {
    render(<LanguageProvider><LanguageSwitcher /><Probe /></LanguageProvider>);
    expect(screen.getByTestId('language')).toHaveTextContent('bn');
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('agri-insight-language')).toBe('en');
  });
});
