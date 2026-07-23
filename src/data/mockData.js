// src/data/mockData.js
export const SOURCES = {
  adb: {
    id: 'adb', name: 'ADB', fullName: 'Asian Development Bank',
    icon: '🏦', color: '#f59e0b', bg: '#fffbeb', darkBg: 'rgba(245,158,11,0.1)',
    url: 'https://www.adb.org', desc: 'Ngân hàng Phát triển Châu Á',
  },
  worldbank: {
    id: 'worldbank', name: 'World Bank', fullName: 'The World Bank',
    icon: '🌍', color: '#10b981', bg: '#ecfdf5', darkBg: 'rgba(16,185,129,0.1)',
    url: 'https://www.worldbank.org', desc: 'Ngân hàng Thế giới',
  },
  dauthau: {
    id: 'dauthau', name: 'Đấu Thầu', fullName: 'Hệ thống Đấu thầu Quốc gia',
    icon: '📋', color: '#8b5cf6', bg: '#f5f3ff', darkBg: 'rgba(139,92,246,0.1)',
    url: 'https://muasamcong.mpi.gov.vn', desc: 'Mua sắm công & Đấu thầu',
  },
  tintuc: {
    id: 'tintuc', name: 'Tin Tức', fullName: 'Tin Tức Báo Chí',
    icon: '📰', color: '#3b82f6', bg: '#eff6ff', darkBg: 'rgba(59,130,246,0.1)',
    url: 'https://vnexpress.net', desc: 'Tin tức kinh tế & đầu tư tổng hợp từ các trang báo',
  },
};

export const mockArticles = [
  // ── ADB ──────────────────────────────────────────────────
  {
    id: 'adb-001', source: 'adb',
    title: 'ADB Approves $500 Million Loan for Vietnam Clean Energy Transition',
    titleVi: 'ADB phê duyệt khoản vay 500 triệu USD cho chuyển đổi năng lượng sạch tại Việt Nam',
    excerpt: 'The Asian Development Bank has approved a $500 million loan to support Vietnam\'s transition to clean energy.',
    excerptVi: 'Ngân hàng Phát triển Châu Á đã phê duyệt khoản vay 500 triệu USD hỗ trợ Việt Nam chuyển đổi sang năng lượng sạch, tập trung điện mặt trời và gió tại ĐBSCL.',
    date: '2026-07-20', category: 'Energy', country: 'Vietnam', amount: '$500M',
    aiSummary: 'ADB tài trợ lớn cho điện tái tạo Việt Nam — ưu tiên ĐBSCL.',
    tags: ['energy', 'loan', 'vietnam', 'clean-energy'],
    coverEmoji: '⚡', gradient: ['#fef3c7', '#fde68a'],
  },
  {
    id: 'adb-002', source: 'adb',
    title: 'ADB Supports $200M Urban Development in Ho Chi Minh City',
    titleVi: 'ADB hỗ trợ 200 triệu USD phát triển đô thị tại TP. Hồ Chí Minh với hệ thống cấp nước và chống ngập',
    excerpt: 'A new ADB project worth $200 million will improve urban infrastructure in Ho Chi Minh City.',
    excerptVi: 'Dự án ADB mới trị giá 200 triệu USD sẽ cải thiện hạ tầng đô thị, cấp nước, quản lý nước thải và phòng chống lũ lụt tại TP.HCM.',
    date: '2026-07-18', category: 'Urban Dev', country: 'Vietnam', amount: '$200M',
    aiSummary: 'Hạ tầng đô thị HCM được nâng cấp toàn diện với vốn ADB.',
    tags: ['urban', 'infrastructure', 'water', 'hcmc'],
    coverEmoji: '🏙️', gradient: ['#dbeafe', '#e0e7ff'],
  },
  {
    id: 'adb-003', source: 'adb',
    title: 'ADB and Cambodia Partner on Digital Financial Inclusion Initiative',
    titleVi: 'ADB và Campuchia hợp tác mở rộng tài chính số toàn diện cho người dân nông thôn',
    excerpt: 'ADB signed a $50 million agreement with Cambodia to expand digital payment infrastructure.',
    excerptVi: 'ADB ký thỏa thuận 50 triệu USD với Campuchia mở rộng hạ tầng thanh toán số và cải thiện tiếp cận tài chính nông thôn.',
    date: '2026-07-15', category: 'Finance', country: 'Cambodia', amount: '$50M',
    aiSummary: 'Fintech nông thôn Campuchia được đẩy mạnh qua hợp tác ADB.',
    tags: ['fintech', 'digital', 'cambodia', 'inclusion'],
    coverEmoji: '📱', gradient: ['#fef9c3', '#fef3c7'],
  },
  {
    id: 'adb-004', source: 'adb',
    title: 'ADB Commits $1 Billion for Asia Climate Resilience Fund 2026',
    titleVi: 'ADB cam kết 1 tỷ USD thành lập Quỹ Khí hậu Châu Á bảo vệ cộng đồng dễ bị tổn thương',
    excerpt: 'ADB announced a $1 billion commitment to establish a new regional climate resilience fund.',
    excerptVi: 'ADB thông báo cam kết 1 tỷ USD lập quỹ phục hồi khí hậu khu vực nhắm vào các cộng đồng dễ tổn thương ở Đông Nam Á.',
    date: '2026-07-12', category: 'Climate', country: 'Regional', amount: '$1B',
    aiSummary: 'Quỹ 1 tỷ USD bảo vệ cộng đồng dễ tổn thương trước biến đổi khí hậu.',
    tags: ['climate', 'resilience', 'sea', 'fund'],
    coverEmoji: '🌱', gradient: ['#d1fae5', '#a7f3d0'],
  },
  {
    id: 'adb-005', source: 'adb',
    title: 'ADB Launches $300M Transport Connectivity Project for Mekong Region',
    titleVi: 'ADB khởi động dự án kết nối giao thông 300 triệu USD cho khu vực Mekong mở rộng',
    excerpt: 'ADB approved a $300 million project to improve road and rail connectivity in the Greater Mekong Subregion.',
    excerptVi: 'ADB phê duyệt dự án 300 triệu USD nâng cấp đường bộ và đường sắt, tăng cường kết nối thương mại khu vực Mekong mở rộng.',
    date: '2026-07-10', category: 'Transport', country: 'GMS', amount: '$300M',
    aiSummary: 'Hạ tầng giao thông Mekong được đầu tư lớn, thúc đẩy thương mại.',
    tags: ['transport', 'mekong', 'connectivity', 'infrastructure'],
    coverEmoji: '🛤️', gradient: ['#fef3c7', '#fed7aa'],
  },
  {
    id: 'adb-006', source: 'adb',
    title: 'ADB Approves $180M Water Security Project for Philippines Islands',
    titleVi: 'ADB phê duyệt 180 triệu USD cho dự án an ninh nước tại các đảo Philippines đang đối mặt hạn hán',
    excerpt: 'ADB approved $180 million to improve water security in vulnerable Philippine island communities.',
    excerptVi: 'ADB phê duyệt 180 triệu USD cải thiện an ninh nước cho các cộng đồng đảo Philippines dễ bị tổn thương trước hạn hán.',
    date: '2026-07-08', category: 'Water', country: 'Philippines', amount: '$180M',
    aiSummary: 'Philippines tăng cường an ninh nước với hỗ trợ ADB — ưu tiên đảo xa.',
    tags: ['water', 'philippines', 'security', 'island'],
    coverEmoji: '💧', gradient: ['#bfdbfe', '#93c5fd'],
  },

  // ── World Bank ────────────────────────────────────────────
  {
    id: 'wb-001', source: 'worldbank',
    title: 'World Bank Approves $300M to Boost Agricultural Productivity in Vietnam',
    titleVi: 'World Bank phê duyệt 300 triệu USD hiện đại hóa nông nghiệp Việt Nam qua công nghệ và tưới tiêu',
    excerpt: 'The World Bank approved $300 million to modernize Vietnam\'s agricultural sector.',
    excerptVi: 'World Bank phê duyệt 300 triệu USD hiện đại hóa nông nghiệp Việt Nam qua ứng dụng công nghệ, cải thiện tưới tiêu và đào tạo nông dân.',
    date: '2026-07-19', category: 'Agriculture', country: 'Vietnam', amount: '$300M',
    aiSummary: 'Nông nghiệp Việt Nam chuyển đổi số với hỗ trợ 300M từ WB.',
    tags: ['agriculture', 'food', 'vietnam', 'technology'],
    coverEmoji: '🌾', gradient: ['#ecfdf5', '#d1fae5'],
  },
  {
    id: 'wb-002', source: 'worldbank',
    title: 'World Bank Report: Southeast Asia Needs $210 Billion for Climate Adaptation by 2030',
    titleVi: 'Báo cáo WB: Đông Nam Á cần 210 tỷ USD đầu tư thích ứng biến đổi khí hậu đến năm 2030',
    excerpt: 'A new World Bank report estimates Southeast Asia will need $210 billion in climate adaptation investment.',
    excerptVi: 'Báo cáo mới của WB ước tính Đông Nam Á cần 210 tỷ USD đầu tư thích ứng khí hậu để bảo vệ kinh tế và sinh kế trước rủi ro khí hậu.',
    date: '2026-07-17', category: 'Report', country: 'SEA', amount: '$210B',
    aiSummary: 'SEA cần đầu tư khổng lồ để đối phó biến đổi khí hậu đến 2030.',
    tags: ['climate', 'report', 'investment', 'sea'],
    coverEmoji: '📊', gradient: ['#f0fdf4', '#dcfce7'],
  },
  {
    id: 'wb-003', source: 'worldbank',
    title: 'World Bank Launches $80M Digital Government Initiative for ASEAN Nations',
    titleVi: 'World Bank khởi động sáng kiến Chính phủ Số 80 triệu USD giúp ASEAN hiện đại hóa dịch vụ công',
    excerpt: 'The World Bank launched a new digital government initiative to help ASEAN modernize public services.',
    excerptVi: 'World Bank khởi động sáng kiến chính phủ số 80 triệu USD giúp các nước ASEAN hiện đại hóa dịch vụ công bằng AI và hạ tầng đám mây.',
    date: '2026-07-14', category: 'Digital Gov', country: 'ASEAN', amount: '$80M',
    aiSummary: 'ASEAN đẩy mạnh chuyển đổi số chính phủ với hỗ trợ WB.',
    tags: ['digital', 'government', 'asean', 'ai'],
    coverEmoji: '🖥️', gradient: ['#eff6ff', '#dbeafe'],
  },
  {
    id: 'wb-004', source: 'worldbank',
    title: 'World Bank Invests $450M in Indonesia\'s Renewable Energy Grid Modernization',
    titleVi: 'World Bank đầu tư 450 triệu USD hiện đại hóa lưới điện năng lượng tái tạo tại Indonesia',
    excerpt: 'World Bank approved $450M to modernize Indonesia\'s electricity grid for renewable energy integration.',
    excerptVi: 'World Bank phê duyệt 450 triệu USD hiện đại hóa lưới điện Indonesia để tích hợp năng lượng tái tạo và giảm phụ thuộc than.',
    date: '2026-07-11', category: 'Energy', country: 'Indonesia', amount: '$450M',
    aiSummary: 'Lưới điện Indonesia cải thiện lớn — bước đệm chuyển đổi xanh.',
    tags: ['energy', 'indonesia', 'grid', 'renewable'],
    coverEmoji: '🔋', gradient: ['#fef9c3', '#fde68a'],
  },
  {
    id: 'wb-005', source: 'worldbank',
    title: 'World Bank Supports $220M Health System Strengthening in Thailand and Myanmar',
    titleVi: 'World Bank hỗ trợ 220 triệu USD tăng cường hệ thống y tế tại Thái Lan và Myanmar sau dịch bệnh',
    excerpt: 'World Bank approved $220 million to strengthen health systems in Thailand and Myanmar post-pandemic.',
    excerptVi: 'World Bank phê duyệt 220 triệu USD củng cố hệ thống y tế Thái Lan và Myanmar, tập trung y tế cơ sở và phòng dịch sau đại dịch.',
    date: '2026-07-09', category: 'Health', country: 'Thailand/Myanmar', amount: '$220M',
    aiSummary: 'Y tế cộng đồng Thái-Myanmar được củng cố mạnh với 220M WB.',
    tags: ['health', 'pandemic', 'thailand', 'myanmar'],
    coverEmoji: '🏥', gradient: ['#fdf4ff', '#fae8ff'],
  },
  {
    id: 'wb-006', source: 'worldbank',
    title: 'World Bank Education Fund: $160M for Early Childhood Development in Vietnam',
    titleVi: 'Quỹ Giáo dục WB: 160 triệu USD phát triển giáo dục mầm non cho trẻ em vùng sâu vùng xa Việt Nam',
    excerpt: 'World Bank allocated $160 million for early childhood education programs in remote Vietnam areas.',
    excerptVi: 'World Bank phân bổ 160 triệu USD cho các chương trình giáo dục mầm non ở vùng sâu vùng xa Việt Nam, hỗ trợ 500.000 trẻ.',
    date: '2026-07-06', category: 'Education', country: 'Vietnam', amount: '$160M',
    aiSummary: 'Giáo dục mầm non vùng xa được ưu tiên với ngân sách lớn từ WB.',
    tags: ['education', 'children', 'vietnam', 'rural'],
    coverEmoji: '📚', gradient: ['#ede9fe', '#ddd6fe'],
  },

  // ── Đấu Thầu ─────────────────────────────────────────────
  {
    id: 'dt-001', source: 'dauthau',
    title: 'Gói thầu xây dựng đường cao tốc Bắc - Nam phía Đông giai đoạn 3',
    titleVi: 'Gói thầu xây dựng đường cao tốc Bắc - Nam phía Đông giai đoạn 3, đoạn Khánh Hòa - Bình Thuận',
    excerpt: 'Bộ GTVT công bố kết quả lựa chọn nhà thầu cho gói xây lắp cao tốc Bắc-Nam giai đoạn 3.',
    excerptVi: 'Bộ Giao thông Vận tải công bố kết quả lựa chọn nhà thầu gói xây lắp đường cao tốc Bắc-Nam phía Đông giai đoạn 3, đoạn Khánh Hòa - Bình Thuận.',
    date: '2026-07-21', category: 'Giao thông', country: 'Vietnam', amount: '12.500 tỷ',
    aiSummary: 'Cao tốc B-N giai đoạn 3 tiếp tục triển khai — hạn nộp hồ sơ 15/08.',
    tags: ['highway', 'transport', 'infrastructure', 'bidding'],
    coverEmoji: '🛣️', gradient: ['#f5f3ff', '#ede9fe'],
    status: 'Đang mở thầu', deadline: '2026-08-15',
  },
  {
    id: 'dt-002', source: 'dauthau',
    title: 'Đấu thầu mua sắm thiết bị y tế tập trung cho 50 bệnh viện tuyến tỉnh toàn quốc',
    titleVi: 'Đấu thầu mua sắm thiết bị y tế tập trung cho 50 bệnh viện tuyến tỉnh trên toàn quốc năm 2026',
    excerpt: 'Bộ Y tế phát hành hồ sơ mời thầu gói mua sắm thiết bị y tế tập trung cho 50 bệnh viện.',
    excerptVi: 'Bộ Y tế phát hành hồ sơ mời thầu gói mua sắm thiết bị y tế tập trung cho 50 bệnh viện tuyến tỉnh, áp dụng đấu thầu qua mạng.',
    date: '2026-07-20', category: 'Y tế', country: 'Vietnam', amount: '3.200 tỷ',
    aiSummary: 'Gói thầu y tế lớn — cơ hội cho nhà cung cấp thiết bị trong nước.',
    tags: ['healthcare', 'medical', 'equipment', 'bidding'],
    coverEmoji: '🩺', gradient: ['#fdf2f8', '#fce7f3'],
    status: 'Mời thầu', deadline: '2026-08-10',
  },
  {
    id: 'dt-003', source: 'dauthau',
    title: 'Gói thầu tư vấn chuyển đổi số ngành Giáo dục quốc gia giai đoạn 2026-2030',
    titleVi: 'Gói thầu tư vấn xây dựng lộ trình chuyển đổi số ngành Giáo dục và Đào tạo giai đoạn 2026-2030',
    excerpt: 'Bộ GD&ĐT mở thầu gói tư vấn xây dựng lộ trình và triển khai chuyển đổi số toàn ngành giáo dục.',
    excerptVi: 'Bộ Giáo dục và Đào tạo mở thầu gói tư vấn xây dựng lộ trình triển khai chuyển đổi số 2026-2030, bao gồm học trực tuyến và quản lý học sinh.',
    date: '2026-07-19', category: 'Giáo dục', country: 'Vietnam', amount: '850 tỷ',
    aiSummary: 'Tư vấn số hóa giáo dục — tiềm năng lớn cho IT và edtech.',
    tags: ['education', 'digital', 'consulting', 'bidding'],
    coverEmoji: '📖', gradient: ['#fff7ed', '#ffedd5'],
    status: 'Đang mở thầu', deadline: '2026-08-05',
  },
  {
    id: 'dt-004', source: 'dauthau',
    title: 'Kết quả đấu thầu dự án cấp nước sạch nông thôn 12 tỉnh miền Trung vốn ODA World Bank',
    titleVi: 'Công bố kết quả đấu thầu dự án xây dựng hệ thống cấp nước sạch nông thôn 12 tỉnh miền Trung',
    excerpt: 'Công bố kết quả đấu thầu dự án xây dựng hệ thống cấp nước sạch nông thôn 12 tỉnh miền Trung.',
    excerptVi: 'Công bố kết quả đấu thầu dự án cấp nước sạch nông thôn tại 12 tỉnh miền Trung, sử dụng vốn ODA từ World Bank, tổng mức đầu tư 1.800 tỷ đồng.',
    date: '2026-07-16', category: 'Hạ tầng', country: 'Vietnam', amount: '1.800 tỷ',
    aiSummary: 'Kết quả thầu nước sạch miền Trung — nhà thầu trong nước trúng thầu.',
    tags: ['water', 'rural', 'infrastructure', 'oda'],
    coverEmoji: '💦', gradient: ['#eff6ff', '#dbeafe'],
    status: 'Đã có kết quả', deadline: null,
  },
  {
    id: 'dt-005', source: 'dauthau',
    title: 'Mời thầu hệ thống camera giám sát giao thông thông minh 63 tỉnh thành năm 2026',
    titleVi: 'Mời thầu lắp đặt hệ thống camera giám sát giao thông thông minh tại 63 tỉnh thành trên cả nước',
    excerpt: 'Cục CSGT phát hành hồ sơ mời thầu lắp đặt camera giám sát thông minh trên toàn quốc.',
    excerptVi: 'Cục Cảnh sát Giao thông phát hành hồ sơ mời thầu lắp đặt hệ thống camera AI giám sát giao thông tại 63 tỉnh thành, tích hợp nhận diện biển số.',
    date: '2026-07-13', category: 'An ninh', country: 'Vietnam', amount: '2.400 tỷ',
    aiSummary: 'Camera AI giao thông toàn quốc — thị trường lớn cho công nghệ.',
    tags: ['security', 'camera', 'traffic', 'ai'],
    coverEmoji: '📷', gradient: ['#f0fdf4', '#dcfce7'],
    status: 'Mời thầu', deadline: '2026-07-30',
  },
  {
    id: 'dt-006', source: 'dauthau',
    title: 'Gói thầu xây dựng Trung tâm Dữ liệu Quốc gia tại Hà Nội và TP.HCM',
    titleVi: 'Gói thầu xây dựng và trang bị hạ tầng Trung tâm Dữ liệu Quốc gia tại Hà Nội và Thành phố Hồ Chí Minh',
    excerpt: 'Bộ TT&TT phát hành hồ sơ mời thầu xây dựng Trung tâm Dữ liệu Quốc gia quy mô lớn.',
    excerptVi: 'Bộ Thông tin và Truyền thông phát hành hồ sơ mời thầu xây dựng và trang bị Trung tâm Dữ liệu Quốc gia tại Hà Nội và TP.HCM, phục vụ chính phủ số.',
    date: '2026-07-11', category: 'CNTT', country: 'Vietnam', amount: '5.600 tỷ',
    aiSummary: 'Data center quốc gia quy mô lớn — cơ hội cho doanh nghiệp IT hạ tầng.',
    tags: ['datacenter', 'digital', 'infrastructure', 'government'],
    coverEmoji: '🖧', gradient: ['#fdf4ff', '#fae8ff'],
    status: 'Đang mở thầu', deadline: '2026-08-20',
  },

  // ── Tin Tức Báo Chí ─────────────────────────────────────────
  {
    id: 'tt-001', source: 'tintuc',
    title: 'Vietnam economy grows 6.42% in first half of 2026',
    titleVi: 'Kinh tế Việt Nam tăng trưởng 6,42% trong nửa đầu năm 2026',
    excerpt: 'Vietnam\'s GDP grew by 6.42% in the first half of 2026, driven by strong manufacturing and FDI inflows.',
    excerptVi: 'GDP của Việt Nam tăng trưởng 6,42% trong nửa đầu năm 2026, nhờ động lực mạnh mẽ từ ngành công nghiệp chế biến chế tạo và dòng vốn FDI dồi dào.',
    date: '2026-07-22', category: 'Kinh tế', country: 'Vietnam',
    aiSummary: 'Kinh tế VN hồi phục mạnh mẽ nhờ FDI và xuất khẩu.',
    tags: ['vietnam', 'economy', 'gdp', 'fdi'],
    coverUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=85',
    coverEmoji: '📈', gradient: ['#eff6ff', '#bfdbfe']
  },
  {
    id: 'tt-002', source: 'tintuc',
    title: 'Samsung invests another $1 billion in northern Vietnam expansion',
    titleVi: 'Samsung đầu tư thêm 1 tỷ USD mở rộng nhà máy tại miền Bắc',
    excerpt: 'Samsung Group has committed to investing another $1 billion to expand its smart devices production lines.',
    excerptVi: 'Tập đoàn Samsung cam kết rót thêm 1 tỷ USD để mở rộng dây chuyền sản xuất thiết bị thông minh tại Bắc Ninh và Thái Nguyên.',
    date: '2026-07-21', category: 'Đầu tư', country: 'Vietnam',
    aiSummary: 'Samsung tăng cường hiện diện sản xuất công nghệ cao tại VN.',
    tags: ['samsung', 'investment', 'fdi', 'technology'],
    coverUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=85',
    coverEmoji: '📱', gradient: ['#ecfdf5', '#a7f3d0']
  },
  {
    id: 'tt-003', source: 'tintuc',
    title: 'Vietnam speeds up construction of North-South high-speed railway',
    titleVi: 'Đẩy nhanh tiến độ lập dự án đường sắt tốc độ cao Bắc - Nam',
    excerpt: 'The Ministry of Transport is accelerating the investment reports for the mega North-South high-speed railway project.',
    excerptVi: 'Bộ Giao thông Vận tải đang đẩy nhanh tiến độ hoàn thiện báo cáo nghiên cứu tiền khả thi cho dự án đại đường sắt tốc độ cao Bắc - Nam trục 350km/h.',
    date: '2026-07-20', category: 'Hạ tầng', country: 'Vietnam',
    aiSummary: 'Dự án đường sắt cao tốc Bắc-Nam chuẩn bị trình Quốc hội phê duyệt.',
    tags: ['railway', 'highspeed', 'infrastructure', 'vietnam'],
    coverUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=85',
    coverEmoji: '🚄', gradient: ['#fef3c7', '#fde68a']
  }
];

export const getArticlesBySource = (sourceId) => {
  if (!sourceId || sourceId === 'all') return mockArticles;
  return mockArticles.filter(a => a.source === sourceId);
};

export const getArticleById = (id) => mockArticles.find(a => a.id === id);

export const trendingKeywords = [
  { rank: 1, text: 'Năng lượng tái tạo Mekong', count: 142, emoji: '⚡' },
  { rank: 2, text: 'ODA Vietnam 2026', count: 98, emoji: '💰' },
  { rank: 3, text: 'Cao tốc Bắc-Nam giai đoạn 3', count: 87, emoji: '🛣️' },
  { rank: 4, text: 'World Bank climate fund', count: 75, emoji: '🌱' },
  { rank: 5, text: 'Đấu thầu y tế 2026', count: 63, emoji: '🏥' },
  { rank: 6, text: 'Digital Government ASEAN', count: 51, emoji: '🖥️' },
  { rank: 7, text: 'ADB climate resilience', count: 44, emoji: '🌍' },
  { rank: 8, text: 'Camera AI giao thông', count: 38, emoji: '📷' },
  { rank: 9, text: 'Data center quốc gia', count: 31, emoji: '🖧' },
  { rank: 10, text: 'Nước sạch nông thôn', count: 29, emoji: '💧' },
];

export const statsData = {
  totalArticles: 1284, todayArticles: 47,
  adbCount: 412, wbCount: 389, dauthauCount: 483,
  aiProcessed: 1201, lastUpdate: '2 phút trước',
};

// ── NEW STRUCTURED DATA FOR WORLD BANK PROJECTS ────────────────
export const mockWbProjects = [
  {
      "id": "cluster-p-03",
      "title": "Hệ thống Quản lý Giao thông Thông minh ITS Hà Nội giai đoạn 2",
      "country": "Vietnam",
      "projectId": "P520101",
      "amount": "$45,000,000",
      "status": "Active",
      "approvalDate": "2025-10-12",
      "lastUpdatedDate": "2026-05-14",
      "sector": "Urban Dev",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Lắp đặt 600 camera AI điều phối đèn giao thông tự động chống ùn tắc."
  },
  {
      "id": "cluster-p-04",
      "title": "Dự án Nâng cấp Nhà máy Nước sạch Sông Đống Đa & Sông Đuống",
      "country": "Vietnam",
      "projectId": "P520102",
      "amount": "$95,000,000",
      "status": "Active",
      "approvalDate": "2025-08-20",
      "lastUpdatedDate": "2026-04-10",
      "sector": "Water",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Tăng công suất cấp nước sạch thêm 300.000 m3/ngày đêm cho nội đô."
  },
  {
      "id": "cluster-p-09",
      "title": "World Bank Hỗ trợ Dự án Chống Ngập và Xử lý Nước thải Sông Nhuệ",
      "country": "Vietnam",
      "projectId": "P520103",
      "amount": "$180,000,000",
      "status": "Active",
      "approvalDate": "2026-01-08",
      "lastUpdatedDate": "2026-06-22",
      "sector": "Water",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Xây dựng trạm bơm đầu mối 45 m3/s và hệ thống gom nước thải lưu vực."
  },
  {
      "id": "cluster-p-13",
      "title": "Dự án Nâng cấp Sân bay Quốc tế Nội Bài - Ga T2 Mở rộng",
      "country": "Vietnam",
      "projectId": "P520104",
      "amount": "$450,000,000",
      "status": "Active",
      "approvalDate": "2025-06-15",
      "lastUpdatedDate": "2026-07-05",
      "sector": "Transport",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Nâng công suất phục vụ hành khách lên 15 triệu lượt/năm."
  },
  {
      "id": "cluster-p-17",
      "title": "World Bank Dự án Giảm nhẹ Rủi ro Thiên tai và Thích ứng Khí hậu",
      "country": "Vietnam",
      "projectId": "P520105",
      "amount": "$130,000,000",
      "status": "Active",
      "approvalDate": "2025-12-01",
      "lastUpdatedDate": "2026-05-30",
      "sector": "Climate",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Gia cố 45km đê điều xung yếu và xây trạm cảnh báo thiên tai tự động."
  },
  {
      "id": "cluster-p-20",
      "title": "Dự án Cải tạo Môi trường Nước Hồ Tây và Xử lý Trầm tích",
      "country": "Vietnam",
      "projectId": "P520106",
      "amount": "$40,000,000",
      "status": "Planned",
      "approvalDate": "2026-10-15",
      "lastUpdatedDate": null,
      "sector": "Water",
      "lastStage": "Concept Review",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Nạo vét 1,5 triệu m3 bùn thải và lắp hệ thống sục khí sinh học tự động."
  },
  {
      "id": "cluster-p-24",
      "title": "World Bank Tài trợ Hệ thống Lưu trữ Điện Năng pin BESS Hà Nội",
      "country": "Vietnam",
      "projectId": "P520107",
      "amount": "$90,000,000",
      "status": "Pipeline",
      "approvalDate": "2027-01-20",
      "lastUpdatedDate": null,
      "sector": "Energy",
      "lastStage": "Pipeline",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Thử nghiệm hệ thống BESS 100MW/200MWh cân bằng phụ tải giờ cao điểm."
  },
  {
      "id": "cluster-p-28",
      "title": "Dự án Phát triển Nông nghiệp Hữu cơ và Chuỗi Cung ứng Hà Nội",
      "country": "Vietnam",
      "projectId": "P520108",
      "amount": "$32,000,000",
      "status": "Active",
      "approvalDate": "2025-11-25",
      "lastUpdatedDate": "2026-06-18",
      "sector": "Agriculture",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Hỗ trợ 50 hợp tác tác xã đạt tiêu chuẩn VietGAP và truy xuất nguồn gốc QR."
  },
  {
      "id": "cluster-p-31",
      "title": "Dự án Xây dựng Cầu Tứ Liên kết nối Tây Hồ với Đông Anh",
      "country": "Vietnam",
      "projectId": "P520109",
      "amount": "$280,000,000",
      "status": "Planned",
      "approvalDate": "2026-12-01",
      "lastUpdatedDate": null,
      "sector": "Transport",
      "lastStage": "Concept Review",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Cầu dây văng mang biểu tượng hoa sen độc đáo vượt sông Hồng."
  },
  {
      "id": "cluster-p-35",
      "title": "World Bank Dự án Giao thông Công cộng Sức chứa Lớn BRT Hà Nội 2.0",
      "country": "Vietnam",
      "projectId": "P520110",
      "amount": "$115,000,000",
      "status": "Pipeline",
      "approvalDate": "2027-03-15",
      "lastUpdatedDate": null,
      "sector": "Transport",
      "lastStage": "Pipeline",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Tái cấu trúc tuyến bus nhanh kết nối với các ga Metro chính."
  },
  {
    id: 'wb-p-001',
    title: 'Philippines Multisectoral Nutrition Project-Converging Nutrition Efforts for our Children\'s Tomorrow',
    country: 'Philippines',
    projectId: 'P513206',
    amount: '$647,000,000',
    status: 'Pipeline',
    approvalDate: '2027-09-30',
    lastUpdatedDate: null,
    lastStage: 'Concept Review',
    sector: 'Nutrition',
    mapCoords: { x: 74, y: 40 }
  },
  {
    id: 'wb-p-002',
    title: 'Chao Phraya Flood Management Plan 2',
    country: 'Thailand',
    projectId: 'P510631',
    amount: '$880,000,000',
    status: 'Pipeline',
    approvalDate: '2027-09-21',
    lastUpdatedDate: '2025-03-09',
    lastStage: 'Concept Review',
    sector: 'Water',
    mapCoords: { x: 45, y: 45 }
  },
  {
    id: 'wb-p-003',
    title: 'Philippines SME COMPETE +',
    country: 'Philippines',
    projectId: 'P507827',
    amount: '$301,115,008',
    status: 'Pipeline',
    approvalDate: '2027-09-15',
    lastUpdatedDate: '2025-04-11',
    lastStage: 'Concept Review',
    sector: 'Finance',
    mapCoords: { x: 78, y: 46 }
  },
  {
    id: 'wb-p-004',
    title: 'South Africa Rail & Ports Sector Governance and Skills Development',
    country: 'South Africa',
    projectId: 'P17123',
    amount: '$90,000,000',
    status: 'Pipeline',
    approvalDate: '2027-09-15',
    lastUpdatedDate: null,
    lastStage: 'Concept Review',
    sector: 'Transport',
    mapCoords: { x: 15, y: 82 }
  },
  {
    id: 'wb-p-005',
    title: 'Inclusive Partnerships for Agrarian Reform Communities',
    country: 'Philippines',
    projectId: 'P513635',
    amount: '$351,709,792',
    status: 'Pipeline',
    approvalDate: '2027-09-10',
    lastUpdatedDate: null,
    lastStage: 'Concept Review',
    sector: 'Agriculture',
    mapCoords: { x: 76, y: 48 }
  },
  {
    id: 'wb-p-006',
    title: 'Industrial Decarbonization and Competitiveness Facility Project',
    country: 'Indonesia',
    projectId: 'P514469',
    amount: '$500,000,000',
    status: 'Pipeline',
    approvalDate: '2027-07-30',
    lastUpdatedDate: null,
    lastStage: 'Concept Review',
    sector: 'Energy',
    mapCoords: { x: 50, y: 80 }
  },
  {
    id: 'wb-p-007',
    title: 'Groundwater for Food Sustainability and Sovereignty',
    country: 'Indonesia',
    projectId: 'P515372',
    amount: '$200,000,000',
    status: 'Pipeline',
    approvalDate: '2027-07-30',
    lastUpdatedDate: null,
    lastStage: 'Concept Review',
    sector: 'Water',
    mapCoords: { x: 52, y: 88 }
  },
  {
    id: 'wb-p-008',
    title: 'Food and Irrigation Security Project',
    country: 'Indonesia',
    projectId: 'P515373',
    amount: '$500,000,000',
    status: 'Pipeline',
    approvalDate: '2027-07-30',
    lastUpdatedDate: null,
    lastStage: 'Concept Review',
    sector: 'Agriculture',
    mapCoords: { x: 58, y: 90 }
  },
  {
    id: 'wb-p-009',
    title: 'FINGROW Tajikistan',
    country: 'Tajikistan',
    projectId: 'P512525',
    amount: '$30,000,000',
    status: 'Pipeline',
    approvalDate: '2027-07-22',
    lastUpdatedDate: null,
    lastStage: 'Concept Review',
    sector: 'Finance',
    mapCoords: { x: 12, y: 50 }
  },
  {
    id: 'wb-p-010',
    title: 'INDONESIA ROAD CONNECTIVITY IMPROVEMENT PROGRAM',
    country: 'Indonesia',
    projectId: 'P508107',
    amount: '$1,000,000,000',
    status: 'Pipeline',
    approvalDate: '2027-07-15',
    lastUpdatedDate: '2025-04-07',
    lastStage: 'Concept Review',
    sector: 'Transport',
    mapCoords: { x: 46, y: 76 }
  },
  {
    id: 'wb-p-011',
    title: 'Amazon and Cerrado Bioeconomy, Forest Restoration, and Climate-Smart Agriculture Project',
    country: 'Brazil',
    projectId: 'P508202',
    amount: '$426,000,000',
    status: 'Pipeline',
    approvalDate: '2027-07-15',
    lastUpdatedDate: '2024-11-29',
    lastStage: 'Begin Appraisal',
    sector: 'Climate',
    mapCoords: { x: 8, y: 25 }
  },
  {
    id: 'wb-p-012',
    title: 'Quality, Reliable and Affordable National Health Insurance Financing : JKN-KUAT',
    country: 'Indonesia',
    projectId: 'P512159',
    amount: '$850,000,000',
    status: 'Pipeline',
    approvalDate: '2027-07-15',
    lastUpdatedDate: null,
    lastStage: 'Begin Negotiation',
    sector: 'Finance',
    mapCoords: { x: 54, y: 89 }
  }
];

// ── NEW STRUCTURED DATA FOR ADB PROJECTS ───────────────────────
export const mockAdbProjects = [
  {
      "id": "cluster-p-02",
      "title": "Dự án Tuyến đường sắt đô thị Metro Line 3 Nhổn - Ga Hà Nội (Đoạn ngầm)",
      "country": "Vietnam",
      "projectId": "P48901",
      "amount": "$320,000,000",
      "status": "Active",
      "approvalDate": "2026-01-15",
      "lastUpdatedDate": "2026-06-20",
      "sector": "Transport",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "ADB tài trợ thi công 4 ga ngầm và 4km đường hầm TBM xuyên tâm thủ đô."
  },
  {
      "id": "cluster-p-06",
      "title": "ADB Phê duyệt Khoản vay Xây dựng Hạ tầng Đô thị Xanh Hà Nội",
      "country": "Vietnam",
      "projectId": "P48902",
      "amount": "$210,000,000",
      "status": "Active",
      "approvalDate": "2026-02-10",
      "lastUpdatedDate": "2026-05-18",
      "sector": "Climate",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Phát triển công viên sinh thái điều hòa và cải tạo 12 hồ nội thành."
  },
  {
      "id": "cluster-p-07",
      "title": "Dự án Năng lượng Mặt trời Mái nhà & Lưới điện Thông minh EVN Hà Nội",
      "country": "Vietnam",
      "projectId": "P48903",
      "amount": "$150,000,000",
      "status": "Active",
      "approvalDate": "2026-03-05",
      "lastUpdatedDate": "2026-07-01",
      "sector": "Energy",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Tích hợp 200MWp điện mặt trời và hệ thống tự động hóa lưới điện."
  },
  {
      "id": "cluster-p-12",
      "title": "ADB Tài trợ Hạ tầng Nông nghiệp Thông minh & Logistics Nông sản Phía Bắc",
      "country": "Vietnam",
      "projectId": "P48904",
      "amount": "$110,000,000",
      "status": "Pipeline",
      "approvalDate": "2026-11-20",
      "lastUpdatedDate": null,
      "sector": "Agriculture",
      "lastStage": "Concept Review",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Xây dựng trung tâm kho lạnh và sàn giao dịch nông sản hiện đại Phía Bắc."
  },
  {
      "id": "cluster-p-15",
      "title": "Dự án Chuyển đổi Số Y tế và Bệnh án Điện tử Thành phố Hà Nội",
      "country": "Vietnam",
      "projectId": "P48905",
      "amount": "$35,000,000",
      "status": "Active",
      "approvalDate": "2026-04-12",
      "lastUpdatedDate": "2026-07-10",
      "sector": "Finance",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Kết nối dữ liệu y tế toàn dân và triển khai hồ sơ sức khỏe điện tử."
  },
  {
      "id": "cluster-p-19",
      "title": "ADB Tài trợ Chương trình Giáo dục Nghề nghiệp & Kỹ năng Số Phía Bắc",
      "country": "Vietnam",
      "projectId": "P48906",
      "amount": "$75,000,000",
      "status": "Active",
      "approvalDate": "2026-01-25",
      "lastUpdatedDate": "2026-06-15",
      "sector": "Finance",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Đào tạo 30.000 kỹ sư vi mạch, AI và lập trình viên chất lượng cao."
  },
  {
      "id": "cluster-p-22",
      "title": "Dự án Xây dựng Trung tâm Đổi mới Sáng tạo Quốc gia NIC Hòa Lạc",
      "country": "Vietnam",
      "projectId": "P48907",
      "amount": "$125,000,000",
      "status": "Completed",
      "approvalDate": "2024-05-10",
      "lastUpdatedDate": "2026-01-10",
      "sector": "Urban Dev",
      "lastStage": "Completed",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Tổ hợp công trình xanh chứng nhận LEED Gold hỗ trợ 500 startup công nghệ."
  },
  {
      "id": "cluster-p-26",
      "title": "Dự án Nâng cấp Đê Sông Hồng Thích ứng Biến đổi Khí hậu",
      "country": "Vietnam",
      "projectId": "P48908",
      "amount": "$140,000,000",
      "status": "Active",
      "approvalDate": "2025-09-15",
      "lastUpdatedDate": "2026-06-01",
      "sector": "Climate",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Bê tông hóa đê kè và xây dựng cảnh quan công viên ven sông."
  },
  {
      "id": "cluster-p-30",
      "title": "ADB Hỗ trợ Phát triển Mạng lưới Viễn thông 5G & Đô thị Thông minh",
      "country": "Vietnam",
      "projectId": "P48909",
      "amount": "$200,000,000",
      "status": "Active",
      "approvalDate": "2026-02-28",
      "lastUpdatedDate": "2026-07-15",
      "sector": "Urban Dev",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Xây dựng 1.200 trạm BTS 5G dùng chung cho toàn vùng đô thị."
  },
  {
      "id": "cluster-p-33",
      "title": "Dự án Xử lý Chất thải Rác Sinh hoạt Phát điện Nam Sơn Giai đoạn 2",
      "country": "Vietnam",
      "projectId": "P48910",
      "amount": "$165,000,000",
      "status": "Active",
      "approvalDate": "2025-11-10",
      "lastUpdatedDate": "2026-06-30",
      "sector": "Energy",
      "lastStage": "Active",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Nâng công suất đốt rác phát điện thêm 2.000 tấn/ngày đêm."
  },
  {
    id: 'adb-p-001',
    title: 'Vietnam Clean Energy Transition Project',
    country: 'Vietnam',
    projectId: 'P48375',
    amount: '$500,000,000',
    status: 'Approved',
    approvalDate: '2026-07-20',
    lastUpdatedDate: '2026-07-22',
    sector: 'Energy',
    lastStage: 'Approved',
    mapCoords: { x: 57, y: 25 }
  },
  {
    id: 'adb-p-002',
    title: 'Urban Development and Flood Management in Ho Chi Minh City',
    country: 'Vietnam',
    projectId: 'P48376',
    amount: '$200,000,000',
    status: 'Active',
    approvalDate: '2026-07-18',
    lastUpdatedDate: '2026-07-19',
    sector: 'Urban Dev',
    lastStage: 'Active',
    mapCoords: { x: 59, y: 55 }
  },
  {
    id: 'adb-p-003',
    title: 'Digital Financial Inclusion Initiative for Rural Communities',
    country: 'Cambodia',
    projectId: 'P48377',
    amount: '$50,000,000',
    status: 'Active',
    approvalDate: '2026-07-15',
    lastUpdatedDate: '2026-07-16',
    sector: 'Finance',
    lastStage: 'Active',
    mapCoords: { x: 52, y: 54 }
  },
  {
    id: 'adb-p-004',
    title: 'Asia Climate Resilience Fund 2026',
    country: 'Regional',
    projectId: 'P48378',
    amount: '$1,000,000,000',
    status: 'Proposed',
    approvalDate: '2026-07-12',
    lastUpdatedDate: null,
    sector: 'Climate',
    lastStage: 'Proposed',
    mapCoords: { x: 65, y: 32 }
  },
  {
    id: 'adb-p-005',
    title: 'Transport Connectivity Project for Greater Mekong Subregion',
    country: 'GMS',
    projectId: 'P48379',
    amount: '$300,000,000',
    status: 'Approved',
    approvalDate: '2026-07-10',
    lastUpdatedDate: '2026-07-11',
    sector: 'Transport',
    lastStage: 'Approved',
    mapCoords: { x: 48, y: 36 }
  },
  {
    id: 'adb-p-006',
    title: 'Water Security Project for Philippine Island Communities',
    country: 'Philippines',
    projectId: 'P48380',
    amount: '$180,000,000',
    status: 'Active',
    approvalDate: '2026-07-08',
    lastUpdatedDate: null,
    sector: 'Water',
    lastStage: 'Active',
    mapCoords: { x: 80, y: 52 }
  }
];

// ── NEW STRUCTURED DATA FOR MUA SẮM CÔNG ───────────────────────
// 1. Thông báo mời thầu (TBMT)
export const mockProcurementNotices = [
  {
      "id": "cluster-p-01",
      "title": "Gói thầu XL-01: Thi công xây dựng Cầu Trần Hưng Đạo qua sông Hồng",
      "orgCode": "vn010029381",
      "procuringEntity": "Ban QLDA Đầu tư Xây dựng Công trình Giao thông Thành phố Hà Nội",
      "publishDate": "2026-07-22 09:00",
      "closeDate": "2026-08-20 16:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Transport",
      "amount": "$185,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Công trình trọng điểm kết nối quận Hoàn Kiếm và Long Biên."
  },
  {
      "id": "cluster-p-05",
      "title": "Gói thầu Thiết bị Công nghệ Thông tin & AI Trung tâm Dữ liệu Hà Nội",
      "orgCode": "vn010029382",
      "procuringEntity": "Sở Thông tin và Truyền thông Thành phố Hà Nội",
      "publishDate": "2026-07-20 10:30",
      "closeDate": "2026-08-15 15:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Finance",
      "amount": "$28,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Mua sắm máy chủ GPU và hạ tầng đám mây dùng chung cho cơ quan nhà nước."
  },
  {
      "id": "cluster-p-08",
      "title": "Gói thầu Xây lắp Nâng cấp Bệnh viện Đa khoa Xanh Pôn cơ sở 2",
      "orgCode": "vn010029383",
      "procuringEntity": "Ban QLDA Đầu tư Xây dựng Công trình Dân dụng Hà Nội",
      "publishDate": "2026-07-18 14:00",
      "closeDate": "2026-08-10 10:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Nutrition",
      "amount": "$65,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Xây mới khối nhà 10 tầng quy mô 500 giường bệnh đạt chuẩn quốc tế."
  },
  {
      "id": "cluster-p-10",
      "title": "Gói thầu Tư vấn Giám sát Thi công Tuyến đường Vành đai 4 Vùng Thủ đô",
      "orgCode": "vn010029384",
      "procuringEntity": "Ban QLDA Đầu tư Xây dựng Công trình Giao thông Thành phố Hà Nội",
      "publishDate": "2026-07-16 08:30",
      "closeDate": "2026-08-08 17:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Transport",
      "amount": "$15,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Giám sát kỹ thuật toàn bộ 112km đường cao tốc liên vùng Hà Nội - Hưng Yên - Bắc Ninh."
  },
  {
      "id": "cluster-p-11",
      "title": "Kế hoạch Xây dựng Công viên Khoa học Công nghệ Cao Hòa Lạc",
      "orgCode": "vn010029385",
      "procuringEntity": "Ban Quản lý Khu Công nghệ cao Hòa Lạc",
      "publishDate": "2026-07-15 11:00",
      "closeDate": "2026-08-05 09:00",
      "country": "Vietnam",
      "status": "Đã duyệt",
      "sector": "Urban Dev",
      "amount": "$85,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Hạ tầng kỹ thuật đồng bộ cho khu nghiên cứu bán dẫn và công nghệ sinh học."
  },
  {
      "id": "cluster-p-14",
      "title": "Gói thầu Hệ thống Chiếu sáng Thông minh Tiết kiệm Năng lượng Hà Nội",
      "orgCode": "vn010029386",
      "procuringEntity": "Sở Xây dựng Thành phố Hà Nội",
      "publishDate": "2026-07-12 15:30",
      "closeDate": "2026-08-02 16:30",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Energy",
      "amount": "$22,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Thay thế 50.000 đèn LED thông minh kết nối IoT điều khiển trung tâm."
  },
  {
      "id": "cluster-p-16",
      "title": "Gói thầu Mua sắm Xe buýt Điện và Trạm sạc Công cộng Giai đoạn 1",
      "orgCode": "vn010029387",
      "procuringEntity": "Tổng Công ty Vận tải Hà Nội (Transerco)",
      "publishDate": "2026-07-10 09:15",
      "closeDate": "2026-07-31 14:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Transport",
      "amount": "$55,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Đưa vào vận hành 250 xe buýt điện xanh giảm ô nhiễm không khí nội đô."
  },
  {
      "id": "cluster-p-18",
      "title": "Gói thầu XL-04: Xây dựng Nút giao Khác mức Cổ Linh - Vĩnh Tuy",
      "orgCode": "vn010029388",
      "procuringEntity": "Ban QLDA Đầu tư Xây dựng Công trình Giao thông Thành phố Hà Nội",
      "publishDate": "2026-07-08 16:00",
      "closeDate": "2026-07-28 17:00",
      "country": "Vietnam",
      "status": "Đã hoàn thành",
      "sector": "Transport",
      "amount": "$42,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Đã hoàn thành bàn giao thông xe vượt tiến độ 3 tháng."
  },
  {
      "id": "cluster-p-21",
      "title": "Gói thầu Mua sắm Hệ thống Radar và Giám sát Không lưu Hà Nội",
      "orgCode": "vn010029389",
      "procuringEntity": "Tổng Công ty Quản lý bay Việt Nam (VATM)",
      "publishDate": "2026-07-05 13:45",
      "closeDate": "2026-07-26 15:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Transport",
      "amount": "$60,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Trang bị radar thứ cấp thế hệ mới đảm bảo an toàn bay khu vực phía Bắc."
  },
  {
      "id": "cluster-p-23",
      "title": "Gói thầu Mua sắm Vật tư Y tế & Khóa Sinh học Bệnh viện Bạch Mai",
      "orgCode": "vn010029390",
      "procuringEntity": "Bệnh viện Bạch Mai Hà Nội",
      "publishDate": "2026-07-03 10:00",
      "closeDate": "2026-07-24 11:30",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Nutrition",
      "amount": "$18,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Cung ứng vật tư tiêu hao y tế chất lượng cao cho các khoa cấp cứu."
  },
  {
      "id": "cluster-p-25",
      "title": "Gói thầu Tư vấn Lập Quy hoạch Đô thị Vệ tinh Sơn Tây - Hòa Lạc",
      "orgCode": "vn010029391",
      "procuringEntity": "Viện Quy hoạch Xây dựng Hà Nội",
      "publishDate": "2026-07-01 08:00",
      "closeDate": "2026-07-22 17:00",
      "country": "Vietnam",
      "status": "Đã duyệt",
      "sector": "Urban Dev",
      "amount": "$8,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Quy hoạch chi tiết 1/2000 trục đô thị sinh thái kết nối đại học."
  },
  {
      "id": "cluster-p-27",
      "title": "Gói thầu Thi công Xây lắp Đường nối Hà Nội - Bái Đính",
      "orgCode": "vn010029392",
      "procuringEntity": "Ban QLDA Đầu tư Xây dựng Công trình Giao thông Thành phố Hà Nội",
      "publishDate": "2026-06-28 14:20",
      "closeDate": "2026-07-20 16:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Transport",
      "amount": "$98,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Tuyến đường quy mô 6 làn xe kết nối du lịch tâm linh vùng di sản."
  },
  {
      "id": "cluster-p-29",
      "title": "Gói thầu Phần mềm Giám sát Đấu thầu Quốc gia AI-Bidding",
      "orgCode": "vn010029393",
      "procuringEntity": "Cục Quản lý Đấu thầu - Bộ Kế hoạch và Đầu tư",
      "publishDate": "2026-06-25 09:30",
      "closeDate": "2026-07-18 10:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Finance",
      "amount": "$12,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Tích hợp mô hình AI phát hiện dấu hiệu thông thầu và bất thường dữ liệu."
  },
  {
      "id": "cluster-p-32",
      "title": "Gói thầu Xây dựng Ký túc xá Sinh viên ĐHQG Hà Nội tại Hòa Lạc",
      "orgCode": "vn010029394",
      "procuringEntity": "Ban QLDA Đầu tư Xây dựng Đại học Quốc gia Hà Nội",
      "publishDate": "2026-06-22 11:15",
      "closeDate": "2026-07-15 15:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Urban Dev",
      "amount": "$48,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Cung cấp 10.000 chỗ ở cho sinh viên với đầy đủ tiện ích thể thao."
  },
  {
      "id": "cluster-p-34",
      "title": "Gói thầu Mua sắm Thiết bị Quan trắc Môi trường Không khí Tự động",
      "orgCode": "vn010029395",
      "procuringEntity": "Sở Tài nguyên và Môi trường Thành phố Hà Nội",
      "publishDate": "2026-06-20 16:45",
      "closeDate": "2026-07-12 11:00",
      "country": "Vietnam",
      "status": "Đang mở thầu",
      "sector": "Climate",
      "amount": "$14,000,000",
      "mapCoords": {
          "x": 52,
          "y": 22
      },
      "aiSummary": "Lắp đặt 30 trạm quan trắc chỉ số AQI truyền dữ liệu realtime."
  },
  {
    id: 'IB2600384477-00',
    title: 'Gói thầu số 2: Tư vấn khảo sát, lập báo cáo nghiên cứu khả thi',
    orgCode: 'vn5300233808',
    procuringEntity: 'Ban Quản lý dự án đầu tư xây dựng công trình giao thông tỉnh Lào Cai',
    publishDate: '2026-07-21 16:32',
    closeDate: '2026-07-28 08:00',
    country: 'Vietnam',
    status: 'Đang mở thầu',
    sector: 'Transport',
    mapCoords: { x: 53.5, y: 20 }
  },
  {
    id: 'IB2600377917-00',
    title: 'Tư vấn khảo sát xây dựng, cắm mốc và lập báo cáo nghiên cứu khả thi',
    orgCode: 'vn1800809747',
    procuringEntity: 'Ban Quản lý dự án đầu tư xây dựng công trình giao thông và nông nghiệp thành phố Cần Thơ',
    publishDate: '2026-07-17 17:07',
    closeDate: '2026-08-05 09:00',
    country: 'Vietnam',
    status: 'Đang mở thầu',
    sector: 'Transport',
    mapCoords: { x: 56.5, y: 60 }
  },
  {
    id: 'IB2600350334-00',
    title: 'Tư vấn khảo sát xây dựng, cắm mốc GPMB, mốc lộ giới và lập báo cáo nghiên cứu khả thi',
    orgCode: 'vn1800809747',
    procuringEntity: 'Ban Quản lý dự án đầu tư xây dựng công trình giao thông và nông nghiệp thành phố Cần Thơ',
    publishDate: '2026-07-08 17:04',
    closeDate: '2026-07-27 09:00',
    country: 'Vietnam',
    status: 'Đang mở thầu',
    sector: 'Transport',
    mapCoords: { x: 56.5, y: 62 }
  },
  {
    id: 'IB2600351150-00',
    title: 'Tư vấn lập nhiệm vụ khảo sát xây dựng, nhiệm vụ thiết kế xây dựng phục vụ lập Báo cáo nghiên cứu khả thi',
    orgCode: 'vn5600203522',
    procuringEntity: 'Ban Quản lý dự án các công trình Giao thông tỉnh Điện Biên',
    publishDate: '2026-07-08 16:53',
    closeDate: '2026-07-26 16:00',
    country: 'Vietnam',
    status: 'Đang mở thầu',
    sector: 'Transport',
    mapCoords: { x: 51, y: 21 }
  },
  {
    id: 'IB2600346536-00',
    title: 'Tư vấn khảo sát, lập Báo cáo nghiên cứu khả thi và cắm cọc GPMB',
    orgCode: 'vn0402262069',
    procuringEntity: 'Ban Quản lý dự án đầu tư xây dựng các công trình giao thông và nông nghiệp tỉnh Bình Định',
    publishDate: '2026-07-05 16:33',
    closeDate: '2026-07-25 16:50',
    country: 'Vietnam',
    status: 'Đang mở thầu',
    sector: 'Transport',
    mapCoords: { x: 61, y: 45 }
  }
];

// 2. Kế hoạch lựa chọn nhà thầu (KHLCNT)
export const mockProcurementPlans = [
  {
    id: 'PL2600222922-00',
    title: 'Đường 59 ấp Phước Lập, xã Phước Vinh',
    orgCode: 'vn3901388425',
    procuringEntity: 'Ban quản lý dự án xã Phước Vinh',
    publishDate: '2026-07-22 08:50',
    packageCount: 3,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 56, y: 53 }
  },
  {
    id: 'PL2600222852-00',
    title: 'Kế hoạch lựa chọn nhà thầu dự án: Đường giao thông nội bộ làng ông Anh, thôn 1',
    orgCode: 'vnz000044051',
    procuringEntity: 'TRUNG TÂM CUNG ỨNG DỊCH VỤ SỰ NGHIỆP CÔNG XÃ TRÀ LENG',
    publishDate: '2026-07-22 08:45',
    packageCount: 6,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 59, y: 39 }
  },
  {
    id: 'PL2600222858-00',
    title: 'Kế hoạch lựa chọn nhà thầu thuộc dự án Đường giao thông từ Đình Trung đi Khu công nghiệp Song Khê-Nội Hoàng, phường Tiền Phong',
    orgCode: 'vn2401075775',
    procuringEntity: 'Ban Quản lý dự án xây dựng Tiền Phong',
    publishDate: '2026-07-22 08:22',
    packageCount: 2,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 59, y: 26 }
  },
  {
    id: 'PL2600222808-00',
    title: 'Kế hoạch lựa chọn nhà thầu các gói thầu tư vấn dự án: Hệ thống đèn, điện chiếu sáng đường giao thông và các điểm giao cắt với đường sắt tại tổ dân phố Dốc Đỏ, phường Cam Đường.',
    orgCode: 'vnz000040031',
    procuringEntity: 'Ban quản lý dự án đầu tư xây dựng khu vực Cam Đường - Hợp Thành',
    publishDate: '2026-07-22 07:57',
    packageCount: 3,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 53, y: 22 }
  },
  {
    id: 'PL2600222691-00',
    title: 'Kế hoạch lựa chọn nhà thầu công trình: Cải tạo, nâng cấp đường giao thông thôn Phúc Hưng, xã Ninh Giang',
    orgCode: 'vn0601291716',
    procuringEntity: 'ỦY BAN NHÂN DÂN XÃ NINH GIANG',
    publishDate: '2026-07-21 21:05',
    packageCount: 2,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 58, y: 28 }
  },
  {
    id: 'PL2600222664-00',
    title: 'Tuyến mương tiêu và đường giao thông xóm Đồng Tân xã Hưng Nguyên Nam',
    orgCode: 'vn2902236215',
    procuringEntity: 'Ủy ban nhân dân xã Hưng Nguyên Nam',
    publishDate: '2026-07-21 20:29',
    packageCount: 4,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 57, y: 32 }
  },
  {
    id: 'PL2600222559-01',
    title: 'Kế hoạch lựa chọn nhà thầu dự án: Nâng cấp, mở rộng đường giao thông xóm 6, xã Xuân Lam, huyện Hưng Nguyên',
    orgCode: 'vn2902236215',
    procuringEntity: 'Ủy ban nhân dân xã Hưng Nguyên Nam',
    publishDate: '2026-07-21 20:05',
    packageCount: 4,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 57, y: 33 }
  },
  {
    id: 'PL2600219946-01',
    title: 'Quyết định phê duyệt kế hoạch lựa chọn nhà thầu dự án: Nâng cấp, sửa chữa đường Thọ Trung - Bảo Quang',
    orgCode: 'vn3604041540',
    procuringEntity: 'VĂN PHÒNG HỘI ĐỒNG NHÂN DÂN VÀ ỦY BAN NHÂN DÂN XÃ XUÂN LỘC',
    publishDate: '2026-07-21 19:31',
    packageCount: 10,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 57, y: 30 }
  },
  {
    id: 'PL2600126771-01',
    title: 'Kế hoạch lựa chọn nhà thầu bổ sung các gói thầu bước TKVBTCDT-Vành đai 4-DATP1-4(ĐH-HK)',
    orgCode: 'vn1102147652',
    procuringEntity: 'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG CÔNG TRÌNH GIAO THÔNG TỈNH TÂY NINH',
    publishDate: '2026-07-21 19:02',
    packageCount: 15,
    country: 'Vietnam',
    status: 'Mới thầu',
    sector: 'Transport',
    mapCoords: { x: 56, y: 54 }
  }
];

