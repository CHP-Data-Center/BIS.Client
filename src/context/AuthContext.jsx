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

  const userKey = user?.email || user?.id;

  // Active package: Kiểm tra user.active_package || user.permissions?.active_package || localStorage || fallback
  const activePackage = (() => {
    if (!user) return 'free';
    if (user.role === 'super_admin') return 'full';
    if (user.role === 'admin' || user.role === 'staff' || user.organization_id) return 'enterprise';
    
    const serverPkg = user.active_package || user.permissions?.active_package;
    if (serverPkg) {
      localStorage.setItem(`bis_active_package_${userKey}`, serverPkg);
      return serverPkg;
    }
    const localPkg = localStorage.getItem(`bis_active_package_${userKey}`);
    if (localPkg) return localPkg;
    return 'free';
  })();

  const selectedSources = (() => {
    if (!user) return [];
    if (activePackage === 'full' || activePackage === 'enterprise' || user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff' || user.organization_id) {
      return ['adb', 'worldbank', 'gov'];
    }
    const serverSrcs = user.selected_sources || user.permissions?.selected_sources;
    if (Array.isArray(serverSrcs) && serverSrcs.length > 0) {
      localStorage.setItem(`bis_selected_sources_${userKey}`, JSON.stringify(serverSrcs));
      return serverSrcs;
    }
    const local = localStorage.getItem(`bis_selected_sources_${userKey}`);
    if (local) {
      try { return JSON.parse(local); } catch { return ['adb', 'worldbank']; }
    }
    return ['adb', 'worldbank'];
  })();

  const isGuest  = !user;
  const isSuperAdmin = user?.role === 'super_admin';
  const isRegionalAdmin = user?.role === 'admin';
  const isAdmin = isSuperAdmin || isRegionalAdmin;
  const isFreeUser = !isAdmin && (user?.role === 'personal' || (activePackage === 'free' && user?.role !== 'staff' && !user?.organization_id));
  const isPersonalUser = !isAdmin && user?.role !== 'staff' && !user?.organization_id && (user?.role === 'personal' || activePackage === 'free' || activePackage === 'single' || activePackage === 'combo2');
  const isEnterpriseUser = isAdmin || user?.role === 'staff' || !!user?.organization_id || activePackage === 'enterprise' || activePackage === 'full';
  const isLoggedIn = !!user;
  const userRegion = user?.region || 'Toàn quốc';

  const hasAiAccess = isSuperAdmin || user?.has_ai === true || user?.permissions?.has_ai === true || localStorage.getItem(`bis_ai_package_${userKey}`) === 'true';

  const hasSourceAccess = useCallback((sourceKey) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff' || user.organization_id) return true;
    if (sourceKey === 'press' || sourceKey === 'news') return true;
    if (activePackage === 'free') return false;
    if (activePackage === 'full' || activePackage === 'enterprise') return true;

    let norm = sourceKey;
    if (sourceKey === 'adb-tenders' || sourceKey === 'adb_projects') norm = 'adb';
    if (sourceKey === 'tbmt' || sourceKey === 'khlcnt' || sourceKey === 'dauthau' || sourceKey === 'procurement') norm = 'gov';
    if (sourceKey === 'wb') norm = 'worldbank';

    return selectedSources.includes(norm);
  }, [user, activePackage, selectedSources]);

  const hasDashboardAccess =
    isSuperAdmin ||
    isRegionalAdmin ||
    user?.can_view_dashboard === true ||
    user?.permissions?.can_view_dashboard === true ||
    localStorage.getItem(`bis_dashboard_access_${userKey}`) === 'true' ||
    ((activePackage === 'full' || activePackage === 'enterprise') && user?.permissions?.can_view_dashboard !== false);

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

  const [showOnboarding, setShowOnboarding] = useState(false);

  const isOnboarded = Boolean(
    (userKey && localStorage.getItem(`bis_onboarded_${userKey}`) === 'true') ||
    user?.permissions?.onboarding_completed
  );

  // Tự động kiểm tra tài khoản mới hoặc chưa setup khởi đầu
  useEffect(() => {
    if (!user) {
      setShowOnboarding(false);
      return;
    }
    const key = user.email || user.id;
    const onboardedLocal = localStorage.getItem(`bis_onboarded_${key}`) === 'true';
    const onboardedServer = !!user.permissions?.onboarding_completed;

    if (!onboardedLocal && !onboardedServer) {
      const dismissedThisSession = sessionStorage.getItem(`bis_onboard_dismissed_${key}`);
      if (!dismissedThisSession) {
        // Cho một khoảng trễ nhỏ (500ms) để giao diện trang chủ mount mượt mà trước khi mở modal
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const openOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

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
        isFreeUser,
        isPersonalUser,
        isEnterpriseUser,
        isAdmin,
        isSuperAdmin,
        isRegionalAdmin,
        userRegion,
        activePackage,
        selectedSources,
        hasSourceAccess,
        hasDashboardAccess,
        hasAiAccess,
        hasPermission,
        isLoggedIn,
        loading,
        showOnboarding,
        setShowOnboarding,
        openOnboarding,
        closeOnboarding,
        isOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
