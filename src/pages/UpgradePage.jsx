// src/pages/UpgradePage.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Check, X, Building2, Globe, ShoppingBag, Bot, Sparkles, Crown,
  ShieldCheck, CheckCircle2, ArrowRight, ChevronRight, Star, Layers, Lock, Gift, PhoneCall, Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

import animeBg from '../assets/anime_bg.png';
import basicBg from '../assets/theme_basic_bg.png';
import classicBg from '../assets/theme_classic_bg.png';
import sapphireBg from '../assets/theme_sapphire_bg.png';
import luxuryBg from '../assets/theme_luxury_bg.png';

import { getUserTheme, setUserTheme, syncUserTheme, applyTheme, isThemeUnlocked, unlockThemeForUser } from '../utils/theme';
import { tUI } from '../locales';

export default function UpgradePage() {
  const { user, isPersonalUser, isSuperAdmin, isRegionalAdmin } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedComboSources, setSelectedComboSources] = useState(['adb', 'worldbank']);
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);
  const [phone, setPhone] = useState('');

  const userKey = user?.email || user?.id || 'default';
  const [activeDataPackage, setActiveDataPackage] = useState(() => {
    return localStorage.getItem(`bis_active_package_${userKey}`) || (user?.role === 'admin' ? 'full' : 'free');
  });

  const [hasAiPackage, setHasAiPackage] = useState(() => {
    return localStorage.getItem(`bis_ai_package_${userKey}`) === 'true';
  });

  const [activeUiTheme, setActiveUiTheme] = useState(() => getUserTheme(user));

  const handleApplyTheme = (themeKey) => {
    setActiveUiTheme(themeKey);
    if (isThemeUnlocked(user, themeKey)) {
      setUserTheme(user, themeKey);
    } else {
      // Dùng thử live: áp dụng giao diện xem trước nhưng KHÔNG lưu cố định vào tài khoản
      applyTheme(themeKey);
    }
  };

  useEffect(() => {
    const saved = getUserTheme(user);
    setActiveUiTheme(saved);

    return () => {
      // Khi rời khỏi trang Upgrade / chuyển tab, tự động trả về Theme chính thức đã sở hữu của user
      const officialTheme = getUserTheme(user);
      applyTheme(officialTheme);
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

const getCalculatedExpiration = (cycle = 'monthly') => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  
  const startDateStr = formatDate(now);
  const endDate = new Date(now);
  if (cycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  const endDateStr = formatDate(endDate);
  return `${startDateStr} - ${endDateStr}`;
};

  const handleConfirmUpgrade = (e) => {
    e.preventDefault();
    if (selectedPackage?.themeKey) {
      unlockThemeForUser(user, selectedPackage.themeKey);
      setUserTheme(user, selectedPackage.themeKey);
      setActiveUiTheme(selectedPackage.themeKey);
    } else {
      const expDateStr = getCalculatedExpiration(selectedPackage?.cycle || billingCycle);
      localStorage.setItem(`bis_pkg_exp_${userKey}`, expDateStr);

      if (selectedPackage?.pkgType === 'combo2') {
        localStorage.setItem(`bis_active_package_${userKey}`, 'combo2');
        localStorage.setItem(`bis_selected_sources_${userKey}`, JSON.stringify(selectedComboSources));
        setActiveDataPackage('combo2');
      } else if (selectedPackage?.pkgType === 'single') {
        localStorage.setItem(`bis_active_package_${userKey}`, 'single');
        localStorage.setItem(`bis_selected_sources_${userKey}`, JSON.stringify([selectedPackage.sourceKey]));
        setActiveDataPackage('single');
      } else if (selectedPackage?.pkgType === 'full') {
        localStorage.setItem(`bis_active_package_${userKey}`, 'full');
        setActiveDataPackage('full');
      } else if (selectedPackage?.pkgType === 'enterprise') {
        localStorage.setItem(`bis_active_package_${userKey}`, 'enterprise');
        setActiveDataPackage('enterprise');
      } else if (selectedPackage?.pkgType === 'user_slots') {
        const currentMax = parseInt(localStorage.getItem(`bis_max_users_${userKey}`) || '10', 10);
        localStorage.setItem(`bis_max_users_${userKey}`, String(currentMax + 10));
      } else if (selectedPackage?.pkgType === 'ai') {
        localStorage.setItem(`bis_ai_package_${userKey}`, 'true');
        setHasAiPackage(true);
      }
    }
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
          {t('upgrade.heroBadge')}
        </div>

        <h1 style={{
          fontSize: 34, fontWeight: 900, color: 'var(--text-primary)',
          letterSpacing: '-0.6px', marginBottom: 12, lineHeight: 1.2,
        }}>
          {t('upgrade.heroTitle')}
        </h1>

        <p style={{
          fontSize: 15, color: 'var(--text-secondary)', maxWidth: 680,
          margin: '0 auto 30px', lineHeight: 1.6,
        }}>
          {t('upgrade.heroSubtitle')}
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
            {t('upgrade.billingMonthly')}
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
            {t('upgrade.billingYearly')}
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10,
              background: billingCycle === 'yearly' ? '#fef08a' : 'linear-gradient(135deg, #f59e0b, #ec4899)',
              color: billingCycle === 'yearly' ? '#854d0e' : 'white',
            }}>
              {t('upgrade.discount20')}
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Pricing Cards Grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20, marginBottom: 50, position: 'relative', zIndex: 1, alignItems: 'stretch',
      }}>

        {/* 1. Gói Cá Nhân (Mặc định) */}
        <div className="upgrade-pricing-card" style={{
          border: activeDataPackage === 'free' ? '2px solid #3b82f6' : '1px solid var(--border)',
        }}>
          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('upgrade.personalPlan')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {t('upgrade.freeTitle')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('upgrade.freeSub')}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-2)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>{t('upgrade.freeBadge')}</span>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>{tUI('ui.0d')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{t('upgrade.perMonth')}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {t('upgrade.freeForever')}
              </div>
            </div>

            {isSuperAdmin ? (
              <button disabled style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
                {t('upgrade.unlockedSuperAdmin')}
              </button>
            ) : activeDataPackage === 'free' ? (
              <button disabled style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24, background: 'var(--bg-surface-2)', color: '#2563eb', border: '1.5px solid #2563eb' }}>
                {t('upgrade.activeDefault')}
              </button>
            ) : (
              <button disabled className="btn btn-secondary" style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12, marginBottom: 24 }}>
                {t('upgrade.freeTitle')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t('upgrade.featuresIncluded')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.toan-bo')} <b>{tUI('ui.tin-tuc-bao-chi')}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.quan-ly-tu-khoa-ca-nhan')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.luu-bai-viet-yeu-thich-bookmarks')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              <X size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>{tUI('ui.du-an-adb-world-bank')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              <X size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>{tUI('ui.thong-bao-dau-thau-cong')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              <X size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>{tUI('ui.tro-ly-ai-hoi-dap-24-7')}</span>
            </div>
          </div>
        </div>

        {/* 2. Gói Combo 2 Nguồn Dữ Liệu (HOT COMBO) */}
        <div className="upgrade-pricing-card" style={{
          border: activeDataPackage === 'combo2' ? '2.5px solid #3b82f6' : activeDataPackage === 'full' ? '1px solid var(--border-subtle)' : '2px solid #3b82f6',
          boxShadow: activeDataPackage === 'combo2' ? '0 8px 25px rgba(59,130,246,0.3)' : 'none',
          opacity: activeDataPackage === 'full' && !isSuperAdmin ? 0.82 : 1,
        }}>
          <div style={{
            position: 'absolute', top: -14, right: 20,
            background: isSuperAdmin ? 'linear-gradient(135deg, #10b981, #059669)' : activeDataPackage === 'combo2' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : activeDataPackage === 'full' ? '#64748b' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px',
            borderRadius: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          }}>
            {activeDataPackage === 'combo2' ? '✓ COMBO 2 (ĐANG SỬ DỤNG)' : activeDataPackage === 'full' && !isSuperAdmin ? t('upgrade.includedInFull') : '🔥 COMBO 2'}
          </div>

          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {billingCycle === 'yearly' ? t('upgrade.save32Yearly') : t('upgrade.save15Combo')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {t('upgrade.combo2Title')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('upgrade.combo2Sub')}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-2)', padding: 8, borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.4 }}>
                  {t('upgrade.combo2Choose')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[
                    { key: 'adb', label: 'ADB', icon: <Building2 size={11} color="#f59e0b" /> },
                    { key: 'worldbank', label: 'World Bank', icon: <Globe size={11} color="#10b981" /> },
                    { key: 'gov', label: tUI('ui.dau-thau'), icon: <ShoppingBag size={11} color="#8b5cf6" /> },
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
                  {t('upgrade.perMonth')}
                </span>
              </div>
              <div style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#10b981' : 'var(--text-muted)', fontWeight: billingCycle === 'yearly' ? 700 : 400, marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {billingCycle === 'yearly'
                  ? `(Thanh toán ${(Math.round(349000 * 0.8) * 12).toLocaleString('vi-VN')}đ/năm · -20%)`
                  : 'Thanh toán linh hoạt'}
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
                {t('upgrade.unlockedSuperAdmin')}
              </button>
            ) : activeDataPackage === 'combo2' ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
                }}
              >
                {t('upgrade.activeUsing')}
              </button>
            ) : activeDataPackage === 'full' ? (
              <button
                disabled
                title={tUI('ui.tai-khoan-cua-ban-da-so-huu-tron-bo-3-nguon-tu-g')}
                style={{
                  width: '100%', padding: '11px 0', fontSize: 12, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
                  cursor: 'not-allowed'
                }}
              >
                {t('upgrade.includedInFull')}
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgradeModal({
                  pkgType: 'combo2',
                  name: `Combo 2 Nguồn (${selectedComboSources.map(s => s === 'adb' ? 'ADB' : s === 'worldbank' ? 'World Bank' : 'Đấu Thầu').join(' + ')})`,
                  price: Math.round(349000 * discount),
                  cycle: billingCycle,
                })}
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12, marginBottom: 24, gap: 6 }}
              >
                <Zap size={15} /> {t('upgrade.subscribeCombo')}
              </button>
            )}
          </div>

          {activeDataPackage === 'full' && !isSuperAdmin && (
            <div style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '8px 10px', borderRadius: 8, marginTop: -14, marginBottom: 16, border: '1px solid #a7f3d0' }}>
              💡 Bạn đang sử dụng gói Full Data Pack (Trọn bộ 3 nguồn), không cần mua thêm Combo 2.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{tUI('ui.tinh-nang-bao-gom')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.mo-khoa')} <b>{tUI('ui.2-nguon-chuyen-sau')}</b> {tUI('ui.da-chon')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.tra-cuu-khong-gioi-han-thong-bao-du-an')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.tu-dong-quet-cap-nhat-4h-lan')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.mien-phi-toan-bo-tin-tuc-bao-chi')}</span>
            </div>
          </div>
        </div>

        {/* 3. Gói Full 3 Nguồn Dữ Liệu */}
        <div className="upgrade-pricing-card" style={{
          border: activeDataPackage === 'full' ? '2.5px solid #10b981' : '1px solid var(--border)',
          boxShadow: activeDataPackage === 'full' ? '0 8px 25px rgba(16,185,129,0.35)' : 'none',
        }}>
          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {billingCycle === 'yearly' ? t('upgrade.save20Yearly') : t('upgrade.allSourcesTag')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {t('upgrade.fullPackTitle')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('upgrade.fullPackSub')}
                </div>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.08)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                <span>{t('upgrade.fullPackBadge')}</span>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span className="price-text-anim" style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {Math.round(499000 * discount).toLocaleString('vi-VN')}đ
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {t('upgrade.perMonth')}
                </span>
              </div>
              <div style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#10b981' : 'var(--text-muted)', fontWeight: billingCycle === 'yearly' ? 700 : 400, marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {billingCycle === 'yearly'
                  ? `(Thanh toán ${(Math.round(499000 * 0.8) * 12).toLocaleString('vi-VN')}đ/năm · -20%)`
                  : 'Thanh toán linh hoạt'}
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
                {t('upgrade.unlockedSuperAdmin')}
              </button>
            ) : activeDataPackage === 'full' ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.4)'
                }}
              >
                {t('upgrade.activeUsing')}
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgradeModal({
                  pkgType: 'full',
                  name: tUI('ui.goi-full-data-pack-adb-wb-dau-thau'),
                  price: Math.round(499000 * discount),
                  cycle: billingCycle,
                })}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12, marginBottom: 24 }}
              >
                {t('upgrade.subscribeFull')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t('upgrade.featuresIncluded')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span><b>{tUI('ui.du-an-adb-chau-a')}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span><b>{tUI('ui.du-an-world-bank')}</b> {tUI('ui.toan-cau')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span><b>{tUI('ui.mua-sam-cong-dau-thau-quoc-gia')}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.loc-nang-cao-theo-nganh-giai-doan')}</span>
            </div>
          </div>
        </div>

        {/* 4. Gói Enterprise (Doanh Nghiệp & Admin Phân Vùng) */}
        <div className="upgrade-pricing-card" style={{
          background: 'linear-gradient(145deg, rgba(37,99,235,0.06), rgba(147,51,234,0.06))',
          border: activeDataPackage === 'enterprise' || isRegionalAdmin ? '2.5px solid #9333ea' : '1.5px solid rgba(147,51,234,0.4)',
          boxShadow: activeDataPackage === 'enterprise' || isRegionalAdmin ? '0 8px 25px rgba(147,51,234,0.35)' : 'none',
        }}>
          <div style={{
            position: 'absolute', top: -14, right: 20,
            background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
            color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px',
            borderRadius: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            {activeDataPackage === 'enterprise' || isRegionalAdmin ? '✓ ĐANG SỬ DỤNG (ENTERPRISE)' : '🏢 QUẢN TRỊ TỔ CHỨC'}
          </div>

          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#9333ea', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {billingCycle === 'yearly' ? t('upgrade.save20Yearly') : t('upgrade.orgAdminTag')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {t('upgrade.enterpriseTitle')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('upgrade.enterpriseSub')}
                </div>
              </div>

              <div style={{ background: 'rgba(147,51,234,0.08)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(147,51,234,0.2)', fontSize: 11, color: '#9333ea', fontWeight: 600 }}>
                <span>{t('upgrade.enterpriseBadge')}</span>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span className="price-text-anim" style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {Math.round(999000 * discount).toLocaleString('vi-VN')}đ
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {t('upgrade.perMonth')}
                </span>
              </div>
              <div style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#10b981' : 'var(--text-muted)', fontWeight: billingCycle === 'yearly' ? 700 : 400, marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {billingCycle === 'yearly'
                  ? `(Thanh toán ${(Math.round(999000 * 0.8) * 12).toLocaleString('vi-VN')}đ/năm · -20%)`
                  : 'Thanh toán linh hoạt'}
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
                {t('upgrade.unlockedSuperAdmin')}
              </button>
            ) : activeDataPackage === 'enterprise' || isRegionalAdmin ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'linear-gradient(135deg, #9333ea, #7e22ce)', color: 'white', border: 'none',
                  boxShadow: '0 4px 14px rgba(147,51,234,0.4)'
                }}
              >
                {t('upgrade.activeUsing')}
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgradeModal({
                  pkgType: 'enterprise',
                  name: tUI('ui.goi-enterprise-full-data-quan-tri-10-user'),
                  price: Math.round(999000 * discount),
                  cycle: billingCycle,
                })}
                className="btn btn-primary"
                style={{ width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 12, marginBottom: 24, background: 'linear-gradient(135deg, #9333ea, #7e22ce)', border: 'none' }}
              >
                <Building2 size={15} /> {t('upgrade.subscribeEnterprise')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t('upgrade.featuresIncluded')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span><b>{tUI('ui.full-data-pack-adb-wb-dau-thau')}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.quyen-admin-phan-vung-to-chuc')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.tu-quan-ly')} <b>{tUI('ui.toi-da-10-tai-khoan-thanh-vien')}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{tUI('ui.thanh-vien-tu-dong-ke-thua-full-data')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <X size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>{tUI('ui.tro-ly-ai-gemini-2-0-mua-them-149k-thang')}</span>
            </div>
          </div>
        </div>

        {/* 5. Gói Trợ Lý AI (AI Assistant Add-on) */}
        <div className="upgrade-pricing-card" style={{
          background: 'linear-gradient(145deg, rgba(168,85,247,0.06), rgba(236,72,153,0.06))',
          border: hasAiPackage ? '2.5px solid #a855f7' : '1.5px solid rgba(168,85,247,0.4)',
          boxShadow: hasAiPackage ? '0 8px 25px rgba(168,85,247,0.35)' : 'none',
        }}>
          <div style={{
            position: 'absolute', top: -14, right: 20,
            background: hasAiPackage ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px',
            borderRadius: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            {hasAiPackage ? '✓ AI (ĐANG SỬ DỤNG)' : '🤖 AI INTELLIGENCE'}
          </div>

          <div>
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {billingCycle === 'yearly' ? t('upgrade.save20Yearly') : t('upgrade.aiIntelligenceTag')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {t('upgrade.aiTitle')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('upgrade.aiSub')}
                </div>
              </div>

              <div style={{ background: 'rgba(168,85,247,0.08)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(168,85,247,0.2)', fontSize: 11, color: '#a855f7', fontWeight: 600 }}>
                <span>{tUI('ui.tro-ly-ai-phan-tich-tom-tat-bao-cao-24-7')}</span>
              </div>
            </div>

            <div style={{ margin: '20px 0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span className="price-text-anim" style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {Math.round(149000 * discount).toLocaleString('vi-VN')}đ
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {t('upgrade.perMonth')}
                </span>
              </div>
              <div style={{ fontSize: 11, color: billingCycle === 'yearly' ? '#10b981' : 'var(--text-muted)', fontWeight: billingCycle === 'yearly' ? 700 : 400, marginTop: 4, height: 16, whiteSpace: 'nowrap' }}>
                {billingCycle === 'yearly'
                  ? `(Thanh toán ${(Math.round(149000 * 0.8) * 12).toLocaleString('vi-VN')}đ/năm · -20%)`
                  : 'Thanh toán linh hoạt'}
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
                {t('upgrade.unlockedSuperAdmin')}
              </button>
            ) : hasAiPackage ? (
              <button
                disabled
                style={{
                  width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 800, borderRadius: 12, marginBottom: 24,
                  background: 'linear-gradient(135deg, #a855f7, #9333ea)', color: 'white', border: 'none',
                  boxShadow: '0 4px 14px rgba(168,85,247,0.4)'
                }}
              >
                {t('upgrade.activeUsing')}
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgradeModal({
                  pkgType: 'ai',
                  name: tUI('ui.tro-ly-ai-gemini-hoi-dap'),
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
                <Bot size={16} /> {t('upgrade.subscribeAi')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed var(--border-subtle)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t('upgrade.featuresIncluded')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>{tUI('ui.hoi-dap-tu-nhien-tren-kho-du-lieu-tin-tuc')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>{tUI('ui.mo-hinh-gemini-2-0-flash-phan-tich-sieu-nhanh')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span>{tUI('ui.trich-xuat-tom-tat-noi-dung-bao-cao-du-an')}</span>
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
              {t('upgrade.themeShopTitle')}
            </h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {t('upgrade.themeShopSub')}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12,
          scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
          alignItems: 'stretch', scrollbarWidth: 'thin',
        }}>
          {[
            {
              key: 'basic',
              price: 0,
              colors: ['#3b82f6', '#10b981', '#ffffff'],
              tag: 'MẶC ĐỊNH',
              img: basicBg
            },
            {
              key: 'classic',
              price: 99000,
              colors: ['#008080', '#c0c0c0', '#000080'],
              tag: 'VINTAGE PC 98',
              img: classicBg
            },
            {
              key: 'sapphire',
              price: 149000,
              colors: ['#050914', '#1d4ed8', '#38bdf8'],
              tag: 'ROYAL SAPPHIRE',
              img: sapphireBg
            },
            {
              key: 'luxury',
              price: 149000,
              colors: ['#08080a', '#d4af37', '#fef1c9'],
              tag: 'LUXURY GOLD 24K',
              img: luxuryBg
            },
            {
              key: 'anime',
              price: 149000,
              colors: ['#0f0d19', '#f472b6', '#a855f7'],
              tag: 'ANIME SAKURA 🌸',
              img: animeBg
            },
          ].map(theme => {
            const isUnlocked = isThemeUnlocked(user, theme.key);
            const isActive = activeUiTheme === theme.key;
            return (
              <div key={theme.key} style={{
                flex: '0 0 280px', minWidth: 280, padding: 20, borderRadius: 16,
                border: isActive ? '2px solid var(--brand-500)' : isUnlocked ? '1px solid #10b981' : '1px solid var(--border)',
                background: 'var(--bg-surface-2)', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
                transition: 'all 0.2s ease', boxShadow: isActive ? '0 8px 25px rgba(59,130,246,0.15)' : 'none',
                scrollSnapAlign: 'start', boxSizing: 'border-box',
              }}>
                {theme.img && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 75,
                    backgroundImage: `url(${theme.img})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.35, maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'nowrap' }}>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: '3px 7px', borderRadius: 6,
                      background: isActive ? '#2563eb' : isUnlocked ? '#10b981' : '#334155', color: '#ffffff', letterSpacing: '0.4px',
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      {isActive ? t('upgrade.themeApplied') : isUnlocked ? '✓ ĐÃ SỞ HỮU' : theme.tag}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: isUnlocked ? '#10b981' : 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {theme.price === 0 ? '0đ' : isUnlocked ? 'Đã sở hữu' : `${theme.price.toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6, minHeight: 38, display: 'flex', alignItems: 'center' }}>
                    {t(`theme.${theme.key}.title`)}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: 14, minHeight: 52, display: 'flex', alignItems: 'flex-start' }}>
                    {t(`theme.${theme.key}.desc`)}
                  </div>

                  {/* Color Palette Preview Bar */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: 6, borderRadius: 8, background: 'var(--bg-surface)', marginTop: 'auto' }}>
                    {theme.colors.map((c, i) => (
                      <span key={i} style={{ flex: 1, height: 12, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
                  {isUnlocked ? (
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={() => handleApplyTheme(theme.key)}
                      className={isActive ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                      style={{ flex: 1, fontSize: 12, fontWeight: 700, borderRadius: 10 }}
                    >
                      {isActive ? '✓ Đang Sử Dụng' : 'Áp Dụng Giao Diện'}
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
                          price: theme.price,
                          themeKey: theme.key,
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

        <div style={{
          display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12,
          scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
          alignItems: 'stretch', scrollbarWidth: 'thin',
        }}>
          {[
            { key: 'adb', title: tUI('ui.nguon-adb-chau-a'), price: 199000, color: '#f59e0b', icon: <Building2 size={18} color="#f59e0b" />, desc: tUI('ui.du-an-oda-ngan-hang-chau-a') },
            { key: 'wb', title: tUI('ui.nguon-world-bank'), price: 199000, color: '#10b981', icon: <Globe size={18} color="#10b981" />, desc: tUI('ui.du-an-oda-ngan-hang-the-gioi') },
            { key: 'dau-thau', title: tUI('ui.dau-thau-cong'), price: 299000, color: '#8b5cf6', icon: <ShoppingBag size={18} color="#8b5cf6" />, desc: tUI('ui.thong-bao-moi-thau-khlcnt') },
            { key: 'user-slots', title: '+10 Slot User Enterprise', price: 50000, color: '#9333ea', icon: <Zap size={18} color="#9333ea" />, desc: tUI('ui.them-10-slot-cho-admin-phan-vung') },
          ].map(addon => (
            <div key={addon.key} style={{
              flex: '0 0 280px', minWidth: 280, padding: 20, borderRadius: 16,
              border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              scrollSnapAlign: 'start', boxSizing: 'border-box', transition: 'all 0.2s ease',
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
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>{tUI('ui.thang')}</span>
                </div>
                {(() => {
                  const normalizedKey = addon.key === 'wb' ? 'worldbank' : addon.key === 'dau-thau' ? 'gov' : addon.key;
                  const isFull = isSuperAdmin || activeDataPackage === 'full';
                  const isSingleActive = activeDataPackage === 'single' && JSON.parse(localStorage.getItem(`bis_selected_sources_${userKey}`) || '[]')[0] === normalizedKey;
                  const isComboActive = activeDataPackage === 'combo2' && (selectedComboSources.includes(normalizedKey) || JSON.parse(localStorage.getItem(`bis_selected_sources_${userKey}`) || '[]').includes(normalizedKey));
                  
                  if (addon.key === 'user-slots') {
                    return (
                      <button
                        onClick={() => handleOpenUpgradeModal({
                          pkgType: 'user_slots',
                          name: tUI('ui.goi-mua-them-10-slot-user-enterprise'),
                          price: Math.round(addon.price * discount),
                          cycle: billingCycle,
                        })}
                        className="btn btn-ghost btn-xs"
                        style={{ color: '#9333ea', fontWeight: 800, padding: '2px 8px', marginTop: 4, background: '#f3e8ff', border: '1px solid #e9d5ff' }}
                      >
                        ➕ Mua +10 User →
                      </button>
                    );
                  }
                  if (isFull) {
                    return (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#10b981', display: 'block', marginTop: 4 }}>
                        ✓ Đã Bao Gồm (Full)
                      </span>
                    );
                  }
                  if (isSingleActive) {
                    return (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2563eb', display: 'block', marginTop: 4 }}>
                        ✓ ĐANG SỬ DỤNG
                      </span>
                    );
                  }
                  if (isComboActive) {
                    return (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#3b82f6', display: 'block', marginTop: 4 }}>
                        ✓ Đã Có Trong Combo 2
                      </span>
                    );
                  }
                  return (
                    <button
                      onClick={() => handleOpenUpgradeModal({
                        pkgType: 'single',
                        sourceKey: normalizedKey,
                        name: `Gói Độc Lập 1 Nguồn ${addon.title}`,
                        price: Math.round(addon.price * discount),
                        cycle: billingCycle,
                      })}
                      className="btn btn-ghost btn-xs"
                      style={{ color: 'var(--brand-600)', fontWeight: 700, padding: '2px 8px', marginTop: 4 }}
                    >
                      Thuê Nguồn →
                    </button>
                  );
                })()}
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
              <th style={{ textAlign: 'left', padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>{tUI('ui.tinh-nang')}</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 800 }}>{tUI('ui.ca-nhan-free')}</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: '#3b82f6', fontWeight: 800 }}>{tUI('ui.combo-2-nguon')}</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: '#a855f7', fontWeight: 800 }}>{tUI('ui.goi-ai-assistant')}</th>
              <th style={{ textAlign: 'center', padding: '14px 16px', color: '#9333ea', fontWeight: 800 }}>ENTERPRISE</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: tUI('ui.tin-tuc-bao-chi-toan-quoc'), free: true, combo: true, ai: true, enterprise: true },
              { name: tUI('ui.du-an-adb-world-bank'), free: false, combo: '2 Nguồn chọn', ai: false, enterprise: true },
              { name: tUI('ui.thong-bao-dau-thau-cong-2'), free: false, combo: '2 Nguồn chọn', ai: false, enterprise: true },
              { name: tUI('ui.tro-ly-ai-gemini-2-0-hoi-dap'), free: false, combo: false, ai: true, enterprise: true },
              { name: tUI('ui.dashboard-thong-ke-tong-quan'), free: false, combo: false, ai: false, enterprise: true },
              { name: tUI('ui.phan-quyen-phan-vung-to-chuc'), free: false, combo: false, ai: false, enterprise: true },
              { name: tUI('ui.tan-suat-crawl-cap-nhat'), free: '4h / lần', combo: '4h / lần', ai: 'Tức thì', enterprise: 'Tức thì' },
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
          <div className="custom-modal-scroll" style={{
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
              title={tUI('ui.dong-bam-esc')}
            >
              <X size={18} />
            </button>

            {!upgradeSubmitted ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-600)', marginBottom: 8 }}>
                  <Zap size={20} style={{ color: '#2563eb' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tUI('ui.xac-nhan-nang-cap-goi')}</span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {selectedPackage?.name}
                </h3>

                <div style={{
                  background: 'var(--bg-surface-2)', padding: 16, borderRadius: 14,
                  border: '1px solid var(--border)', margin: '16px 0 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{tUI('ui.chi-phi-goi')}</span>
                    <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>
                      {selectedPackage?.themeKey ? `${selectedPackage?.price?.toLocaleString('vi-VN')}đ (Dùng vĩnh viễn)` : `${selectedPackage?.price?.toLocaleString('vi-VN')}đ / tháng`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{tUI('ui.hinh-thuc')}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand-600)' }}>
                      {selectedPackage?.themeKey ? 'Thanh toán 1 lần duy nhất' : (selectedPackage?.cycle || billingCycle) === 'yearly' ? 'Thanh toán 12 tháng (Giảm 20%)' : 'Thanh toán từng tháng'}
                    </span>
                  </div>
                  {!selectedPackage?.themeKey && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{tUI('ui.thoi-han-goi')}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#10b981' }}>
                        📅 {getCalculatedExpiration(selectedPackage?.cycle || billingCycle)} ({(selectedPackage?.cycle || billingCycle) === 'yearly' ? '1 năm' : '1 tháng'})
                      </span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleConfirmUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{tUI('ui.email-tai-khoan-nang-cap')}</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      readOnly
                      style={{ fontSize: 13, background: 'var(--bg-surface-2)', cursor: 'not-allowed', padding: '10px 14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{tUI('ui.so-dien-thoai-lien-he-zalo')}</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={tUI('ui.nhap-so-dien-thoai-cua-ban-vd-0987xxxxxx')}
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
                  Chuyên viên hỗ trợ sẽ liên hệ với bạn qua SĐT/Zalo <b>{phone || 'của bạn'}</b> {tUI('ui.trong-it-phut-de-kich-hoat-goi')} <b>{selectedPackage?.name}</b>.
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
