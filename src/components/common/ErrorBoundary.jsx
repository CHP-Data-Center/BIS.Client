import React from 'react';
import { AlertTriangle, RefreshCw, Bug, Copy, Check, Trash2, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { apiCache } from '../../utils/apiCache';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReloading: false,
      isClearingCache: false,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ isReloading: true });
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  handleClearCacheAndReload = () => {
    this.setState({ isClearingCache: true });
    try {
      apiCache.clearAll();
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Clear storage error:', e);
    }
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  handleCopyReport = () => {
    const reportText = `[BIS Error Report]
Time: ${new Date().toISOString()}
URL: ${window.location.href}
UserAgent: ${navigator.userAgent}
Error: ${this.state.error?.toString() || 'Unknown Error'}
Stack: ${this.state.errorInfo?.componentStack || 'No Component Stack'}`;

    navigator.clipboard.writeText(reportText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  render() {
    if (this.state.hasError) {
      const { isReloading, isClearingCache, copied, showDetails, error, errorInfo } = this.state;

      return (
        <div style={{
          minHeight: '450px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Top Glowing Gradient Bar */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #f59e0b, #ef4444, #3b82f6)',
            }} />

            {/* Glowing Icon Header */}
            <div style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <div style={{
                position: 'absolute',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                filter: 'blur(16px)',
                animation: 'pulse 2s infinite ease-in-out',
              }} />
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.15)',
                position: 'relative',
              }}>
                <ShieldAlert size={32} />
              </div>
            </div>

            {/* Title & Description */}
            <h2 style={{
              fontSize: '22px',
              fontWeight: '800',
              color: 'var(--text-primary, #0f172a)',
              marginBottom: '10px',
              letterSpacing: '-0.4px',
            }}>
              Đã xảy ra lỗi hệ thống giao diện
            </h2>

            <p style={{
              fontSize: '13.5px',
              lineHeight: '1.6',
              color: 'var(--text-secondary, #475569)',
              marginBottom: '28px',
              maxWidth: '460px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Một phần của giao diện gặp sự cố khi xử lý dữ liệu. Bạn hãy thử <strong>tải lại trang</strong> hoặc <strong>xóa cache</strong>. Nếu sự cố tiếp diễn, vui lòng gửi <strong>báo cáo sự cố</strong> cho quản trị viên.
            </p>

            {/* Main Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                {/* Button 1: Reload Page */}
                <button
                  onClick={this.handleReload}
                  disabled={isReloading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '700',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    border: 'none',
                    minWidth: '160px',
                    opacity: isReloading ? 0.75 : 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 28px rgba(37, 99, 235, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.35)';
                  }}
                >
                  <RefreshCw
                    size={16}
                    style={{
                      animation: isReloading ? 'spin 0.8s linear infinite' : 'none',
                    }}
                  />
                  <span>{isReloading ? 'Đang tải lại...' : 'Tải lại trang'}</span>
                </button>

                {/* Button 2: Copy Error Report */}
                <button
                  onClick={this.handleCopyReport}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: copied ? '#dcfce7' : 'var(--bg-surface-2, #f8fafc)',
                    border: '1px solid',
                    borderColor: copied ? '#86efac' : 'var(--border, #e2e8f0)',
                    color: copied ? '#15803d' : 'var(--text-primary, #1e293b)',
                    fontSize: '14px',
                    fontWeight: '700',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) {
                      e.currentTarget.style.background = 'var(--bg-surface-2, #f8fafc)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  {copied ? <Check size={16} color="#15803d" /> : <Bug size={16} style={{ color: '#ef4444' }} />}
                  <span>{copied ? 'Đã sao chép báo cáo!' : 'Báo cáo sự cố'}</span>
                </button>
              </div>

              {/* Button 3: Clear Cache & Reload */}
              <button
                onClick={this.handleClearCacheAndReload}
                disabled={isClearingCache}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                <Trash2 size={13} />
                <span>{isClearingCache ? 'Đang xóa bộ nhớ đệm...' : 'Xóa bộ nhớ đệm & Tải lại (Troubleshoot)'}</span>
              </button>
            </div>

            {/* Expandable Technical Details Drawer */}
            <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border, #e2e8f0)', paddingTop: '16px' }}>
              <button
                onClick={() => this.setState({ showDetails: !showDetails })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <span>{showDetails ? 'Ẩn chi tiết kỹ thuật' : 'Xem chi tiết kỹ thuật (Developer Info)'}</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDetails && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  textAlign: 'left',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid #334155',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}>
                  <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '4px' }}>
                    {error?.toString()}
                  </div>
                  <div style={{ opacity: 0.8, fontSize: '10px', lineHeight: '1.4' }}>
                    {errorInfo?.componentStack || 'No stack trace available.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

