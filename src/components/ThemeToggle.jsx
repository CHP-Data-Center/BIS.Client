// src/components/ThemeToggle.jsx
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
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
