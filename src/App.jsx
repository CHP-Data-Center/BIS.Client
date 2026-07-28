// src/App.jsx
import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CrawlProvider } from './context/CrawlContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewsPage from './pages/NewsPage';
import ArticlePage from './pages/ArticlePage';
import KeywordsPage from './pages/KeywordsPage';
import BookmarksPage from './pages/BookmarksPage';
import AiPage from './pages/AiPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import WorldBankView from './components/WorldBankView';

// Error Boundary cho React
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, background: 'var(--bg-base)', padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            Đã xảy ra lỗi không mong muốn
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 460, fontFamily: 'monospace', background: 'var(--bg-surface-2)', padding: 12, borderRadius: 8 }}>
            {this.state.error?.toString() || 'Unknown error'}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { window.location.href = '/dashboard'; }}
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
          >
            Quay lại Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Layout wrapper cho các trang cần header + sidebar
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarOpen(v => !v)} isSidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="main-content">
        {children}
      </main>
      <ScrollToTop />
    </div>
  );
}

// Route được bảo vệ: chỉ truy cập khi đã đăng nhập
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, background: 'var(--bg-base)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-500)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Đang tải...</span>
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

// Route dành riêng cho Admin
function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn || !isAdmin) return <Navigate to="/dashboard" replace />;
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
      <CrawlProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — tất cả cần đăng nhập */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><DashboardPage /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/news/:source" element={
              <ProtectedRoute>
                <AppLayout><NewsPage /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/worldbank" element={
              <ProtectedRoute>
                <AppLayout><WorldBankView /></AppLayout>
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

            <Route path="/ai-chat" element={
              <ProtectedRoute>
                <AppLayout><AiPage /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout><SettingsPage /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <AdminRoute>
                <AppLayout><AdminPage /></AppLayout>
              </AdminRoute>
            } />

            <Route path="/trending" element={
              <ProtectedRoute>
                <AppLayout><ComingSoon title="Xu Hướng & Analytics" /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <AppLayout><ComingSoon title="Báo Cáo AI" /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/help" element={
              <ProtectedRoute>
                <AppLayout><ComingSoon title="Trung Tâm Hỗ Trợ" /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </CrawlProvider>
    </ErrorBoundary>
  );
}
