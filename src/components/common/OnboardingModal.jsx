// src/components/common/OnboardingModal.jsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  MapPin, Tag, Mail, CheckCircle2, ChevronRight, ChevronLeft, 
  Sparkles, X, Plus, Clock, Globe, ShieldCheck, Check, 
  Building, Compass, Cpu, Zap, Activity, Layers,
  Loader2, BellRing, Search, Flame, Award, Send, CheckCircle,
  ExternalLink, CheckSquare, Square, Newspaper, FolderGit2, Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { settingsService } from '../../services/settings';
import { keywordsService } from '../../services/keywords';
import { tUI } from '../../locales';

const ALL_REGIONS = [
  { id: 'Toàn quốc', label: 'Toàn quốc', desc: 'Theo dõi toàn bộ dự án, ODA & tin tức khắp cả nước' },
  { id: 'Hà Nội', label: 'Hà Nội', desc: 'Đầu tàu kinh tế & các dự án trọng điểm phía Bắc' },
  { id: 'TP.HCM', label: 'TP. Hồ Chí Minh', desc: 'Trung tâm tài chính, thương mại & hạ tầng phía Nam' },
  { id: 'Đà Nẵng', label: 'Đà Nẵng', desc: 'Đô thị thông minh & trung tâm kinh tế ven biển' },
  { id: 'Miền Bắc', label: 'Miền Bắc', desc: 'Đồng bằng Sông Hồng & các tỉnh Trung du Bắc Bộ' },
  { id: 'Miền Trung', label: 'Miền Trung', desc: 'Duyên hải Nam Trung Bộ & Vùng đất Tây Nguyên' },
  { id: 'Miền Nam', label: 'Miền Nam', desc: 'Vùng Đông Nam Bộ & Đồng bằng Sông Cửu Long' },
  { id: 'Hải Phòng', label: 'Hải Phòng', desc: 'Thành phố cảng biển quốc tế & công nghiệp phụ trợ' },
  { id: 'Cần Thơ', label: 'Cần Thơ', desc: 'Đô thị hạt nhân Đồng bằng Sông Cửu Long' },
  { id: 'Quảng Ninh', label: 'Quảng Ninh', desc: 'Vùng kinh tế biển, du lịch & công nghiệp năng lượng' },
  { id: 'Bình Dương', label: 'Bình Dương', desc: 'Thủ phủ khu công nghiệp & chuỗi cung ứng thông minh' },
  { id: 'Đồng Nai', label: 'Đồng Nai', desc: 'Cảng hàng không Quốc tế Long Thành & Logistics' },
  { id: 'Bà Rịa - Vũng Tàu', label: 'Bà Rịa - Vũng Tàu', desc: 'Cụm cảng Cái Mép - Thị Vải & Năng lượng dầu khí' },
  { id: 'Khánh Hòa', label: 'Khánh Hòa (Nha Trang)', desc: 'Vịnh Vân Phong, đô thị biển & dịch vụ cao cấp' },
  { id: 'Lâm Đồng', label: 'Lâm Đồng (Đà Lạt)', desc: 'Nông nghiệp công nghệ cao & dự án cao tốc' },
];

const CURATED_KEYWORD_TOPICS = [
  {
    id: 'transport',
    category: 'Giao thông & Hạ tầng',
    icon: <Building size={15} />,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    items: ['Đường sắt cao tốc', 'Metro', 'Cao tốc Bắc Nam', 'Cảng hàng không', 'Cảng biển', 'Cầu vượt', 'Giao thông thông minh']
  },
  {
    id: 'energy',
    category: 'Năng lượng & Môi trường',
    icon: <Zap size={15} />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    items: ['Năng lượng tái tạo', 'Điện gió ngoài khơi', 'Điện mặt trời', 'Xử lý nước thải', 'Xử lý rác thải', 'Lưới điện thông minh']
  },
  {
    id: 'tech',
    category: 'Công nghệ & Chuyển đổi số',
    icon: <Cpu size={15} />,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.08)',
    items: ['Chuyển đổi số', 'Trung tâm dữ liệu', 'Smart City', 'Camera AI', 'An toàn thông tin', 'Phần mềm quản trị']
  },
  {
    id: 'health',
    category: 'Y tế & Giáo dục',
    icon: <Activity size={15} />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    items: ['Thiết bị y tế', 'Bệnh viện đa khoa', 'Chuyển đổi số y tế', 'Trường học thông minh', 'Công nghệ sinh học']
  },
  {
    id: 'construction',
    category: 'Xây dựng & Đô thị',
    icon: <Layers size={15} />,
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.08)',
    items: ['Khu công nghiệp', 'Nhà ở xã hội', 'Vật liệu mới', 'Cấp thoát nước', 'Quy hoạch đô thị']
  }
];

const HOUR_PRESETS = [
  { val: 6, label: '06:00', desc: 'Sáng sớm', icon: '🌅' },
  { val: 7, label: '07:00', desc: 'Đầu giờ sáng', icon: '☕' },
  { val: 8, label: '08:00', desc: 'Giờ làm việc', icon: '🕗', tag: 'Đề xuất' },
  { val: 9, label: '09:00', desc: 'Hành chính', icon: '🕘' },
  { val: 12, label: '12:00', desc: 'Nghỉ trưa', icon: '🕛' },
  { val: 18, label: '18:00', desc: 'Tan tầm', icon: '🌆' },
  { val: 20, label: '20:00', desc: 'Buổi tối', icon: '🌙' },
];

function SimpleConfetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const particles = Array.from({ length: 45 }).map(() => ({
      x: canvas.width * 0.5,
      y: canvas.height * 0.28,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.7) * 11,
      size: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8
    }));

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24;
        p.vx *= 0.98;
        p.alpha -= 0.012;
        p.rotation += p.rotSpeed;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });
      if (alive) animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        width: '100%',
        height: '100%'
      }}
    />
  );
}

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();

  const [step, setStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState(() => user?.region || 'Toàn quốc');
  const [customRegion, setCustomRegion] = useState('');
  const [useCustomRegion, setUseCustomRegion] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');

  const [selectedKeywords, setSelectedKeywords] = useState([
    'Đường sắt cao tốc', 'Chuyển đổi số', 'Năng lượng tái tạo'
  ]);
  const [customKeywordInput, setCustomKeywordInput] = useState('');

  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestHour, setDigestHour] = useState(8);
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [bellRinging, setBellRinging] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleToggleDigest = () => {
    const next = !digestEnabled;
    setDigestEnabled(next);
    if (next) {
      setBellRinging(true);
      setTimeout(() => setBellRinging(false), 800);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.region) {
        setSelectedRegion(user.region);
        const isPreset = ALL_REGIONS.some(r => r.id === user.region);
        if (!isPreset && user.region !== 'Toàn quốc') {
          setUseCustomRegion(true);
          setCustomRegion(user.region);
        }
      }
      if (typeof user.email_digest_enabled === 'boolean') {
        setDigestEnabled(user.email_digest_enabled);
      }
      if (user.digest_hour) {
        setDigestHour(user.digest_hour);
      }
      if (user.timezone) {
        setTimezone(user.timezone);
      }
    }
  }, [user]);

  // Khóa cuộn trang nền khi popup setup đang mở
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRegions = ALL_REGIONS.filter(r => 
    r.label.toLowerCase().includes(regionSearch.toLowerCase()) ||
    r.desc.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const handleToggleKeyword = (kw) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(prev => prev.filter(item => item !== kw));
    } else {
      if (selectedKeywords.length >= 30) return;
      setSelectedKeywords(prev => [...prev, kw]);
    }
  };

  const handleAddCustomKeyword = (e) => {
    if (e) e.preventDefault();
    const term = customKeywordInput.trim();
    if (!term) return;
    if (!selectedKeywords.includes(term)) {
      if (selectedKeywords.length >= 30) return;
      setSelectedKeywords(prev => [...prev, term]);
    }
    setCustomKeywordInput('');
  };

  const handleSelectAllCategory = (items) => {
    const newItems = items.filter(it => !selectedKeywords.includes(it));
    setSelectedKeywords(prev => [...prev, ...newItems].slice(0, 30));
  };

  const handleRemoveKeyword = (kw) => {
    setSelectedKeywords(prev => prev.filter(item => item !== kw));
  };

  const getEffectiveRegion = () => {
    if (useCustomRegion && customRegion.trim()) {
      return customRegion.trim();
    }
    return selectedRegion || 'Toàn quốc';
  };

  const handleFinishSetup = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const finalRegion = getEffectiveRegion();

      // 1. Cập nhật profile & digest settings
      await settingsService.updateSettings({
        region: finalRegion,
        email_digest_enabled: digestEnabled,
        digest_hour: Number(digestHour),
        timezone,
        permissions: {
          onboarding_completed: true,
        }
      });

      // 2. Thêm các từ khóa đã chọn vào hệ thống
      if (selectedKeywords.length > 0) {
        for (const term of selectedKeywords) {
          try {
            await keywordsService.createKeyword({ term, is_primary: true });
          } catch {
            // bỏ qua nếu từ khóa đã tồn tại
          }
        }
      }

      // 3. Đánh dấu đã hoàn thành setup vào localStorage
      const userKey = user?.email || user?.id;
      if (userKey) {
        localStorage.setItem(`bis_onboarded_${userKey}`, 'true');
        localStorage.setItem(`bis_user_region_${userKey}`, finalRegion);
        sessionStorage.removeItem(`bis_onboard_dismissed_${userKey}`);
      }

      await refreshUser();

      if (onComplete) onComplete();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error saving onboarding:', err);
      setSaveError(err.response?.data?.detail || 'Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    const userKey = user?.email || user?.id;
    if (userKey) {
      sessionStorage.setItem(`bis_onboard_dismissed_${userKey}`, 'true');
    }
    if (onClose) onClose();
  };

  const stepsList = [
    { num: 1, title: t('onboarding.stepRegion'), icon: <MapPin size={14} /> },
    { num: 2, title: t('onboarding.stepKeywords'), icon: <Tag size={14} /> },
    { num: 3, title: t('onboarding.stepDigest'), icon: <Mail size={14} /> },
    { num: 4, title: t('onboarding.stepComplete'), icon: <CheckCircle2 size={14} /> },
  ];

  // CSS for silky smooth tab cross-fade & modal card pop-in & bell ring shake
  const tabAnimationStyles = `
    @keyframes modalCardPopIn {
      from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes onboardingTabFadeSlide {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes bellShake {
      0% { transform: rotate(0deg); }
      15% { transform: rotate(22deg); }
      30% { transform: rotate(-20deg); }
      45% { transform: rotate(15deg); }
      60% { transform: rotate(-10deg); }
      75% { transform: rotate(6deg); }
      85% { transform: rotate(-3deg); }
      100% { transform: rotate(0deg); }
    }
    .bell-ring-active {
      transform-origin: top center;
      animation: bellShake 0.75s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .onboarding-tab-pane {
      animation: onboardingTabFadeSlide 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  `;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 15, 30, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '20px',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{tabAnimationStyles}</style>

      {/* Gentle Ambient Background Glow */}
      <div style={{
        position: 'fixed',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(147, 51, 234, 0.08) 50%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: -1,
      }} />

      <div
        style={{
          width: '100%',
          maxWidth: 820,
          background: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: 20,
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.35), 0 0 25px rgba(59, 130, 246, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          margin: 'auto',
          animation: 'modalCardPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d1527 0%, #151f38 50%, #1a1735 100%)',
            padding: '20px 28px 18px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            flexShrink: 0
          }}
        >
          {/* Ambient Glow */}
          <div style={{ position: 'absolute', right: -20, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 16,
                background: 'rgba(59, 130, 246, 0.18)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                color: '#93c5fd',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.3px',
              }}
            >
              <Sparkles size={12} style={{ color: '#60a5fa' }} />
              {t('onboarding.welcomeBadge')}
            </div>

            <button
              onClick={handleSkip}
              aria-label="Skip onboarding"
              title={t('onboarding.btnSkip')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#94a3b8',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{t('onboarding.welcomeTitle')}</span>
              {user?.display_name && (
                <span style={{
                  background: 'linear-gradient(135deg, #60a5fa, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {user.display_name}
                </span>
              )}
            </h2>
            <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3, marginBottom: 0, lineHeight: 1.4, maxWidth: 640 }}>
              {t('onboarding.welcomeSubtitle')}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14, position: 'relative', zIndex: 1 }}>
            {stepsList.map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <button
                  type="button"
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 10px',
                    borderRadius: 12,
                    background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(99, 102, 241, 0.28))' : isPast ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: isActive ? '1px solid #60a5fa' : isPast ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10.5,
                    fontWeight: 900,
                    background: isPast ? 'linear-gradient(135deg, #10b981, #059669)' : isActive ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}>
                    {isPast ? <Check size={11} strokeWidth={3} /> : s.num}
                  </div>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? '#ffffff' : isPast ? '#a7f3d0' : '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body Container with FIXED UNIFIED HEIGHT & SMOOTH TRANSITIONS */}
        <div
          style={{
            padding: '20px 28px',
            height: '450px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {saveError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 12.5,
              fontWeight: 700,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0
            }}>
              ⚠️ {saveError}
            </div>
          )}

          {/* ══════════ STEP 1: PHÂN VÙNG (TOOLBAR ON SAME ROW) ══════════ */}
          {step === 1 && (
            <div key="step-1" className="onboarding-tab-pane">
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <MapPin size={16} style={{ color: 'var(--brand-500, #3b82f6)' }} />
                    {t('onboarding.regionTitle')}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>
                    {t('onboarding.regionDesc')}
                  </p>
                </div>

                {/* Combined Toolbar: Search + Custom Region Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Filter Search Input */}
                  <div style={{ position: 'relative', width: 165 }}>
                    <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Lọc tỉnh thành..."
                      value={regionSearch}
                      onChange={(e) => setRegionSearch(e.target.value)}
                      style={{ height: 32, paddingLeft: 26, fontSize: 11.5, borderRadius: 8 }}
                    />
                  </div>

                  {/* Custom Region Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Hoặc gõ địa bàn khác..."
                      value={customRegion}
                      onChange={(e) => {
                        setCustomRegion(e.target.value);
                        if (e.target.value.trim()) {
                          setUseCustomRegion(true);
                        }
                      }}
                      onFocus={() => {
                        if (customRegion.trim()) setUseCustomRegion(true);
                      }}
                      style={{
                        width: 170,
                        height: 32,
                        fontSize: 11.5,
                        borderRadius: 8,
                        border: useCustomRegion && customRegion.trim() ? '1.5px solid var(--brand-500, #3b82f6)' : '1px solid var(--border)'
                      }}
                    />
                    {customRegion.trim() && (
                      <button
                        type="button"
                        className={useCustomRegion ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                        onClick={() => {
                          if (customRegion.trim()) setUseCustomRegion(true);
                        }}
                        style={{ height: 32, padding: '0 8px', fontSize: 11, fontWeight: 700, borderRadius: 8 }}
                      >
                        {useCustomRegion ? '✓ Đang chọn' : 'Chọn'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active custom region alert tag if selected */}
              {useCustomRegion && customRegion.trim() && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'var(--brand-50, rgba(59, 130, 246, 0.08))',
                  border: '1px solid var(--brand-300, #93c5fd)',
                  color: 'var(--brand-600, #2563eb)',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}>
                  <span>📍 Đang chọn địa bàn tùy biến: <strong>{customRegion.trim()}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomRegion(false);
                      setCustomRegion('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}

              {/* Regions Grid (Clean & Soothing Aesthetics) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
                gap: 8,
                flex: 1,
                overflowY: 'auto',
                alignContent: 'start',
                paddingRight: 2
              }}>
                {filteredRegions.map((reg) => {
                  const isSelected = !useCustomRegion && selectedRegion === reg.id;
                  return (
                    <div
                      key={reg.id}
                      onClick={() => {
                        setSelectedRegion(reg.id);
                        setUseCustomRegion(false);
                      }}
                      style={{
                        padding: '10px 13px',
                        borderRadius: 10,
                        border: isSelected ? '1.5px solid var(--brand-500, #3b82f6)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--brand-50, rgba(59, 130, 246, 0.06))' : 'var(--bg-surface-2)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isSelected ? '0 3px 10px rgba(59, 130, 246, 0.12)' : 'none',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--brand-300, #93c5fd)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {reg.label}
                        </div>
                        {isSelected && (
                          <span style={{
                            width: 17, height: 17, borderRadius: '50%',
                            background: 'var(--brand-500, #3b82f6)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 900,
                            flexShrink: 0
                          }}>
                            ✓
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {reg.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ STEP 2: TỪ KHÓA & LĨNH VỰC ══════════ */}
          {step === 2 && (
            <div key="step-2" className="onboarding-tab-pane">
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Tag size={16} style={{ color: 'var(--brand-500, #3b82f6)' }} />
                    {t('onboarding.keywordsTitle')}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>
                    {t('onboarding.keywordsDesc')}
                  </p>
                </div>
                <div style={{
                  padding: '3px 10px',
                  borderRadius: 16,
                  background: selectedKeywords.length > 0 ? 'var(--brand-50, rgba(59, 130, 246, 0.08))' : '#fee2e2',
                  border: `1px solid ${selectedKeywords.length > 0 ? 'var(--brand-300, #93c5fd)' : '#fca5a5'}`,
                  color: selectedKeywords.length > 0 ? 'var(--brand-600, #2563eb)' : '#dc2626',
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <Flame size={12} style={{ color: '#f59e0b' }} />
                  {t('onboarding.selectedKeywordsCount').replace('{count}', selectedKeywords.length)}
                </div>
              </div>

              {/* Add Custom Keyword bar */}
              <form onSubmit={handleAddCustomKeyword} style={{ display: 'flex', gap: 6, marginBottom: 10, flexShrink: 0 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('onboarding.customKeywordPlaceholder')}
                    value={customKeywordInput}
                    onChange={(e) => setCustomKeywordInput(e.target.value)}
                    style={{ paddingLeft: 30, height: 34, fontSize: 12, borderRadius: 8 }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ gap: 5, padding: '0 14px', fontWeight: 800, fontSize: 12, borderRadius: 8 }}
                >
                  <Plus size={14} /> Thêm
                </button>
              </form>

              {/* Selected keywords pills bar */}
              {selectedKeywords.length > 0 && (
                <div style={{
                  background: 'var(--bg-surface-2)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Từ khóa đang chọn ({selectedKeywords.length}/30):
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedKeywords([])}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 50, overflowY: 'auto' }}>
                    {selectedKeywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        🏷️ {kw}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          style={{
                            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer',
                            padding: 2, borderRadius: '50%', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Curated keyword chips grouped by industry category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                {CURATED_KEYWORD_TOPICS.map((group) => (
                  <div
                    key={group.category}
                    style={{
                      background: 'var(--bg-surface-2)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: group.bg, color: group.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {group.icon}
                        </div>
                        <span>{group.category}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectAllCategory(group.items)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--brand-600, #2563eb)',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        + Chọn tất cả
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {group.items.map((item) => {
                        const isChosen = selectedKeywords.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleToggleKeyword(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 11.5,
                              fontWeight: isChosen ? 800 : 600,
                              cursor: 'pointer',
                              border: isChosen ? '1px solid var(--brand-500, #3b82f6)' : '1px solid var(--border)',
                              background: isChosen ? 'var(--brand-50, rgba(59, 130, 246, 0.12))' : 'var(--bg-surface)',
                              color: isChosen ? 'var(--brand-600, #2563eb)' : 'var(--text-secondary)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isChosen ? '✓' : '+'} {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: NHẬN EMAIL & DIGEST ══════════ */}
          {step === 3 && (
            <div key="step-3" className="onboarding-tab-pane">
              <div style={{ marginBottom: 12, flexShrink: 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Mail size={16} style={{ color: 'var(--brand-500, #3b82f6)' }} />
                  {t('onboarding.digestTitle')}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>
                  {t('onboarding.digestDesc')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'space-between' }}>
                {/* Toggle Enable/Disable Card */}
                <div
                  onClick={handleToggleDigest}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    background: digestEnabled ? 'rgba(16, 185, 129, 0.07)' : 'var(--bg-surface-2)',
                    border: digestEnabled ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border)',
                    boxShadow: digestEnabled ? '0 4px 16px rgba(16, 185, 129, 0.12)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    userSelect: 'none',
                    flexShrink: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: digestEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(148, 163, 184, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: digestEnabled ? '#ffffff' : '#64748b',
                      boxShadow: digestEnabled ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                      flexShrink: 0,
                      transition: 'all 0.25s ease',
                    }}>
                      <div className={bellRinging || digestEnabled ? 'bell-ring-active' : ''} style={{ display: 'flex', transformOrigin: 'top center' }}>
                        <BellRing size={22} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {t('onboarding.enableDigest')}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                        {t('onboarding.enableDigestSub')} ({user?.email})
                      </div>
                    </div>
                  </div>

                  {/* Luxury iOS-Style Switch */}
                  <div
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 13,
                      background: digestEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(148, 163, 184, 0.35)',
                      position: 'relative',
                      transition: 'background 0.25s ease, box-shadow 0.25s ease',
                      boxShadow: digestEnabled ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: 3,
                        left: digestEnabled ? 25 : 3,
                        transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.22)',
                      }}
                    />
                  </div>
                </div>

                {digestEnabled && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    padding: '14px 18px',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    flex: 1
                  }}>
                    {/* Hour selection pills */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, color: 'var(--text-primary)' }}>
                        <Clock size={13} style={{ color: 'var(--brand-500)' }} />
                        {t('onboarding.digestHour')}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: 6 }}>
                        {HOUR_PRESETS.map((preset) => {
                          const isHourSelected = digestHour === preset.val;
                          return (
                            <button
                              type="button"
                              key={preset.val}
                              onClick={() => setDigestHour(preset.val)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: 8,
                                border: isHourSelected ? '1.5px solid var(--brand-500, #3b82f6)' : '1px solid var(--border)',
                                background: isHourSelected ? 'var(--brand-50, rgba(59, 130, 246, 0.12))' : 'var(--bg-surface)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s'
                              }}
                            >
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: isHourSelected ? 'var(--brand-600, #2563eb)' : 'var(--text-primary)' }}>
                                  {preset.icon} {preset.label}
                                </div>
                                <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                                  {preset.desc}
                                </div>
                              </div>
                              {preset.tag && (
                                <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 3px', borderRadius: 3, background: '#10b981', color: '#fff' }}>
                                  HOT
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, color: 'var(--text-primary)' }}>
                        <Globe size={13} style={{ color: 'var(--brand-500)' }} />
                        {t('onboarding.digestTimezone')}
                      </label>
                      <select
                        className="form-input"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        style={{ minHeight: 40, height: 40, padding: '8px 12px', fontSize: 13, borderRadius: 10, lineHeight: '1.4' }}
                      >
                        <option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option>
                        <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                        <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                        <option value="UTC">UTC (Quốc tế)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Email Preview Card */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--brand-50, rgba(59, 130, 246, 0.05))',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 'auto',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    flexShrink: 0
                  }}>
                    <Sparkles size={14} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Bản tin AI:</strong> Tổng hợp tin tức, gói thầu GOV & ODA theo từ khóa gửi về email lúc <strong>{digestHour}:00</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 4: HOÀN TẤT & TỔNG KẾT ══════════ */}
          {step === 4 && (
            <div key="step-4" className="onboarding-tab-pane" style={{ position: 'relative', justifyContent: 'space-between' }}>
              <SimpleConfetti />

              <div style={{ textAlign: 'center', marginBottom: 10, flexShrink: 0 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 8px', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                }}>
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                  🎉 {t('onboarding.summaryTitle')}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>
                  {t('onboarding.summaryDesc')}
                </p>
              </div>

              {/* Review summary cards in Bento Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, flex: 1, alignContent: 'center' }}>
                {/* 1. Region */}
                <div style={{
                  padding: '12px 14px', borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                    <MapPin size={13} style={{ color: 'var(--brand-500)' }} />
                    {t('onboarding.summaryRegion')}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                    📍 {getEffectiveRegion()}
                  </div>
                </div>

                {/* 2. Email Digest */}
                <div style={{
                  padding: '12px 14px', borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                    <Mail size={13} style={{ color: 'var(--brand-500)' }} />
                    {t('onboarding.summaryDigest')}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 800,
                    color: digestEnabled ? '#15803d' : '#64748b'
                  }}>
                    {digestEnabled ? `🟢 Bật lúc ${digestHour}:00 hàng ngày` : '⚪ Đang tắt'}
                  </div>
                </div>

                {/* 3. Keywords Full Width */}
                <div style={{
                  gridColumn: 'span 2',
                  padding: '12px 14px', borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      <Tag size={13} style={{ color: 'var(--brand-500)' }} />
                      {t('onboarding.summaryKeywords')} ({selectedKeywords.length})
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 65, overflowY: 'auto' }}>
                    {selectedKeywords.length > 0 ? (
                      selectedKeywords.map((kw) => (
                        <span key={kw} style={{
                          padding: '2px 8px', borderRadius: 10, background: 'var(--bg-surface)',
                          border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)'
                        }}>
                          🏷️ {kw}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#dc2626', fontStyle: 'italic' }}>
                        {t('onboarding.noKeywordsAlert')}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Quick Feature Discovery Badges */}
                <div style={{
                  gridColumn: 'span 2',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'var(--bg-surface-2)',
                  border: '1px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 6, flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Newspaper size={12} style={{ color: '#3b82f6' }} /> Báo Chí Toàn Quốc
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building size={12} style={{ color: '#f59e0b' }} /> Đấu Thầu GOV
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={12} style={{ color: '#10b981' }} /> ODA World Bank & ADB
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Bot size={12} style={{ color: '#a855f7' }} /> Trợ Lý AI Gemini
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Fixed Height) */}
        <div style={{
          padding: '14px 28px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0
        }}>
          <div>
            {step > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(prev => prev - 1)}
                disabled={saving}
                style={{ gap: 5, fontSize: 12.5, fontWeight: 700, borderRadius: 8, padding: '7px 14px' }}
              >
                <ChevronLeft size={15} /> {t('onboarding.btnPrev')}
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={handleSkip}
                disabled={saving}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '5px 10px'
                }}
              >
                {t('onboarding.btnSkip')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {step < 4 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(prev => prev + 1)}
                style={{ gap: 5, fontSize: 13, fontWeight: 800, padding: '8px 20px', borderRadius: 10 }}
              >
                {t('onboarding.btnNext')} <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinishSetup}
                disabled={saving}
                style={{
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 900,
                  padding: '9px 24px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #10b981, #2563eb)',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} />
                    {t('onboarding.saving')}
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    {t('onboarding.btnFinish')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
