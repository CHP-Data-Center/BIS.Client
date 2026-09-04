// src/utils/easterEgg.js
/**
 * DevTools Console Easter Egg
 */
export function initConsoleEasterEgg() {
  if (typeof window === 'undefined') return;

  const showBanner = () => {
    console.log(
      '%cVUI LÒNG ĐÁNH GIỜ HÀNH CHÍNHHHH!!!',
      'color: #ff1e1e; font-size: 38px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.6); font-family: "Segoe UI", Roboto, -apple-system, sans-serif; padding: 4px 0;'
    );
    console.log(
      '%cChúng tôi không được nhận lương OT.',
      'color: #ef4444; font-size: 16px; font-weight: 700; font-family: sans-serif; margin-bottom: 6px;'
    );
    console.log(
      '%c⚠️ BIS Intelligence Notice: Mọi hành vi soi mã nguồn / F12 ngoài giờ hành chính sẽ không được hỗ trợ kỹ thuật!',
      'color: #f59e0b; font-size: 13px; font-weight: 600; font-style: italic;'
    );
  };

  // In ngay khi app nạp
  showBanner();
}
