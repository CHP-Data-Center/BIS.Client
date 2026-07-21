# IIH – Integrated Intelligence Hub

> Trung Tâm Thông Tin Tích Hợp — theo dõi tin tức, dự án và đấu thầu từ ADB, World Bank và hệ thống đấu thầu quốc gia. Phân tích bởi AI, cập nhật liên tục.

## 🚀 Tech Stack

- **React 18** + **Vite 5** + **JSX**
- **React Router v6** — Client-side routing
- **Lucide React** — Icon library
- **Vanilla CSS** — Custom design system (CSS variables, glassmorphism, 15+ animations)
- **Context API** — Theme (Light/Dark) & Auth management

## ✨ Tính Năng

| Tính năng | Mô tả |
|---|---|
| 🔐 Auth | Đăng nhập / Guest mode (không cần login) |
| 🌗 Theme | Light / Dark mode với localStorage |
| 📊 Dashboard | Hero banner, animated stats, news grid, pagination |
| 🔥 Trending | Marquee auto-scroll + Top-3 pinned pills |
| 📰 News | Grid/List toggle, filter by source, search, sort |
| 🤖 AI Summary | Badge + tóm tắt AI cho từng bài viết |
| ⏰ Deadline | Countdown timer cho gói thầu |
| 📄 Pagination | 6 bài/trang, smooth scroll |
| ⬆️ Scroll-top | Floating button |
| 🕐 Live Clock | Realtime clock trong header |
| 💀 Skeleton | Shimmer loading effect |
| 📱 Responsive | Mobile-first layout |

## 📦 Nguồn Dữ Liệu

- **ADB** — Asian Development Bank (adb.org)
- **World Bank** — World Bank Group (worldbank.org)
- **Đấu Thầu Công** — Hệ thống đấu thầu quốc gia (muasamcong.mpi.gov.vn)

## 🛠️ Cài Đặt & Chạy

```bash
# Cài dependencies
npm install

# Chạy dev server (http://localhost:3000)
npm run dev

# Build production
npm run build
```

## 📁 Cấu Trúc Dự Án

```
src/
├── main.jsx               # Entry point
├── App.jsx                # Router + Layout
├── index.css              # Design system (CSS variables, animations)
├── context/
│   ├── ThemeContext.jsx   # Light/Dark mode
│   └── AuthContext.jsx    # Auth + Guest mode
├── data/
│   └── mockData.js        # Mock data (ADB, World Bank, Đấu Thầu)
├── components/
│   ├── Header.jsx         # Fixed header + live clock
│   ├── Sidebar.jsx        # Navigation
│   ├── NewsCard.jsx       # Bài viết card
│   ├── StatsCard.jsx      # Animated stats
│   ├── SourceDropdown.jsx # Dropdown nguồn dữ liệu
│   ├── ThemeToggle.jsx    # Light/Dark toggle
│   └── ScrollToTop.jsx    # Floating scroll button
└── pages/
    ├── LoginPage.jsx      # Particles + glassmorphism
    ├── DashboardPage.jsx  # Main dashboard
    ├── NewsPage.jsx       # News listing
    └── ArticlePage.jsx    # Article detail
```

## 🔑 Tài Khoản Demo

| Role | Email | Password |
|---|---|---|
| Admin | `admin@iih.vn` | `iih2026` |
| Demo | `demo@iih.vn` | `demo123` |
| Khách | *(tự động)* | *(không cần login)* |

## 🎨 Hiệu Ứng & Animation

- `wiggle` · `bounceIn` · `floatY` · `glowPulse` · `jelly`
- `shimmerSweep` · `scalePop` · `marquee` · `slideInLeft` · `fadeUp`
- Hover lift, glow border, shimmer overlay, bottom accent bar
- Staggered card animations, animated counter numbers

---

> **Phiên bản**: 1.0.0 · **License**: MIT
