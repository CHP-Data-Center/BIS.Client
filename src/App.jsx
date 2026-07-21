// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewsPage from './pages/NewsPage';
import ArticlePage from './pages/ArticlePage';

// Guest mode: everyone can access. Login is optional/decorative for now.
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <ScrollToTop />
    </div>
  );
}

// Placeholder pages for sidebar items not yet implemented
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
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <AppLayout><DashboardPage /></AppLayout>
        } />

        <Route path="/news/:source" element={
          <AppLayout><NewsPage /></AppLayout>
        } />

        <Route path="/article/:id" element={
          <AppLayout><ArticlePage /></AppLayout>
        } />

        <Route path="/trending" element={
          <AppLayout><ComingSoon title="Xu Hướng & Analytics" /></AppLayout>
        } />

        <Route path="/reports" element={
          <AppLayout><ComingSoon title="Báo Cáo AI" /></AppLayout>
        } />

        <Route path="/ai-engine" element={
          <AppLayout><ComingSoon title="AI Engine Monitor" /></AppLayout>
        } />

        <Route path="/settings" element={
          <AppLayout><ComingSoon title="Cài Đặt Hệ Thống" /></AppLayout>
        } />

        <Route path="/help" element={
          <AppLayout><ComingSoon title="Trung Tâm Hỗ Trợ" /></AppLayout>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
