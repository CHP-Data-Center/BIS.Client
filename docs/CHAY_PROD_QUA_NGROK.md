# Cho bản GitHub Pages chạy được, backend đặt tại máy server (qua ngrok)

Trang `https://chp-data-center.github.io/BIS.Client/` chỉ là **frontend tĩnh**. Nó cần một
địa chỉ API **công khai và HTTPS** để gọi. Cách nhanh nhất khi chưa dựng server thật: chạy
backend ở máy mình rồi mở một đường hầm ngrok ra ngoài.

> Dùng để **demo / dùng nội bộ**. Máy tắt hoặc mất mạng là cả hệ thống ngừng. Muốn chạy lâu
> dài thì phải deploy backend lên máy chủ thật (xem [DEPLOY.md](../../DEPLOY.md)).

## Vì sao không cắm đại URL ngrok vào là xong

Ba chỗ sẽ gãy nếu bỏ qua — cả ba đã được kiểm bằng tunnel thật, không phải suy đoán:

| Vấn đề | Biểu hiện | Đã xử ở đâu |
|---|---|---|
| Vite nhúng `VITE_API_BASE_URL` **lúc build**, không đọc lúc chạy | Bản deploy gọi API vào `http://localhost:8000` của chính máy người xem; trang HTTPS gọi HTTP còn bị trình duyệt chặn (mixed content) | Workflow `deploy-gh-pages.yml` truyền biến vào bước build |
| ngrok bản miễn phí chèn **trang cảnh báo HTML** trước mọi request trông giống trình duyệt | API trả HTML thay vì JSON → app hỏng toàn bộ | `src/services/api.js` gửi kèm header `ngrok-skip-browser-warning` |
| Backend chặn CORS | Trình duyệt báo lỗi CORS, không request nào đi được | `CORS_ORIGINS` của backend phải có `https://chp-data-center.github.io` |

Đối chứng thật qua tunnel:

```
# không có header bypass:
curl https://<ngrok>/api/v1/ai/status   ->  <!DOCTYPE html> ... (trang cảnh báo ngrok)
# có header:
curl -H "ngrok-skip-browser-warning: true" https://<ngrok>/api/v1/ai/status  ->  {"configured":true}
```

## Các bước

### 1. Lấy tên miền ngrok CỐ ĐỊNH (quan trọng)

Bản miễn phí đổi URL mỗi lần khởi động lại. Mà URL lại bị **nhúng cứng vào bundle lúc
build**, nên URL đổi là phải build lại frontend — không ai chịu nổi.

Tài khoản ngrok miễn phí được cấp sẵn **1 tên miền tĩnh**. Vào
[dashboard.ngrok.com](https://dashboard.ngrok.com) → **Domains** → lấy tên dạng
`ten-cua-ban.ngrok-free.app`.

### 2. Cho phép origin GitHub Pages trong CORS

Sửa `backend/.env`, thêm origin vào cuối danh sách:

```
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5173","http://localhost:5174","http://127.0.0.1:5173","https://chp-data-center.github.io"]
```

`.env` không tự nạp lại — sửa xong phải khởi động lại backend.

### 3. Chạy backend + ngrok trên máy server

```bash
cd backend
run.bat
```

Cửa sổ khác:

```bash
ngrok http 8000 --url=ten-cua-ban.ngrok-free.app
```

(ngrok bản cũ dùng `--domain=` thay cho `--url=`.)

Kiểm nhanh — phải ra `{"configured":true}`, không phải HTML:

```bash
curl -H "ngrok-skip-browser-warning: true" https://ten-cua-ban.ngrok-free.app/api/v1/ai/status
```

### 4. Trỏ frontend vào địa chỉ đó

Trên GitHub repo **BIS.Client**: **Settings → Secrets and variables → Actions → Variables →
New repository variable**

| | |
|---|---|
| Name | `VITE_API_BASE_URL` |
| Value | `https://ten-cua-ban.ngrok-free.app/api/v1` |

Nhớ có `/api/v1` ở cuối.

### 5. Build lại trang

**Actions → Deploy to GitHub Pages → Run workflow**. Log sẽ in `API backend: https://…`;
nếu in cảnh báo *"Chưa đặt VITE_API_BASE_URL"* thì bước 4 chưa ăn.

Xong, mở `https://chp-data-center.github.io/BIS.Client/login` và đăng nhập.

## Lưu ý an toàn

Đường hầm này **công khai trên Internet** và nối thẳng vào database thật. Chỉ có JWT chắn
phía trước, nên:

- Đổi hết mật khẩu các tài khoản demo (`admin@ckjvn.vn`, `superadmin@ckjvn.vn`… đang là mật
  khẩu mặc định, lại còn hiện ngay trên trang đăng nhập).
- Tắt ngrok khi không dùng.
- Cân nhắc bật xác thực thêm ở ngrok: `ngrok http 8000 --url=… --basic-auth="user:pass"`
  (lưu ý: bật cái này thì frontend phải gửi kèm Basic auth, hiện chưa hỗ trợ — dùng khi chỉ
  cần chặn người lạ dò URL, không dùng chung với frontend).

## Khi có server thật

Chỉ cần đổi giá trị `VITE_API_BASE_URL` sang domain mới, thêm origin đó vào `CORS_ORIGINS`,
rồi chạy lại workflow. Không phải sửa dòng code nào.
