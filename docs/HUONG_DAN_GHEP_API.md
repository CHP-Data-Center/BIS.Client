# Hướng dẫn ghép API — Frontend BIS

Tài liệu cho FE dev dựng giao diện & nối API. Nguồn sự thật đầy đủ (mọi endpoint, mọi field):
Swagger tại `http://localhost:8000/docs` và `backend/api_documentation.md`. File này tập trung vào
**cách dùng đúng** những phần hay sai: đa ngôn ngữ, lịch sử chat AI, mua sắm công, ODA ADB/WB.

---

## 0. Chuẩn bị

```bash
npm install
npm run dev            # http://localhost:5173 (hoặc :3000 tùy cấu hình)
```

`.env` của FE:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Đừng tự tạo axios mới.** Dùng `src/services/api.js` — đã có sẵn:

| Cơ chế | Chi tiết |
|---|---|
| JWT | Tự gắn `Authorization: Bearer <token>` từ `localStorage.bis_token` |
| 401 | Tự xóa token + chuyển về `/login?session_expired=1` |
| Retry | GET gặp lỗi mạng/502/503/504 → thử lại tối đa 2 lần (backoff 1s, 2s) |
| Dedupe | 2 GET cùng `url + params` chạy song song → dùng chung 1 promise |
| Timeout | Mặc định **15s**. Endpoint chậm phải truyền timeout riêng (xem §4, §9) |

Ngoài ra `src/utils/apiCache.js` cache **60 giây** cho ODA / mua sắm công / thống kê (có lưu
localStorage để F5 không nháy). Sau khi thêm/sửa/xóa dữ liệu, gọi lại với `force = true`
(vd `odaService.getProcurement(params, true)`), nếu không màn hình vẫn hiện bản cũ tới 1 phút.

**Quy ước phân lớp (bắt buộc):** component **không** gọi `api` trực tiếp. Mỗi domain một file
trong `src/services/` (`articles.js`, `oda.js`, `ai.js`, …), component chỉ gọi hàm của service.

---

## 1. Đăng nhập & phân quyền

```
POST /auth/login   { email, password }
→ 200 { access_token, token_type: "bearer", expires_in_minutes }
```

Lưu `access_token` vào `localStorage.bis_token`, thông tin user vào `bis_user`.

Vai trò: `super_admin` · `admin` · `staff` · `user` · `personal`.

> ⚠️ **`personal` bị chặn (403)** ở: Trợ lý AI + lịch sử chat, `/oda-projects`, `/procurement`.
> Ở `/articles`, tài khoản `personal` bị ép `source_type=press` (chỉ thấy báo chí, không thấy tin thầu).
> FE nên **ẩn menu** thay vì để người dùng bấm rồi nhận 403.

Endpoint `/admin/**` yêu cầu `admin` hoặc `super_admin`.

---

## 2. Hai quy ước dùng chung mọi nơi

**Lỗi** — luôn có dạng:

```json
{ "detail": "Không tìm thấy hội thoại.", "code": "not_found" }
```

| HTTP | `code` | Ý nghĩa cho UI |
|---|---|---|
| 400 | `bad_request` | Dữ liệu gửi lên sai → hiện lỗi cạnh input |
| 401 | `unauthorized` | Hết phiên → interceptor tự xử lý, FE không cần làm gì |
| 403 | `forbidden` | Không đủ quyền/gói → hiện màn hình nâng cấp |
| 404 | `not_found` | Không có, **hoặc là dữ liệu của người khác** |
| 409 | `duplicate` | Trùng (vd từ khóa đã tồn tại) |
| 422 | — | Pydantic validate lỗi, `detail` là mảng |
| 503 | `service_unavailable` | Dịch vụ phụ chưa bật (vd thiếu GEMINI_API_KEY) |

Đọc lỗi: `err.response?.data?.detail`. Lỗi mạng/timeout/429 đã được chuẩn hóa sẵn ở
`err.userMessage`.

**Phân trang** — mọi danh sách lớn:

```json
{ "items": [ … ], "total": 330, "page": 1, "size": 50 }
```

Query: `?page=1&size=50` (`page ≥ 1`; `size` tối đa 100 với `/articles`, 5000 với ODA/procurement).

---

## 3. Đa ngôn ngữ — tham số `?lang=`

Backend đã dịch sẵn dữ liệu sang **vi / en / ja** và lưu trong DB. FE chỉ cần **truyền `lang`**,
không tự dịch nội dung.

| Endpoint | `lang` trả về gì |
|---|---|
| `GET /articles`, `GET /articles/{id}` | `title`, `excerpt`, `content_md`, `matched_keywords` đã dịch |
| `GET /procurement` | `title` đã dịch (gốc tiếng Việt → dịch khi `lang=en|ja`) |
| `GET /oda-projects` | `title` đã dịch (gốc tiếng Anh → dịch khi `lang=vi|ja`) |
| `GET /keywords` | thêm `display_term` |
| `GET /categories` | thêm `display_name` |

Ba luật phải nhớ:

1. **Ngôn ngữ gốc thì không có overlay.** Tin trong nước gốc `vi`, dự án ODA gốc `en` — backend
   tự bỏ qua, FE cứ truyền `lang` bình thường.
2. **Chưa dịch xong → trả bản gốc**, không trả rỗng. Không cần code fallback.
3. **`term` / `name` là dữ liệu gốc, đừng hiển thị khi có bản dịch.** Dùng
   `display_term ?? term` và `display_name ?? name`. `term` gốc là thứ dùng để khớp tin lúc crawl,
   **không được** gửi bản dịch ngược lên khi tạo/sửa từ khóa.

Chuẩn hiện tại trong repo: service tự đính `lang` từ `localStorage.app_lang`, xem `src/services/oda.js`.
Chuỗi giao diện (nút, nhãn) dùng `t()` trong component hoặc `tUI()` ngoài component —
**mọi chuỗi mới phải thêm đủ 3 khóa** trong `src/locales/{vi,en,ja}.js`, thiếu khóa thì màn hình
hiện luôn tên khóa.

---

## 4. Trợ lý AI + lịch sử chat theo từng người dùng

Service: `src/services/ai.js`. Màn hình mẫu đã dựng: `src/pages/AiPage.jsx`.

### Endpoint

```
GET    /ai/status                      → { configured: boolean }        (không cần đăng nhập)
POST   /ai/ask                         { question, conversation_id? }
GET    /ai/conversations               → [summary]
GET    /ai/conversations/{id}          → detail (kèm messages)
PATCH  /ai/conversations/{id}          { title }  → summary
DELETE /ai/conversations/{id}          → 204
DELETE /ai/conversations               → { deleted: n }
```

### JSON

`POST /ai/ask` — body:

```json
{ "question": "Có gói thầu cao tốc nào mới?", "conversation_id": null }
```

Trả về:

```json
{
  "answer": "Hiện có 2 gói thầu liên quan cao tốc [P1][P2]…",
  "agent": "Chuyên gia đấu thầu",
  "sources": [
    { "id": 128, "title": "Khởi công cao tốc Bắc Nam", "url": "https://…",
      "source_name": "Báo Đấu thầu", "kind": "article" },
    { "id": "IB2500123456", "title": "IB2500123456 — Gói thầu XL01…", "url": "https://muasamcong…",
      "source_name": "TBMT (mời thầu)", "kind": "procurement" }
  ],
  "conversation_id": 7
}
```

`GET /ai/conversations`:

```json
[
  { "id": 7, "title": "Có gói thầu cao tốc nào mới?", "message_count": 4,
    "created_at": "2026-08-17T09:12:03Z", "updated_at": "2026-08-17T09:15:44Z" }
]
```

`GET /ai/conversations/7`:

```json
{
  "id": 7, "title": "Có gói thầu cao tốc nào mới?", "message_count": 4,
  "created_at": "…", "updated_at": "…",
  "messages": [
    { "id": 21, "role": "user", "content": "Có gói thầu cao tốc nào mới?",
      "agent": null, "sources": [], "created_at": "…" },
    { "id": 22, "role": "assistant", "content": "Hiện có 2 gói…",
      "agent": "Chuyên gia đấu thầu", "sources": [ … ], "created_at": "…" }
  ]
}
```

### Luồng UI

1. Vào trang → gọi song song `status()` và `conversations()`.
   `configured === false` → hiện banner cảnh báo, vẫn cho xem lịch sử cũ.
2. Hỏi lần đầu (`conversation_id: null`) → BE tự tạo hội thoại, **tiêu đề = câu hỏi đầu tiên**.
   Lấy `conversation_id` trong response, lưu vào state, gọi lại `conversations()` để sidebar cập nhật.
3. Hỏi tiếp → gửi kèm `conversation_id` đang mở. BE đưa **6 lượt gần nhất** vào prompt nên hỏi
   nối kiểu "còn tiến độ thì sao?" vẫn hiểu.
4. Bấm hội thoại cũ → `conversation(id)`, map `messages` thẳng vào bong bóng chat
   (`role`/`content`/`agent`/`sources` trùng tên với component).
5. "Cuộc trò chuyện mới" → chỉ cần `setActiveId(null)` + reset messages. **Không** gọi API tạo —
   hội thoại chỉ sinh ra khi thực sự có câu hỏi, tránh rác.

### Bốn điểm dễ sai

- ⏱️ **Timeout riêng 60s.** RAG mất 15–24s với `gemini-2.5-pro`, vượt xa mặc định 15s:
  `api.post('/ai/ask', body, { timeout: 60000 })`. Đã xử lý sẵn trong `ai.js`.
- 🚦 **Rate limit 10 request/phút** cho `/ai/ask` → 429. Khóa nút gửi trong lúc `loading`.
- 🔒 **Lịch sử là riêng tư tuyệt đối.** BE lọc theo user ở tầng repository; hội thoại của người khác
  trả **404** (không phải 403) để không lộ cả sự tồn tại. FE **không cần** và **không được** truyền
  `user_id` — server lấy từ token.
- ♻️ Gửi `conversation_id` không tồn tại / của người khác → BE **mở hội thoại mới** thay vì báo lỗi,
  để không mất câu trả lời vừa gọi AI tốn 20s. FE nhớ cập nhật lại `activeId` theo response.

---

## 5. Mua sắm công — TBMT & KHLCNT

```
GET /procurement?kind=notice|plan&q=&sector=&status=&lang=&page=&size=
```

`kind=notice` = Thông báo mời thầu (TBMT, mã `IB…`) · `kind=plan` = Kế hoạch lựa chọn nhà thầu
(KHLCNT, mã `PL…`). Đây là 2 menu tách riêng trên giao diện.

```json
{
  "items": [{
    "id": "IB2500123456", "kind": "notice",
    "title": "Gói thầu XL01: Thi công xây dựng…",
    "procuring_entity": "Ban QLDA ĐTXD huyện …", "org_code": "…",
    "publish_date": "2026-08-15", "close_date": "2026-08-29",
    "package_count": null, "status": "Đang chào thầu", "sector": "Giao thông",
    "url": "https://muasamcong.mpi.gov.vn/…?notifyId=…",
    "details_json": "{…}", "created_at": "2026-08-15T04:00:11Z"
  }],
  "total": 330, "page": 1, "size": 50
}
```

**`url`** là link chi tiết muasamcong (lấy được nhờ resolver chạy nền). `url = null` nghĩa là
**chưa resolve xong** → FE fallback `https://dauthau.asia/tim-kiem/?q={id}`. Không tự đoán URL
muasamcong từ mã — link muasamcong cần `notifyId` nội bộ.

**`details_json`** là **chuỗi JSON** (không phải object) → `JSON.parse()` trước khi dùng.
`null` = chưa enrich, hiện khối rút gọn thay vì khối trống.

`kind = "notice"` (TBMT):

```json
{
  "kind": "notice", "notify_no": "IB2500123456", "version": 1,
  "bid_no": "…", "plan_no": "PL…", "plan_name": "…", "plan_type": "…",
  "name": "Gói thầu XL01…", "status": "Đang chào thầu",
  "public_date": "15/08/2026", "close_date": "29/08/2026", "open_date": "29/08/2026",
  "investor": "…", "procuring_entity": "…",
  "bid_price": 12500000000, "price_unit": "VND",
  "guarantee_value": 250000000, "guarantee_form": "…",
  "field": "Xây lắp", "bid_form": "Đấu thầu rộng rãi", "bid_mode": "Qua mạng",
  "contract_type": "Trọn gói", "contract_period": "180 ngày", "validity": "90 ngày",
  "domestic": true, "internet": true,
  "issue_location": "…", "receive_location": "…", "open_location": "…",
  "locations": ["Hà Nội"], "description": "…",
  "decision": { "no": "…", "date": "…", "agency": "…", "file": "…" },
  "lots": [{ "no": "1", "name": "…", "price": 0 }]
}
```

`kind = "plan"` (KHLCNT): `plan_no`, `version`, `name`, `plan_type`, `public_date`, `investor`,
`invest_total` + `invest_total_unit`, `package_count`, `decision`, và `packages[]` — mỗi gói có
`bid_no`, `name`, `price`, `price_unit`, `field`, `bid_form`, `bid_mode`, `contract_type`,
`period`, `duration`, `start` (dạng `"Quý III/2026"`), `capital_detail`, `description`.

Khóa nào cũng có thể `null` → render theo kiểu "có thì hiện", đừng hardcode danh sách cứng.

---

## 6. Dự án ODA — ADB & World Bank

```
GET /oda-projects?source=adb|worldbank&kind=notice|project&country=&status=&sector=&stage=&q=&lang=&page=&size=
```

**`kind` chỉ áp dụng cho ADB** và là thứ tách 2 menu:

| `kind` | Là gì | Nhận biết ở BE |
|---|---|---|
| `notice` | Thông báo mời thầu ADB | `last_stage == "Procurement Notice"` |
| `project` | Dự án ADB thật | còn lại |

```json
{
  "items": [{
    "id": 412, "source_org": "adb", "external_id": "51139-001",
    "title": "Ha Noi Metro Line 3 …", "title_vi": null,
    "country": "VIE", "amount": "USD 188.35 million",
    "status": "Active", "sector": "Transport",
    "approval_date": "2019-11-21", "last_updated_date": "2024-10-21",
    "last_stage": "Implementation",
    "url": "https://www.adb.org/projects/51139-001/main",
    "details_json": "{…}", "created_at": "2026-08-10T02:00:00Z"
  }],
  "total": 58, "page": 1, "size": 50
}
```

Lưu ý về ngày (đã từng gây hiển thị sai):

- `approval_date` = **ngày ADB phê duyệt thật**, `null` khi ADB để `"-"` — **không** được lấp bằng
  ngày crawl. Hiện `—` khi `null`.
- `last_updated_date` = ngày ADB cập nhật trang.
- `created_at` = ngày hệ thống mình crawl về, chỉ dùng cho cột "Ngày thu thập".

> ⚠️ `/oda-projects` và `/procurement` **không có tham số `sort`** — sắp xếp làm ở phía client
> (`WorldBankView.jsx`, mặc định `boardapprovaldate` giảm dần, bản ghi thiếu ngày xuống cuối).
> Vì vậy muốn sắp xếp đúng trên toàn bộ tập dữ liệu thì phải lấy đủ bản ghi (`size` lớn), sắp xếp
> trên một trang 50 dòng sẽ ra kết quả sai lệch.

`details_json` (parse ra object) — **dùng chung một khối hiển thị cho cả dự án và thông báo**:

```json
{
  "kind": "adb", "notice": true,
  "project_no": "51139-001", "name": "…",
  "fields": { "Notice Type": "Invitation for Bids (thông báo mời thầu)",
              "Financing Number": "…", "Country / Economy": "…", "Project": "…",
              "Contract / Package": "…", "Source": "ADB Procurement Notices (RSS công khai)" },
  "funding": [ … ], "milestones": { … }, "documents": [ … ],
  "notice_source_url": "https://www.adb.org/…pdf"
}
```

- `fields` là **dict tự do** — render vòng lặp `Object.entries(fields)`, đừng liệt kê khóa cứng.
- `notice: true` → đây là thông báo mời thầu; `funding` / `milestones` / `documents` chỉ có ở dự án.
- `notice_source_url` là file PDF gốc bên ADB, **bị Cloudflare chặn** → chỉ hiện dạng chữ để truy vết
  nguồn, **không** làm link bấm. Link bấm được là `url` của item (trang `/projects/<no>/main`).

---

## 7. Tin bài / Dashboard

```
GET /articles?q=&source_id=&source_type=gov|press&only_my_keywords=true&date_from=&date_to=
             &sort=newest|match_count&lang=&page=&size=
GET /articles/{id}?lang=
POST   /articles/{id}/read        → 204
GET    /articles/bookmarks
POST   /articles/bookmarks        { article_id, folder }   → 201
DELETE /articles/bookmarks/{article_id} → 204
```

Thẻ tin (`ArticleCard`):

```json
{
  "id": 128, "title": "…", "excerpt": "…", "url": "https://…", "image_url": "https://…",
  "source_id": 3, "published_at": "2026-08-16T02:00:00Z", "fetched_at": "2026-08-16T04:10:00Z",
  "lang": "vi", "matched_keywords": ["cao tốc", "ODA"],
  "sources": [{ "article_id": 128, "source_id": 3, "source_name": "Báo Đấu thầu",
                "url": "https://…", "title": "…", "published_at": "…" }],
  "source_urls": ["https://…"],
  "is_read": false, "is_bookmarked": false, "content_md": null
}
```

- `lang` trong response = ngôn ngữ nội dung **đang trả về** (khác `?lang=` khi bài chưa dịch xong).
- `sources[]` = danh sách nguồn cùng đăng một tin (đã gộp trùng). `source_urls` giữ để tương thích cũ.
- `content_md` chỉ có ở `GET /articles/{id}`.
- `image_url` có thể `null` → fallback ảnh hạ tầng trong `src/assets/images.ts`.
- `date_to` được BE mở đến 23:59:59 nên chọn cùng ngày đầu-cuối vẫn ra bài trong ngày đó.

---

## 8. Từ khóa & danh mục

```
GET    /keywords?lang=       → [{ id, term, display_term, category_id, lang, is_primary, created_at }]
POST   /keywords             { term, category_id?, lang?, is_primary? }   → 201
PUT    /keywords/{id}
DELETE /keywords/{id}        → 204
GET    /categories?lang=     → [{ id, name, display_name, slug }]
```

Hiển thị `display_term ?? term`. Khi POST/PUT **luôn gửi `term` gốc** (thứ người dùng đã nhập),
không gửi bản dịch — nếu không, việc khớp tin lúc crawl sẽ hỏng.

---

## 9. Admin — gợi ý từ khóa do AI trích

```
GET  /admin/keyword-suggestions?status=pending|approved|rejected|all&limit=
POST /admin/keyword-suggestions/generate?sample_size=40     → { created, pending }
POST /admin/keyword-suggestions/{id}/approve                → suggestion
POST /admin/keyword-suggestions/{id}/reject                 → suggestion
```

```json
{ "id": 12, "term": "đường sắt tốc độ cao", "status": "pending", "occurrences": 7,
  "sample_title": "Trình Quốc hội dự án đường sắt tốc độ cao…", "source_kind": "article",
  "created_at": "…", "reviewed_at": null }
```

- ⏱️ `generate` cho AI đọc hàng chục tin → **đặt timeout 240s**, hiện spinner có chữ, đừng để
  người dùng tưởng treo. Xem `src/services/keywordSuggestions.js`.
- `approve` tạo từ khóa thật cho tài khoản admin → lượt crawl sau bắt đầu giữ tin khớp.
- `reject` **giữ lại bản ghi** để AI không gợi ý lại từ đó nữa — đừng xóa khỏi UI theo kiểu "biến mất",
  cho lọc `status=rejected` xem lại.
- Panel mẫu: `src/components/admin/KeywordSuggestionsPanel.jsx`.

---

## 10. Checklist trước khi mở PR

- [ ] Không gọi `axios` trực tiếp trong component; API nằm trong `src/services/<domain>.js`.
- [ ] Mọi chuỗi hiển thị đều qua `t()` / `tUI()` và **có đủ 3 khóa** vi/en/ja.
- [ ] Danh sách nào cũng có đủ 3 trạng thái: **loading / rỗng / lỗi** (đừng để màn hình trắng).
- [ ] Endpoint chậm (`/ai/ask`, `generate` gợi ý từ khóa, các job `/admin/oda/*`) đã đặt timeout riêng.
- [ ] `details_json` luôn `JSON.parse()` trong `try/catch`; `null` → khối rút gọn.
- [ ] Trường `null` hiện `—`, không hiện `null` / `undefined` / `Invalid Date`.
- [ ] Link ngoài: `target="_blank" rel="noopener noreferrer"`.
- [ ] `personal` → ẩn menu AI / ODA / Mua sắm công thay vì để bấm rồi 403.
- [ ] Chạy `npm run build` xanh trước khi commit.
