// src/App.jsx
import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CrawlProvider } from './context/CrawlContext';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';
import { syncUserTheme } from './utils/theme';
import ThemeFxOverlay from './components/common/ThemeFxOverlay';

// Dynamic imports for route-level Code Splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const KeywordsPage = lazy(() => import('./pages/KeywordsPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const AiPage = lazy(() => import('./pages/AiPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));
const WorldBankView = lazy(() => import('./components/WorldBankView'));
const WbProjectDetailPage = lazy(() => import('./pages/WbProjectDetailPage'));

function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12, background: 'transparent',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-500)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đang tải trang...</span>
    </div>
  );
}

// Layout wrapper cho các trang cần header + sidebar
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
    // Khi di chuyển giữa các trang, đồng bộ giao diện của user đó
    if (location.pathname !== '/upgrade') {
      syncUserTheme(user);
    }
  }, [location.pathname, user]);

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarOpen(v => !v)} isSidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="main-content" style={{ position: 'relative' }}>
        <div key={`loader-${location.pathname}`} className="route-top-loader" />
        <Suspense fallback={<PageLoader />}>
          <div key={location.pathname} className="page-transition">
            {children}
          </div>
        </Suspense>
      </main>
      <ScrollToTop />
    </div>
  );
}

// Route được bảo vệ: chỉ truy cập khi đã đăng nhập
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

// Route dành riêng cho Enterprise Users (Dashboard, ADB, WB, Đấu thầu, AI Assistant)
function EnterpriseRoute({ children }) {
  const { isLoggedIn, isPersonalUser, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (isPersonalUser) return <Navigate to="/news/press" replace />;
  return children;
}

// Route dành riêng cho Trợ Lý AI (Super Admin hoặc người dùng đã mua gói AI)
function AiRoute({ children }) {
  const { isLoggedIn, user, isSuperAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const userKey = user?.email || user?.id;
  const hasAiAccess = isSuperAdmin || user?.has_ai === true || localStorage.getItem(`bis_ai_package_${userKey}`) === 'true';
  if (!hasAiAccess) return <Navigate to="/upgrade" replace />;
  return children;
}

// Redirect mặc định theo vai trò người dùng
function DefaultRedirect() {
  const { isPersonalUser, isLoggedIn, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (isPersonalUser) return <Navigate to="/news/press" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Route dành riêng cho Admin
function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn || !isAdmin) return <Navigate to="/news/press" replace />;
  return children;
}

// ComingSoon placeholder
function ComingSoon({ title }) {
  return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-icon">🚧</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">Tính năng đang được phát triển — sẽ ra mắt sớm</div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
      <CrawlProvider>
        <ThemeFxOverlay />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected — dành cho Enterprise */}
              <Route path="/dashboard" element={
                <EnterpriseRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </EnterpriseRoute>
              } />

              <Route path="/worldbank" element={
                <EnterpriseRoute>
                  <AppLayout><WorldBankView /></AppLayout>
                </EnterpriseRoute>
              } />

              <Route path="/worldbank/project/:id" element={
                <EnterpriseRoute>
                  <AppLayout><WbProjectDetailPage /></AppLayout>
                </EnterpriseRoute>
              } />

              <Route path="/worldbank/:id" element={
                <EnterpriseRoute>
                  <AppLayout><WbProjectDetailPage /></AppLayout>
                </EnterpriseRoute>
              } />

              <Route path="/ai-chat" element={
                <AiRoute>
                  <AppLayout><AiPage /></AppLayout>
                </AiRoute>
              } />

              {/* Protected — tất cả người dùng hợp lệ */}
              <Route path="/news/:source" element={
                <ProtectedRoute>
                  <AppLayout><NewsPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/article/:id" element={
                <ProtectedRoute>
                  <AppLayout><ArticlePage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/keywords" element={
                <ProtectedRoute>
                  <AppLayout><KeywordsPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/bookmarks" element={
                <ProtectedRoute>
                  <AppLayout><BookmarksPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <AppLayout><SettingsPage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/upgrade" element={
                <ProtectedRoute>
                  <AppLayout><UpgradePage /></AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <AdminRoute>
                  <AppLayout><AdminPage /></AppLayout>
                </AdminRoute>
              } />

              <Route path="/trending" element={
                <EnterpriseRoute>
                  <AppLayout><ComingSoon title="Xu Hướng & Analytics" /></AppLayout>
                </EnterpriseRoute>
              } />

              <Route path="/reports" element={
                <EnterpriseRoute>
                  <AppLayout><ComingSoon title="Báo Cáo AI" /></AppLayout>
                </EnterpriseRoute>
              } />

              <Route path="/help" element={
                <ProtectedRoute>
                  <AppLayout><ComingSoon title="Trung Tâm Hỗ Trợ" /></AppLayout>
                </ProtectedRoute>
              } />

              {/* Default redirect */}
              <Route path="/" element={<DefaultRedirect />} />
              <Route path="*" element={<DefaultRedirect />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CrawlProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
