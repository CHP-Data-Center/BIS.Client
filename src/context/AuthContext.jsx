// src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const DEMO_USERS = [
  { email: 'admin@iih.vn', password: 'iih2026', name: 'Admin IIH', role: 'admin', initials: 'AI' },
  { email: 'demo@iih.vn',  password: 'demo123',  name: 'Demo User', role: 'viewer', initials: 'DU' },
];

// Guest user - auto-logged in
const GUEST_USER = { email: 'guest@iih.vn', name: 'Khách', role: 'guest', initials: 'KH' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('iih-user');
      return saved ? JSON.parse(saved) : GUEST_USER; // default = guest
    } catch { return GUEST_USER; }
  });
  const [loginError, setLoginError] = useState('');

  const login = (email, password) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safe } = found;
      setUser(safe);
      setLoginError('');
      sessionStorage.setItem('iih-user', JSON.stringify(safe));
      return true;
    }
    setLoginError('Email hoặc mật khẩu không đúng.');
    return false;
  };

  const logout = () => {
    setUser(GUEST_USER);
    sessionStorage.removeItem('iih-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginError, setLoginError, isGuest: user?.role === 'guest' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
