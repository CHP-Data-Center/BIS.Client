# BỘ QUY TẮC PHÁT TRIỂN & CHUẨN HÓA ĐA NGÔN NGỮ (I18N) VÀ ĐỒNG BỘ DỮ LIỆU
**Mã tài liệu: RULEBOOK-01-I18N-DATA-SYNC**  
**Áp dụng cho: BIS.Client & BIS.Server**

---

## MỤC ĐÍCH
Tài liệu này được lập ra nhằm ngăn chặn triệt để các lỗi thường gặp:
1. Giao diện đang chọn tiếng Nhật (`ja`) hoặc tiếng Anh (`en`) nhưng dữ liệu hoặc nhãn vẫn hiển thị tiếng Việt thô.
2. Dữ liệu tóm tắt (summary) thô đè bẹp dữ liệu chi tiết đã được AI dịch (timeline).
3. Hardcode chuỗi tiếng Việt trong JSX (`Bên mời thầu:`, `Lọc ...`).
4. Các dropdown bộ lọc (Quốc gia, Lĩnh vực, Giai đoạn, Trạng thái) hiển thị chuỗi gốc không qua từ điển chuyển ngữ.
5. Lỗi linter import trong Python (`ruff I001`).

---

## NGUYÊN TẮC CỐT LÕI

### 1. QUY TẮC ƯU TIÊN DỮ LIỆU ĐÃ DỊCH (DATA PRECEDENCE)
Khi hiển thị danh sách mục (gói thầu, bài báo, dự án), **dữ liệu đã được dịch theo ngôn ngữ hiện tại (`timelineData`) LUÔN PHẢI ĐƯỢC ƯU TIÊN** hơn dữ liệu tóm tắt ban đầu (`summary`).

* **❌ SAI LẦM KINH ĐIỂN:**
  ```javascript
  // SAI: selectedSummary có 7 phần tử tiếng Việt thô -> truthy -> timelineData bị bỏ qua hoàn toàn!
  const currentTenders = selectedSummary?.procurement_samples || timelineData?.procurement_samples || [];
  ```

* **✅ CÁCH VIẾT CHUẨN:**
  ```javascript
  // ĐÚNG: Ưu tiên dữ liệu chi tiết có bản dịch từ timelineData, chỉ fallback về summary khi timelineData chưa tải xong
  const currentTenders = (timelineData && timelineData.procurement_samples)
    ? timelineData.procurement_samples
    : (selectedSummary?.procurement_samples || []);

  const currentTendersCount = timelineData?.procurement_matches !== undefined
    ? timelineData.procurement_matches
    : (selectedSummary?.procurement_matches !== undefined ? selectedSummary.procurement_matches : currentTenders.length);
  ```

---

### 2. MỌI API ĐỌC NỘI DUNG PHẢI NHẬN VÀ TRUYỀN THAM SỐ `lang`

#### Phía Frontend:
1. Tất cả các hàm gọi API đọc tin tức, gói thầu, ODA, dự án theo dõi (`projectsService.getSummary`, `getTimeline`, `potentialService...`) **BẮT BUỘC** nhận `customLang = null` và truyền `lang`:
   ```javascript
   async getSummary(days = 7, limit = 50, customLang = null) {
     const activeLang = customLang || localStorage.getItem('app_lang') || localStorage.getItem('news_lang') || 'vi';
     const params = { days, limit };
     if (activeLang && activeLang !== 'vi') params.lang = activeLang;
     const { data } = await api.get('/projects/summary', { params });
     return data;
   }
   ```
2. Component React phải đưa `lang` vào dependency của `useEffect` để tải lại dữ liệu khi người dùng đổi ngôn ngữ trên Header:
   ```javascript
   useEffect(() => {
     loadSummary();
   }, [lang]);
   ```

#### Phía Backend:
1. Các endpoint Controller trả về dữ liệu hiển thị phải nhận `lang: str | None = Query(default=None)`:
   ```python
   @router.get("/summary", response_model=ProjectSummaryPage)
   def projects_summary(
       days: int = Query(default=7, ge=1, le=90),
       limit: int = Query(default=20, ge=1, le=50),
       lang: str | None = Query(default=None),
       current_user: User = Depends(get_current_user),
       db: Session = Depends(get_db),
   ) -> ProjectSummaryPage:
   ```
2. Trong Service, nếu `lang and lang != 'vi'`, phải tra cứu bảng `ContentTranslation` hoặc `ArticleTranslation` theo lô (Batch query, không N+1) để điền tiêu đề đã dịch trước khi trả về DTO.

---

### 3. TUYỆT ĐỐI KHÔNG HARDCODE CHUỖI TIẾNG VIỆT TRONG JSX

Mọi chuỗi hiển thị tĩnh (tiêu đề, nhãn phụ, tiền tố, placeholder) phải đi qua `t('key')` hoặc `tUI('key')`:

| Trường hợp | ❌ Không được viết | ✅ Bắt buộc viết |
|---|---|---|
| Tiền tố nhãn | `` `Bên mời thầu: ${t.procuring_entity}` `` | `` `${t('proc.procuringEntity') \|\| 'Bên mời thầu'}: ${t.procuring_entity}` `` |
| Placeholder ô tìm kiếm | `` placeholder={`Lọc ${org}...`} `` | `` placeholder={`${t('common.search') \|\| 'Tìm'} ${org}...`} `` |
| Chữ rỗng / mặc định | `'Chưa có dữ liệu'` | `t('common.noData')` |
| Đơn vị đếm | `` `${count} gói thầu` `` | `t('projects.tenderCount', { count })` |

---

### 4. QUY TẮC HIỂN THỊ VÀ TÌM KIẾM TRONG DROPDOWN BỘ LỌC

#### A. Quốc gia / Vùng lãnh thổ:
* **Không render biến chuỗi gốc:** Không viết `<span>{c}</span>`.
* **Phải dùng helper `tCountry(c)`:** `<span>{normType === 'procurement' ? c : (tCountry(c) || c)}</span>`.
* **Tìm kiếm phải hỗ trợ 2 chiều:** Người dùng có thể gõ tiếng Anh (`Laos`) hoặc tiếng Nhật (`ラオス`) hoặc tiếng Việt (`Lào`):
  ```javascript
  const q = countrySearch.toLowerCase().trim();
  const localized = normType === 'procurement' ? c : tCountry(c);
  const isMatch = c.toLowerCase().includes(q) || (localized && localized.toLowerCase().includes(q));
  ```
* **Khai báo quốc gia mới:** Khi crawler cào về quốc gia mới, phải cập nhật mã ISO vào `COUNTRY_TO_CODE` ([countryFlags.jsx](file:///d:/code/BIS.Client/src/utils/countryFlags.jsx)) và từ điển `TRANSLATIONS.countries` ([locales/index.js](file:///d:/code/BIS.Client/src/locales/index.js)).

#### B. Lĩnh vực / Giai đoạn dự án:
* Mọi giá trị giai đoạn / lĩnh vực (`last_stage_reached_name`, `sector`) phải đi qua hàm chuẩn hóa `getStageLabel(stage)`:
  * Quy tắc bắt đầu: Nhận diện theo từ khóa không phân biệt hoa thường (`procurement notice`, `tbmt`, `khlcnt`, `concept`, `decision meeting`, `technical design`, `công nghiệp`, `quản lý công`, `tài chính`, `đa ngành`...).
  * Trả về khóa `t('stage.xxx')`.
  * Fallback qua `tCategory(stage)` và `tSector(stage)` trước khi trả về chuỗi gốc.

#### C. Trạng thái (Status):
* Dùng `getStatusLabel(status)` map qua `t('status.xxx')`.

---

### 5. XỬ LÝ DANH TỪ RIÊNG VÀ TÊN PHÁP NHÂN
* **Tên riêng doanh nghiệp / Chủ đầu tư / Bên mời thầu** (ví dụ: `CÔNG TY CỔ PHẦN CẤP NƯỚC VĨNH LONG`, `Công an tỉnh Vĩnh Long`): Giữ nguyên văn bản gốc pháp nhân tại Việt Nam, không cố tình dịch máy tên công ty để tránh sai lệch pháp lý khi tra cứu e-GP.
* **Nhãn đi kèm** (`Bên mời thầu:`, `Chủ đầu tư:`, `Địa phương:`): Bắt buộc dịch sang ngôn ngữ đang chọn (`調達機関:`, `事業主・発注者:`).

---

### 6. QUY CHUẨN KIỂM TRA FRONTEND (BUILD & LOCALES)

Khi phát triển giao diện phía `BIS.Client`:
* Mỗi khi bổ sung khóa ngôn ngữ mới, phải cập nhật đồng thời ở cả 3 file:
  * [src/locales/vi.js](file:///d:/code/BIS.Client/src/locales/vi.js) (Tiếng Việt)
  * [src/locales/ja.js](file:///d:/code/BIS.Client/src/locales/ja.js) (Tiếng Nhật)
  * [src/locales/en.js](file:///d:/code/BIS.Client/src/locales/en.js) (Tiếng Anh)
* Nếu là mã phân loại (quốc gia, lĩnh vực, trạng thái), phải khai báo trong [src/locales/index.js](file:///d:/code/BIS.Client/src/locales/index.js) (`TRANSLATIONS.countries`, `TRANSLATIONS.sectors`, `TRANSLATIONS.categories`).
* Trước khi hoàn thành task, luôn chạy kiểm tra build để đảm bảo không lỗi cú pháp hoặc thiếu import:
  ```powershell
  npm run build
  ```

---

### 7. QUY ĐỊNH VỀ GIT PUSH
* **TUYỆT ĐỐI KHÔNG** tự ý `git push` trừ khi người dùng ra lệnh trực tiếp bằng lời (ví dụ: *"đẩy code lên đi"*, *"git push"*, *"push code"*).
* Trước khi push:
  * Chạy `npm run build` xác nhận 0 lỗi.

---

## CHECKLIST TỰ KIỂM TRƯỚC KHI HOÀN THÀNH TASK ĐA NGÔN NGỮ

- [ ] 1. Mở giao diện và chuyển thử lần lượt sang **Tiếng Nhật (`ja`)** và **Tiếng Anh (`en`)**.
- [ ] 2. Kiểm tra danh sách bài viết / gói thầu: Tiêu đề đã được dịch sang ngôn ngữ chọn chưa?
- [ ] 3. Kiểm tra nhãn tiền tố (Bên mời thầu, Giai đoạn, Lĩnh vực) có còn chữ tiếng Việt nào không?
- [ ] 4. Mở dropdown **Quốc gia**: Tên các nước đã thành tiếng Nhật/Anh chưa? Ô lọc placeholder có còn chữ "Lọc" không? Thử gõ tìm kiếm bằng tiếng Nhật/Anh.
- [ ] 5. Mở dropdown **Lĩnh vực / Giai đoạn**: Đã dịch hết các mục như `調達公示 (Procurement Notice)`, `産業・貿易`, `公共部門管理`, `金融`, `多分野・複合` chưa?
- [ ] 6. Chạy `npm run build` hoàn thành với mã 0 (không lỗi cú pháp).
