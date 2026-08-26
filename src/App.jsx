// src/App.jsx
import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CrawlProvider } from './context/CrawlContext';
import { LanguageProvider, useLang } from './context/LanguageContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';
import { syncUserTheme } from './utils/theme';
import ThemeFxOverlay from './components/common/ThemeFxOverlay';
import ThemePageLoader from './components/common/ThemePageLoader';
import OnboardingModal from './components/common/OnboardingModal';
import { tUI } from './locales';

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
const AdbProjectDetailPage = lazy(() => import('./pages/AdbProjectDetailPage'));
const ProcurementDetailPage = lazy(() => import('./pages/ProcurementDetailPage'));
const GlobalSearchPage = lazy(() => import('./pages/GlobalSearchPage'));

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));

function PageLoader({ message, fullScreen = true }) {
  return <ThemePageLoader message={message} minHeight={fullScreen ? '100vh' : '65vh'} />;
}

// Layout wrapper cho các trang cần header + sidebar
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, showOnboarding, closeOnboarding } = useAuth();

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
      {/* Popup Setup Khởi Đầu cho tài khoản mới */}
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
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

// Route dành riêng cho Dashboard / Enterprise
function DashboardRoute({ children }) {
  const { isLoggedIn, hasDashboardAccess, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!hasDashboardAccess) return <Navigate to="/news/press" replace />;
  return children;
}

const EnterpriseRoute = DashboardRoute;

// Route kiểm tra quyền truy cập theo từng nguồn dữ liệu (adb, worldbank, gov)
function SourceRoute({ source, children }) {
  const { isLoggedIn, hasSourceAccess, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!hasSourceAccess(source)) return <Navigate to="/upgrade" replace />;
  return children;
}

// Route dành riêng cho Trợ Lý AI (Super Admin hoặc người dùng đã mua gói AI)
function AiRoute({ children }) {
  const { isLoggedIn, hasAiAccess, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!hasAiAccess) return <Navigate to="/upgrade" replace />;
  return children;
}

// Redirect mặc định theo vai trò người dùng
function DefaultRedirect() {
  const { hasDashboardAccess, isLoggedIn, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (hasDashboardAccess) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/news/press" replace />;
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
      <div className="empty-sub">{tUI('ui.tinh-nang-dang-duoc-phat-trien-se-ra-mat-som')}</div>
    </div>
  );
}

/** Bọc cây route và remount khi đổi ngôn ngữ — các nhãn dùng tUI() (không phải
 *  hook) đọc ngôn ngữ từ localStorage nên cần remount mới cập nhật. */
function LocalizedTree({ children }) {
  const { lang } = useLang();
  return <div key={lang} style={{ display: 'contents' }}>{children}</div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
      <CrawlProvider>
        <ThemeFxOverlay />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <LocalizedTree>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected — Dashboard */}
              <Route path="/dashboard" element={
                <DashboardRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </DashboardRoute>
              } />

              {/* Protected — World Bank */}
              <Route path="/worldbank" element={
                <SourceRoute source="worldbank">
                  <AppLayout><WorldBankView /></AppLayout>
                </SourceRoute>
              } />

              <Route path="/worldbank/project/:id" element={
                <SourceRoute source="worldbank">
                  <AppLayout><WbProjectDetailPage /></AppLayout>
                </SourceRoute>
              } />

              <Route path="/worldbank/:id" element={
                <SourceRoute source="worldbank">
                  <AppLayout><WbProjectDetailPage /></AppLayout>
                </SourceRoute>
              } />

              {/* Protected — ADB */}
              <Route path="/adb" element={
                <SourceRoute source="adb">
                  <AppLayout><WorldBankView type="adb" /></AppLayout>
                </SourceRoute>
              } />

              <Route path="/adb/project/:id" element={
                <SourceRoute source="adb">
                  <AppLayout><AdbProjectDetailPage /></AppLayout>
                </SourceRoute>
              } />

              <Route path="/adb/:id" element={
                <SourceRoute source="adb">
                  <AppLayout><AdbProjectDetailPage /></AppLayout>
                </SourceRoute>
              } />

              {/* Chi tiết gói thầu TBMT/KHLCNT — xem trong app thay vì sang muasamcong */}
              <Route path="/procurement/:id" element={
                <SourceRoute source="gov">
                  <AppLayout><ProcurementDetailPage /></AppLayout>
                </SourceRoute>
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

              {/* Tìm kiếm toàn cục (ô search header): quét 4 kho, chia mục */}
              <Route path="/search" element={
                <ProtectedRoute>
                  <AppLayout><GlobalSearchPage /></AppLayout>
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

              <Route path="/projects" element={
                <ProtectedRoute>
                  <AppLayout><ProjectsPage /></AppLayout>
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
                <DashboardRoute>
                  <AppLayout><ComingSoon title={tUI('ui.xu-huong-analytics')} /></AppLayout>
                </DashboardRoute>
              } />

              <Route path="/reports" element={
                <DashboardRoute>
                  <AppLayout><ComingSoon title={tUI('ui.bao-cao-ai')} /></AppLayout>
                </DashboardRoute>
              } />

              <Route path="/help" element={
                <ProtectedRoute>
                  <AppLayout><ComingSoon title={tUI('ui.trung-tam-ho-tro')} /></AppLayout>
                </ProtectedRoute>
              } />

              {/* Default redirect */}
              <Route path="/" element={<DefaultRedirect />} />
              <Route path="*" element={<DefaultRedirect />} />
            </Routes>
          </Suspense>
          </LocalizedTree>
        </BrowserRouter>
      </CrawlProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
