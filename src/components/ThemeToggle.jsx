// src/components/ThemeToggle.jsx
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [uiTheme, setUiTheme] = useState(() => document.documentElement.getAttribute('data-ui-theme') || 'basic');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setUiTheme(document.documentElement.getAttribute('data-ui-theme') || 'basic');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-ui-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Hide sun/moon toggle button for Classic Retro, Luxury 24K Gold, and Royal Sapphire themes
  if (uiTheme === 'classic' || uiTheme === 'luxury' || uiTheme === 'sapphire') {
    return null;
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'light' ? 'Chuyển sang Dark mode' : 'Chuyển sang Light mode'}
      id="btn-theme-toggle"
    >
      {theme === 'light'
        ? <Moon size={16} strokeWidth={2} />
        : <Sun  size={16} strokeWidth={2} />}
    </button>
  );
}
