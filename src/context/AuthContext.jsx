// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);       // UserOut | null
  const [token, setToken]     = useState(() => localStorage.getItem('bis_token'));
  const [loading, setLoading] = useState(true);       // init check
  const [loginError, setLoginError] = useState('');

  // Khởi tạo: nếu có token → gọi /auth/me để xác thực
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authService.getMe()
      .then((me) => setUser(me))
      .catch(() => {
        // Token hết hạn hoặc không hợp lệ
        localStorage.removeItem('bis_token');
        localStorage.removeItem('bis_user');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []); // chỉ chạy khi mount

  const login = useCallback(async (email, password) => {
    setLoginError('');
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('bis_token', res.access_token);
      setToken(res.access_token);

      // Lấy thông tin user sau khi đăng nhập
      const me = await authService.getMe();
      setUser(me);
      setLoginError('');
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Email hoặc mật khẩu không đúng.';
      setLoginError(msg);
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential, accessToken = null) => {
    setLoginError('');
    try {
      const res = await authService.googleLogin(credential, accessToken);
      localStorage.setItem('bis_token', res.access_token);
      setToken(res.access_token);

      const me = await authService.getMe();
      setUser(me);
      setLoginError('');
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Đăng nhập Google thất bại.';
      setLoginError(msg);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bis_token');
    localStorage.removeItem('bis_user');
    setToken(null);
    setUser(null);
  }, []);

  const isGuest  = !user;
  const isAdmin  = user?.role === 'admin';
  const isLoggedIn = !!user;

  // Tên viết tắt (avatar initials)
  const initials = user
    ? (user.display_name || user.email || 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'KH';

  // Augment user với initials & name alias
  const augmentedUser = user
    ? { ...user, initials, name: user.display_name || user.email }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: augmentedUser,
        token,
        login,
        loginWithGoogle,
        logout,
        loginError,
        setLoginError,
        isGuest,
        isAdmin,
        isLoggedIn,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
