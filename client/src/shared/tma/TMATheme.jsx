import React, { useEffect } from 'react';
import { useTMA } from './TMAProvider';

/**
 * TMATheme maps Telegram's theme variables to CSS variables and applies them to the document.
 * This ensures the PWA matches the user's Telegram appearance (Light/Dark mode).
 */
export const TMATheme = ({ children }) => {
  const { WebApp } = useTMA();

  useEffect(() => {
    if (!WebApp?.themeParams) return;

    const root = document.documentElement;
    const tp = WebApp.themeParams;

    // Map Telegram theme variables to CSS properties
    const themeMap = {
      '--tg-bg': tp.bg_color,
      '--tg-text': tp.text_color,
      '--tg-hint': tp.hint_color,
      '--tg-link': tp.link_color,
      '--tg-button': tp.button_color,
      '--tg-button-text': tp.button_text_color,
      '--tg-secondary-bg': tp.secondary_bg_color,
      '--tg-header-bg': tp.header_bg_color,
      '--tg-accent-text': tp.accent_text_color,
      '--tg-section-bg': tp.section_bg_color,
      '--tg-section-header-text': tp.section_header_text_color,
      '--tg-subtitle-text': tp.subtitle_text_color,
      '--tg-destructive-text': tp.destructive_text_color,
    };

    Object.entries(themeMap).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value);
      }
    });

    // Apply basic body styles
    document.body.style.backgroundColor = tp.bg_color || '#ffffff';
    document.body.style.color = tp.text_color || '#000000';
  }, [WebApp]);

  return <>{children}</>;
};
