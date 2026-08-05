// src/pages/UpgradePage.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Check, X, Building2, Globe, ShoppingBag, Bot, Sparkles, Crown,
  ShieldCheck, CheckCircle2, ArrowRight, ChevronRight, Star, Layers, Lock, Gift, PhoneCall, Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { getUserTheme, setUserTheme, syncUserTheme, applyTheme } from '../utils/theme';

export default function UpgradePage() {
  const { user, isPersonalUser } = useAuth();
  const nav = useNavigate();

  const billingCycleState = useState('monthly');
  const [billingCycle, setBillingCycle] = billingCycleState;
  const [selectedComboSources, setSelectedComboSources] = useState(['adb', 'worldbank']);
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);
  const [phone, setPhone] = useState('');

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [activeUiTheme, setActiveUiTheme] = useState(() => getUserTheme(user));

  const handleApplyTheme = (themeKey) => {
    setActiveUiTheme(themeKey);
    if (isSuperAdmin) {
      setUserTheme(user, themeKey);
    } else {
      applyTheme(themeKey);
    }
  };

  useEffect(() => {
    const saved = getUserTheme(user);
    setActiveUiTheme(saved);
    applyTheme(saved);

    return () => {
      syncUserTheme(user);
    };
  }, [user]);

  // Discount multiplier for yearly billing (20% off)
  const discount = billingCycle === 'yearly' ? 0.8 : 1.0;

  // Lắng nghe phím ESC để đóng Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setShowModal(false);
      }
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const toggleSourceSelection = (sourceKey) => {
    if (selectedComboSources.includes(sourceKey)) {
      if (selectedComboSources.length > 1) {
        setSelectedComboSources(selectedComboSources.filter(s => s !== sourceKey));
      }
    } else {
      if (selectedComboSources.length < 2) {
        setSelectedComboSources([...selectedComboSources, sourceKey]);
      } else {
        setSelectedComboSources([selectedComboSources[1], sourceKey]);
      }
    }
  };

  const handleOpenUpgradeModal = (pkg) => {
    setSelectedPackage(pkg);
    setUpgradeSubmitted(false);
    setShowModal(true);
  };

  const handleConfirmUpgrade = (e) => {
    e.preventDefault();
    setUpgradeSubmitted(true);
    setTimeout(() => {
      setShowModal(false);
      setUpgradeSubmitted(false);
    }, 2800);
  };

  return (
    <div className="upgrade-page-wrapper" style={{ padding: '28px 32px 80px', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
      <style>{`
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPopIn {
          0% { transform: scale(0.9) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 8px 30px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 14px 45px rgba(168, 85, 247, 0.35); }
        }
        .upgrade-pricing-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .upgrade-pricing-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .source-pill-select {
          transition: all 0.2s ease;
        }
        .source-pill-select:hover {
          transform: translateY(-1px) scale(1.03);
        }
        .price-text-anim {
          transition: all 0.25s ease;
        }
      `}</style>

      {/* ── Top Hero Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 44, position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 18px', borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.14), rgba(59,130,246,0.14))',
          border: '1px solid rgba(168,85,247,0.35)',
          fontSize: 12, fontWeight: 800, color: '#9333ea', marginBottom: 16,
          boxShadow: '0 4px 12px rgba(168,85,247,0.1)',
        }}>
          <Sparkles size={14} style={{ color: '#a855f7' }} />
          BẢNG GIÁ NÂNG CẤP DỊCH VỤ DỮ LIỆU & UI/UX THEMES
        </div>

        <h1 style={{
          fontSize: 34, fontWeight: 900, color: 'var(--text-primary)',
          letterSpacing: '-0.6px', marginBottom: 12, lineHeight: 1.2,
        }}>
          Tối Ưu Sức Mạnh Dữ Liệu Theo Nhu Cầu
        </h1>

        <p style={{
          fontSize: 15, color: 'var(--text-secondary)', maxWidth: 680,
          margin: '0 auto 30px', lineHeight: 1.6,
        }}>
          Dễ dàng mở khóa từng nguồn dữ liệu chuyên sâu <b>ADB, World Bank, Đấu Thầu Công</b>, <b>Trợ Lý AI Gemini</b> hoặc các bộ <b>Giao Diện UI/UX Độc Quyền</b> theo tháng với chi phí tiết kiệm nhất.
        </p>

        {/* Billing Cycle Switcher */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: 5, background: 'var(--bg-surface-2)',
          border: '1px solid var(--border)', borderRadius: 32,
          boxShadow: 'var(--shadow-md)',
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '9px 22px', borderRadius: 26, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              background: billingCycle === 'monthly' ? 'var(--brand-600)' : 'transparent',
              color: billingCycle === 'monthly' ? 'white' : 'var(--text-secondary)',
              boxShadow: billingCycle === 'monthly' ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
            }}
          >
            Thanh Toán Theo Tháng
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '9px 22px', borderRadius: 26, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 6,
              background: billingCycle === 'yearly' ? 'var(--brand-600)' : 'transparent',
              color: billingCycle === 'yearly' ? 'white' : 'var(--text-secondary)',
              boxShadow: billingCycle === 'yearly' ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
            }}
          >
            Thanh Toán Theo Năm
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10,
              background: billingCycle === 'yearly' ? '#fef08a' : 'linear-gradient(135deg, #f59e0b, #ec4899)',
              color: billingCycle === 'yearly' ? '#854d0e' : 'white',
            }}>
              GIẢM 20%
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Pricing Cards Grid (Fixed Equal Header Block & Alignments) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20, marginBottom: 50, position: 'relative', zIndex: 1, alignItems: 'stretch',
      }}>

        {/* 1. Gói Cá Nhân (Mặc định) */}
        <div className="upgrade-pricing-card">
          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  GÓI CÁ NHÂN
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  Báo Chí Miễn Phí
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Đọc tin tức báo chí toàn quốc không giới hạn.
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-2)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Miễn phí đọc tin báo chí cá nhân thường nhật.</span>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>0đ</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>/ tháng</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                Miễn phí vĩnh viễn
              </div>
            </div>

            <button
              disabled={isPersonalUser}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12, marginBottom: 24 }}
            >
              {isPersonalUser ? '✓ ĐANG SỬ DỤNG' : 'Miễn Phí Mặc Định'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>TÍNH NĂNG BAO GỒM:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Toàn bộ <b>Tin Tức Báo Chí</b> toàn quốc</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Quản lý từ khóa cá nhân</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Lưu bài viết yêu thích (Bookmarks)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              <X size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>Dự án ADB & World Bank</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              <X size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>Thông báo Đấu Thầu Công</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              <X size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>Trợ lý AI hỏi-đáp 24/7</span>
            </div>
          </div>
        </div>

        {/* 2. Gói Combo 2 Nguồn Dữ Liệu (HOT COMBO) */}
        <div className="upgrade-pricing-card" style={{
          border: '2px solid #3b82f6', animation: 'glowPulse 4s infinite ease-in-out',
        }}>
          <div style={{
            position: 'absolute', top: -14, right: 20,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px',
            borderRadius: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
            boxShadow: '0 4px 10px rgba(59,130,246,0.4)',
          }}>
            🔥 COMBO 2 NGUỒN HOT
          </div>

          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {billingCycle === 'yearly' ? '⚡️ TIẾT KIỆM 32% (GIẢM THEO NĂM)' : '⚡️ TIẾT KIỆM 15% COMBO'}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  Combo 2 Nguồn Dữ Liệu
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Chọn 2 nguồn dữ liệu chuyên sâu tùy thích theo nhu cầu.
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-2)', padding: 8, borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.4 }}>
                  CHỌN 2 NGUỒN TÙY Ý:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[
                    { key: 'adb', label: 'ADB', icon: <Building2 size={11} color="#f59e0b" /> },
                    { key: 'worldbank', label: 'World Bank', icon: <Globe size={11} color="#10b981" /> },
                    { key: 'gov', label: 'Đấu Thầu', icon: <ShoppingBag size={11} color="#8b5cf6" /> },
                  ].map(s => {
                    const isSelected = selectedComboSources.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleSourceSelection(s.key)}
                        className="source-pill-select"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                          borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(59,130,246,0.12)' : 'var(--bg-surface)',
                          color: isSelected ? '#1d4ed8' : 'var(--text-secondary)',
                        }}
                      >
                        {s.icon}
                        {s.label}
                        {isSelected && <Check size={10} style={{ color: '#1d4ed8' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span className="price-text-anim" style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {Math.round(349000 * discount).toLocaleString('vi-VN')}đ
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  / tháng
                </span>
              </div>
              <div style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#10b981' : 'var(--text-muted)', fontWeight: billingCycle === 'yearly' ? 700 : 400, marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {billingCycle === 'yearly'
                  ? `(Thanh toán ${(Math.round(349000 * 0.8) * 12).toLocaleString('vi-VN')}đ/năm · Giảm 20%)`
                  : 'Thanh toán linh hoạt từng tháng'}
              </div>
            </div>

            {isSuperAdmin ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)', cursor: 'default'
                }}
              >
                ✓ ĐÃ MỞ KHÓA (SUPER ADMIN)
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgradeModal({
                  name: `Combo 2 Nguồn (${selectedComboSources.map(s => s === 'adb' ? 'ADB' : s === 'worldbank' ? 'World Bank' : 'Đấu Thầu').join(' + ')})`,
                  price: Math.round(349000 * discount),
                  cycle: billingCycle,
                })}
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12, marginBottom: 24, gap: 6 }}
              >
                <Zap size={15} /> Đăng Ký Combo Ngay
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>TÍNH NĂNG BAO GỒM:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Mở khóa <b>2 Nguồn chuyên sâu</b> đã chọn</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Tra cứu không giới hạn thông báo & dự án</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Tự động quét cập nhật 4h/lần</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Miễn phí toàn bộ tin tức báo chí</span>
            </div>
          </div>
        </div>

        {/* 3. Gói Full 3 Nguồn Dữ Liệu */}
        <div className="upgrade-pricing-card">
          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {billingCycle === 'yearly' ? '⚡️ GIẢM 20% THEO NĂM' : 'TOÀN BỘ NGUỒN'}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  Full Data Pack
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Bao gồm đầy đủ ADB, World Bank & Đấu Thầu Công.
                </div>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.08)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                <span>Trọn bộ 3 nguồn ODA & Mua sắm công quốc gia.</span>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span className="price-text-anim" style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {Math.round(499000 * discount).toLocaleString('vi-VN')}đ
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  / tháng
                </span>
              </div>
              <div style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#10b981' : 'var(--text-muted)', fontWeight: billingCycle === 'yearly' ? 700 : 400, marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {billingCycle === 'yearly'
                  ? `(Thanh toán ${(Math.round(499000 * 0.8) * 12).toLocaleString('vi-VN')}đ/năm · Giảm 20%)`
                  : 'Thanh toán linh hoạt từng tháng'}
              </div>
            </div>

            {isSuperAdmin ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)', cursor: 'default'
                }}
              >
                ✓ ĐÃ MỞ KHÓA (SUPER ADMIN)
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgradeModal({
                  name: 'Gói Full Data Pack (ADB + WB + Đấu Thầu)',
                  price: Math.round(499000 * discount),
                  cycle: billingCycle,
                })}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12, marginBottom: 24 }}
              >
                Đăng Ký Full Nguồn
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>TÍNH NĂNG BAO GỒM:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span><b>Dự án ADB Châu Á</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span><b>Dự án World Bank</b> toàn cầu</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span><b>Mua sắm công / Đấu thầu quốc gia</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Lọc nâng cao theo ngành & giai đoạn</span>
            </div>
          </div>
        </div>

        {/* 4. Gói Trợ Lý AI (AI Assistant Add-on) */}
        <div className="upgrade-pricing-card" style={{
          background: 'linear-gradient(145deg, rgba(168,85,247,0.06), rgba(236,72,153,0.06))',
          border: '1.5px solid rgba(168,85,247,0.4)',
        }}>
          <div style={{
            position: 'absolute', top: -14, right: 20,
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px',
            borderRadius: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            🤖 AI INTELLIGENCE
          </div>

          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {billingCycle === 'yearly' ? '⚡️ GIẢM 20% THEO NĂM' : 'HỎI-ĐÁP THÔNG MINH'}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  Trợ Lý AI Gemini
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Thuê theo tháng hỗ trợ tra cứu dữ liệu 24/7.
                </div>
              </div>

              <div style={{ background: 'rgba(168,85,247,0.08)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(168,85,247,0.2)', fontSize: 11, color: '#a855f7', fontWeight: 600 }}>
                <span>Trợ lý AI phân tích & tóm tắt báo cáo 24/7.</span>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span className="price-text-anim" style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {Math.round(149000 * discount).toLocaleString('vi-VN')}đ
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  / tháng
                </span>
              </div>
              <div style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#10b981' : 'var(--text-muted)', fontWeight: billingCycle === 'yearly' ? 700 : 400, marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {billingCycle === 'yearly'
                  ? `(Thanh toán ${(Math.round(149000 * 0.8) * 12).toLocaleString('vi-VN')}đ/năm · Giảm 20%)`
                  : 'Thanh toán linh hoạt từng tháng'}
              </div>
            </div>

            {isSuperAdmin ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)', cursor: 'default'
                }}
              >
                ✓ ĐÃ MỞ KHÓA (SUPER ADMIN)
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgradeModal({
                  name: 'Trợ Lý AI Gemini Hỏi-Đáp',
                  price: Math.round(149000 * discount),
                  cycle: billingCycle,
                })}
                className="btn"
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12,
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: 'white', border: 'none',
                  marginBottom: 24, boxShadow: '0 4px 14px rgba(168,85,247,0.3)', gap: 6,
                }}
              >
                <Bot size={16} /> Thuê Trợ Lý AI
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>TÍNH NĂNG BAO GỒM:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>Hỏi-đáp tự nhiên trên kho dữ liệu tin tức</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>Mô hình Gemini 2.0 Flash phân tích siêu nhanh</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>Trích xuất tóm tắt nội dung báo cáo & dự án</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── UI/UX Custom Themes Shop Section ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, marginBottom: 50, position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Palette size={22} style={{ color: '#a855f7', flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Cửa Hàng Giao Diện UI/UX & Theme Shop
            </h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Thay đổi phong cách giao diện hệ thống theo sở thích (Mặc định, Báo Cổ Điển Vintage, Cyberpunk Neon, Bloomberg Executive).
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            {
              key: 'basic',
              title: 'BIS Modern Glassmorphism',
              price: 0,
              desc: 'Giao diện hiện tại — Thiết kế hiện đại, mượt mà, kính mờ nhã nhặn.',
              colors: ['#3b82f6', '#10b981', '#ffffff'],
              tag: 'MẶC ĐỊNH'
            },
            {
              key: 'classic',
              title: 'Classic Y2K Japanese Web (Code 2000s)',
              price: 99000,
              desc: 'Giao diện Nhật Bản Y2K năm 2000 — KHÔNG bo tròn (border-radius: 0px), viền khung vuông phẳng 1px, phông chữ Tahoma / MS Gothic cổ điển.',
              colors: ['#ece9d8', '#7f9db9', '#000080'],
              tag: 'Y2K 2000s RETRO'
            },
            {
              key: 'cyberpunk',
              title: 'Cyberpunk Neo-Tokyo',
              price: 149000,
              desc: 'Phong cách Sci-Fi Cyberpunk Đêm Neon — Góc cắt Futuristic, hiệu ứng Neon Pulse & Cyber Glow.',
              colors: ['#040814', '#00f0ff', '#ff007f'],
              tag: 'CYBERPUNK NEON'
            },
            {
              key: 'luxury',
              title: 'Bloomberg Luxury Executive',
              price: 199000,
              desc: 'Phong cách Doanh Nhân Thượng Lưu — Đen Obsidian huyền bí, Viền Vàng Gold 24K & Ánh Kim Sang Trọng.',
              colors: ['#08080a', '#d4af37', '#fef1c9'],
              tag: 'LUXURY GOLD 24K'
            },
          ].map(theme => {
            const isActive = activeUiTheme === theme.key;
            return (
              <div key={theme.key} style={{
                padding: 20, borderRadius: 16, border: isActive ? '2px solid var(--brand-500)' : '1px solid var(--border)',
                background: 'var(--bg-surface-2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', transition: 'all 0.2s ease', boxShadow: isActive ? '0 8px 25px rgba(59,130,246,0.15)' : 'none',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'nowrap' }}>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: '3px 7px', borderRadius: 6,
                      background: isActive ? '#2563eb' : '#334155', color: '#ffffff', letterSpacing: '0.4px',
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      {theme.tag}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {theme.price === 0 ? '0đ' : `${Math.round(theme.price * discount).toLocaleString('vi-VN')}đ/tháng`}
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {theme.title}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                    {theme.desc}
                  </div>

                  {/* Color Palette Preview Bar */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: 6, borderRadius: 8, background: 'var(--bg-surface)' }}>
                    {theme.colors.map((c, i) => (
                      <span key={i} style={{ flex: 1, height: 12, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {theme.key === 'basic' ? (
                    <button
                      type="button"
                      disabled={activeUiTheme === 'basic'}
                      onClick={() => handleApplyTheme('basic')}
                      className={activeUiTheme === 'basic' ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                      style={{ flex: 1, fontSize: 12, fontWeight: 700, borderRadius: 10 }}
                    >
                      {activeUiTheme === 'basic' ? '✓ Đang Sử Dụng' : '🔄 Khôi Phục Mặc Định'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApplyTheme(theme.key)}
                        className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                        style={{ flex: 1, fontSize: 12, fontWeight: 700, borderRadius: 10 }}
                      >
                        {isActive ? '✓ Đang Dùng Thử' : 'Dùng Thử Live'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenUpgradeModal({
                          name: `Gói UI/UX Theme ${theme.title}`,
                          price: Math.round(theme.price * discount),
                          cycle: billingCycle,
                        })}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#a855f7', fontWeight: 700, fontSize: 12 }}
                      >
                        Mua Gói UI
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Individual Source Add-ons Section ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, marginBottom: 50, position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Layers size={20} style={{ color: 'var(--brand-500)' }} />
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Thuê Lẻ Từng Nguồn Dữ Liệu Theo Tháng
            </h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Dành cho người dùng chỉ có nhu cầu theo dõi duy nhất 1 nguồn chuyên biệt.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { key: 'adb', title: 'Nguồn ADB (Châu Á)', price: 199000, color: '#f59e0b', icon: <Building2 size={18} color="#f59e0b" />, desc: 'Dự án ODA Ngân hàng Phát triển Châu Á' },
            { key: 'wb', title: 'Nguồn World Bank', price: 199000, color: '#10b981', icon: <Globe size={18} color="#10b981" />, desc: 'Dự án ODA Ngân hàng Thế giới' },
            { key: 'dau-thau', title: 'Đấu Thầu Công', price: 299000, color: '#8b5cf6', icon: <ShoppingBag size={18} color="#8b5cf6" />, desc: 'Thông báo mời thầu & KHLCNT quốc gia' },
          ].map(addon => (
            <div key={addon.key} style={{
              padding: 18, borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-surface)' }}>
                  {addon.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{addon.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{addon.desc}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="price-text-anim" style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {Math.round(addon.price * discount).toLocaleString('vi-VN')}đ
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/tháng</span>
                </div>
                <button
                  onClick={() => handleOpenUpgradeModal({
                    name: `Gói Nguồn ${addon.title}`,
                    price: Math.round(addon.price * discount),
                    cycle: billingCycle,
                  })}
                  className="btn btn-ghost btn-xs"
                  style={{ color: 'var(--brand-600)', fontWeight: 700, padding: '2px 8px', marginTop: 4 }}
                >
                  Thuê Nguồn →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full Feature Comparison Table ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, overflowX: 'auto', position: 'relative', zIndex: 1,
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
          Bảng So Sánh Chi Tiết Quyền Lợi Các Gói
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>TÍNH NĂNG</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 800 }}>CÁ NHÂN (FREE)</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: '#3b82f6', fontWeight: 800 }}>COMBO 2 NGUỒN</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: '#a855f7', fontWeight: 800 }}>GÓI AI ASSISTANT</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: '#9333ea', fontWeight: 800 }}>ENTERPRISE</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Tin Tức Báo Chí Toàn Quốc', free: true, combo: true, ai: true, enterprise: true },
              { name: 'Dự Án ADB & World Bank', free: false, combo: '2 Nguồn chọn', ai: false, enterprise: true },
              { name: 'Thông Báo Đấu Thầu Công', free: false, combo: '2 Nguồn chọn', ai: false, enterprise: true },
              { name: 'Trợ Lý AI Gemini 2.0 Hỏi-Đáp', free: false, combo: false, ai: true, enterprise: true },
              { name: 'Dashboard Thống Kê Tổng Quan', free: false, combo: false, ai: false, enterprise: true },
              { name: 'Phân Quyền Phân Vùng & Tổ Chức', free: false, combo: false, ai: false, enterprise: true },
              { name: 'Tần Suất Crawl Cập Nhật', free: '4h / lần', combo: '4h / lần', ai: 'Tức thì', enterprise: 'Tức thì' },
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-surface-2)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</td>
                <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                  {typeof row.free === 'boolean' ? (row.free ? <Check size={18} color="#10b981" style={{ margin: '0 auto' }} /> : <X size={18} color="#94a3b8" style={{ margin: '0 auto' }} />) : row.free}
                </td>
                <td style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#3b82f6' }}>
                  {typeof row.combo === 'boolean' ? (row.combo ? <Check size={18} color="#10b981" style={{ margin: '0 auto' }} /> : <X size={18} color="#94a3b8" style={{ margin: '0 auto' }} />) : row.combo}
                </td>
                <td style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#a855f7' }}>
                  {typeof row.ai === 'boolean' ? (row.ai ? <Check size={18} color="#10b981" style={{ margin: '0 auto' }} /> : <X size={18} color="#94a3b8" style={{ margin: '0 auto' }} />) : row.ai}
                </td>
                <td style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 700, color: '#9333ea' }}>
                  {typeof row.enterprise === 'boolean' ? (row.enterprise ? <Check size={18} color="#10b981" style={{ margin: '0 auto' }} /> : <X size={18} color="#94a3b8" style={{ margin: '0 auto' }} />) : row.enterprise}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── React Portal Centered Modal (Direct to document.body with ESC key support) ── */}
      {showModal && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999, padding: 20,
            animation: 'backdropFadeIn 0.2s ease-out',
          }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 24, maxWidth: 480, width: '100%', padding: 32,
            boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.45)', position: 'relative',
            animation: 'modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute', top: 18, right: 18, border: 'none',
                background: 'var(--bg-surface-2)', borderRadius: '50%', width: 34, height: 34,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', transition: 'all 0.2s ease',
              }}
              title="Đóng (Bấm ESC)"
            >
              <X size={18} />
            </button>

            {!upgradeSubmitted ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-600)', marginBottom: 8 }}>
                  <Zap size={20} style={{ color: '#2563eb' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>XÁC NHẬN NÂNG CẤP GÓI</span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {selectedPackage?.name}
                </h3>

                <div style={{
                  background: 'var(--bg-surface-2)', padding: 16, borderRadius: 14,
                  border: '1px solid var(--border)', margin: '16px 0 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chi phí gói:</span>
                    <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>
                      {selectedPackage?.price?.toLocaleString('vi-VN')}đ / tháng
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Hình thức:</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand-600)' }}>
                      {selectedPackage?.cycle === 'yearly' ? 'Thanh toán 12 tháng (Giảm 20%)' : 'Thanh toán từng tháng'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleConfirmUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Email tài khoản nâng cấp:</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      readOnly
                      style={{ fontSize: 13, background: 'var(--bg-surface-2)', cursor: 'not-allowed', padding: '10px 14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Số điện thoại liên hệ / Zalo:</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại của bạn (VD: 0987xxxxxx)"
                      className="form-input"
                      style={{ fontSize: 13, padding: '10px 14px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="login-btn"
                    style={{
                      marginTop: 8, padding: '14px 0', fontSize: 14, fontWeight: 800,
                      borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      boxShadow: '0 4px 14px rgba(37,99,235,0.35)', cursor: 'pointer',
                    }}
                  >
                    🚀 Đăng Ký Nâng Cấp Ngay
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                  🔒 Nhấn <b>[ESC]</b> hoặc bấm ra ngoài để đóng nhanh popup.
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: '#d1fae5',
                  color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px', boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                }}>
                  <Check size={34} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Yêu Cầu Nâng Cấp Đã Được Gửi!
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                  Chuyên viên hỗ trợ sẽ liên hệ với bạn qua SĐT/Zalo <b>{phone || 'của bạn'}</b> trong ít phút để kích hoạt gói <b>{selectedPackage?.name}</b>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-primary"
                  style={{ padding: '10px 28px', fontSize: 14, fontWeight: 700, borderRadius: 10 }}
                >
                  Hoàn Tất
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
