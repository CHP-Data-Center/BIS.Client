# IIH – Integrated Intelligence Hub

**Trung Tâm Thông Tin Tích Hợp** — Web app theo dõi tin tức và đấu thầu từ ADB, World Bank và hệ thống đấu thầu quốc gia Việt Nam.

## Tech Stack

- **React 18** + **Vite 5**
- **React Router v6**
- **Lucide React** (icons)
- **Vanilla CSS** — design system tùy chỉnh hoàn toàn

## Tính năng

- 📊 Dashboard tổng quan với animated stats
- 🔥 Trending keywords marquee
- 📰 News feed: ADB · World Bank · Đấu Thầu Công
- 🤖 AI Summary badge trên từng bài viết
- 🌗 Light / Dark mode toggle
- 🔍 Tìm kiếm & lọc theo nguồn
- 📄 Phân trang (6 bài/trang)
- ⏰ Live clock trong header
- 🔐 Login tùy chọn (guest mode mặc định)

## Cài đặt

```bash
npm install
npm run dev
```

Mở trình duyệt tại **http://localhost:3000**

## Tài khoản demo

| Role  | Email           | Password |
|-------|-----------------|----------|
| Admin | admin@iih.vn    | iih2026  |
| Demo  | demo@iih.vn     | demo123  |
| Guest | *(tự động)*     | *(không cần)* |

## Nguồn dữ liệu

| Nguồn | URL |
|-------|-----|
| ADB | https://www.adb.org |
| World Bank | https://www.worldbank.org |
| Đấu Thầu Công | https://muasamcong.mpi.gov.vn |

> Dữ liệu hiện tại là mock. Backend crawler + AI đang phát triển riêng.
