// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';
import { syncUserTheme } from '../utils/theme';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);       // UserOut | null
  const [token, setToken]     = useState(() => localStorage.getItem('bis_token'));
  const [loading, setLoading] = useState(true);       // init check
  const [loginError, setLoginError] = useState('');

  // Khởi tạo: nếu có token → gọi /auth/me để xác thực
  useEffect(() => {
    if (!token) {
      syncUserTheme(null);
      setLoading(false);
      return;
    }
    authService.getMe()
      .then((me) => {
        setUser(me);
        syncUserTheme(me);
      })
      .catch(() => {
        // Token hết hạn hoặc không hợp lệ
        localStorage.removeItem('bis_token');
        localStorage.removeItem('bis_user');
        setToken(null);
        syncUserTheme(null);
      })
      .finally(() => setLoading(false));
  }, []); // chỉ chạy khi mount

  const login = useCallback(async (email, password, rememberMe = false) => {
    setLoginError('');
    try {
      const res = await authService.login(email, password, rememberMe);
      localStorage.setItem('bis_token', res.access_token);
      setToken(res.access_token);

      // Lấy thông tin user sau khi đăng nhập
      const me = await authService.getMe(res.access_token);
      setUser(me);
      syncUserTheme(me);
      setLoginError('');
      return me;
    } catch (err) {
      let msg = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;
        if (status === 401) {
          msg = typeof detail === 'string' ? detail : 'Email hoặc mật khẩu không chính xác.';
        } else if (status === 403) {
          msg = typeof detail === 'string' ? detail : 'Tài khoản đã bị khóa hoặc tạm dừng. Vui lòng liên hệ Quản trị viên.';
        } else if (detail) {
          if (typeof detail === 'string') {
            if (detail === 'Dữ liệu không hợp lệ.') {
              msg = 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại email và mật khẩu.';
            } else {
              msg = detail;
            }
          } else if (Array.isArray(detail) && detail.length > 0) {
            const first = detail[0];
            const loc = first?.loc || [];
            if (loc.includes('email')) {
              msg = 'Định dạng email không hợp lệ.';
            } else if (loc.includes('password')) {
              msg = 'Vui lòng nhập mật khẩu đầy đủ.';
            } else {
              msg = first?.msg || 'Thông tin đăng nhập không hợp lệ. Vui lòng thử lại.';
            }
          }
        }
      } else if (err.request) {
        msg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
      }
      setLoginError(msg);
      return null;
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential, accessToken = null, userInfo = null) => {
    setLoginError('');
    try {
      const res = await authService.googleLogin(credential, accessToken, userInfo);
      localStorage.setItem('bis_token', res.access_token);
      setToken(res.access_token);

      const me = await authService.getMe(res.access_token);
      setUser(me);
      syncUserTheme(me);
      setLoginError('');
      return me;
    } catch (err) {
      let msg = 'Đăng nhập Google không thành công. Vui lòng thử lại.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          msg = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          msg = detail[0]?.msg || 'Dữ liệu xác thực không hợp lệ.';
        }
      } else if (err.userMessage) {
        msg = err.userMessage;
      } else if (err.message) {
        msg = err.message;
      }
      setLoginError(msg);
      return null;
    }
  }, []);

  /** Nạp lại thông tin tài khoản từ server (vd sau khi đổi tên phân vùng). */
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('bis_token')) return null;
    try {
      const me = await authService.getMe();
      setUser(me);
      return me;
    } catch {
      return null; // token hỏng sẽ được xử lý ở luồng gọi API khác
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bis_token');
    localStorage.removeItem('bis_user');
    setToken(null);
    setUser(null);
    syncUserTheme(null);
  }, []);

  const isGuest  = !user;
  const isPersonalUser = user?.role === 'personal';
  const isEnterpriseUser = user && user.role !== 'personal';
  const isSuperAdmin = user?.role === 'super_admin';
  const isRegionalAdmin = user?.role === 'admin';
  const isAdmin = isSuperAdmin || isRegionalAdmin;
  const isLoggedIn = !!user;
  const userRegion = user?.region || 'Toàn quốc';

  const hasPermission = useCallback((permissionKey) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    if (!user.permissions) return true; // Mặc định đầy đủ nếu chưa gán giới hạn
    return user.permissions[permissionKey] !== false;
  }, [user]);

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
        refreshUser,
        loginError,
        setLoginError,
        isGuest,
        isPersonalUser,
        isEnterpriseUser,
        isAdmin,
        isSuperAdmin,
        isRegionalAdmin,
        userRegion,
        hasPermission,
        isLoggedIn,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
