// src/services/projectDocuments.js
// Tách biệt rõ ràng 2 mục đích:
// 1. Quản lý Tài liệu & Biên bản dự án tiềm năng (.DOCX, .PDF)
// 2. Đăng bài dưới dạng báo chí với Tên người dùng & Quyền riêng tư
import { projectsService } from './projects';

const STORAGE_KEY_DOCS = 'bis_potential_project_documents';
const STORAGE_KEY_POSTS = 'bis_project_press_posts';
const STORAGE_KEY_APPROVALS = 'bis_project_approvals';

/** Đọc danh sách tài liệu dự án tiềm năng */
export function getStoredProjectDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Lưu danh sách tài liệu dự án tiềm năng */
function saveStoredProjectDocuments(docs) {
  try {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
  } catch (err) {
    console.warn('Lỗi lưu project documents vào localStorage:', err);
  }
}

/** Đọc danh sách bài đăng báo chí */
export function getStoredProjectPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POSTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Lưu danh sách bài đăng báo chí */
function saveStoredProjectPosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
  } catch (err) {
    console.warn('Lỗi lưu project posts vào localStorage:', err);
  }
}

/** Đọc lịch sử phê duyệt */
export function getStoredApprovals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPROVALS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Ghi nhận lịch sử phê duyệt */
export function recordApproval(approval) {
  try {
    const approvals = getStoredApprovals();
    const entry = {
      id: `appr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...approval,
    };
    approvals.unshift(entry);
    localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(approvals.slice(0, 100)));
    return entry;
  } catch {
    return null;
  }
}

export const projectDocumentsService = {
  // ─────────────────────────────────────────────────────────────
  // 1. QUẢN LÝ TÀI LIỆU & BIÊN BẢN DỰ ÁN TIỀM NĂNG (DOCX, PDF)
  // ─────────────────────────────────────────────────────────────
  /** Lấy danh sách hồ sơ tài liệu & biên bản dự án */
  getDocuments() {
    return getStoredProjectDocuments();
  },

  /** Lưu hồ sơ tài liệu / biên bản dự án mới sau khi phê duyệt */
  createDocument(docData) {
    const docs = getStoredProjectDocuments();
    const newDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      kind: 'project_document',
      is_project_document: true,
      ...docData,
    };
    docs.unshift(newDoc);
    saveStoredProjectDocuments(docs);

    // Ghi nhận phê duyệt lưu tài liệu
    recordApproval({
      type: 'save_document',
      targetId: newDoc.id,
      title: newDoc.projectName,
      approverName: newDoc.creatorName || 'Người dùng',
      details: {
        projectName: newDoc.projectName,
        province: newDoc.province,
        fileCount: newDoc.files?.length || 0,
        summaryDate: newDoc.summaryDate,
      },
    });

    return newDoc;
  },

  /** Xóa hồ sơ tài liệu dự án */
  deleteDocument(docId) {
    const docs = getStoredProjectDocuments();
    const filtered = docs.filter((d) => d.id !== docId);
    saveStoredProjectDocuments(filtered);
    return true;
  },

  // ─────────────────────────────────────────────────────────────
  // 2. ĐĂNG BÀI BÁO CHÍ DỰ ÁN (PRESS POST WITH USER ATTRIBUTION & PRIVACY)
  // ─────────────────────────────────────────────────────────────
  /** Lấy danh sách bài đăng báo chí */
  getPosts() {
    return getStoredProjectPosts();
  },

  /** Tạo bài đăng báo chí mới sau khi phê duyệt thông tin */
  createPost(postData) {
    const posts = getStoredProjectPosts();
    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      kind: 'user_article',
      source_type: 'press',
      is_user_post: true,
      ...postData,
    };
    posts.unshift(newPost);
    saveStoredProjectPosts(posts);

    // Ghi nhận phê duyệt đăng bài báo chí
    recordApproval({
      type: 'publish_post',
      targetId: newPost.id,
      title: newPost.title || newPost.projectName,
      privacy: newPost.privacy,
      approverName: newPost.authorName || 'Người dùng',
      details: {
        projectName: newPost.projectName,
        province: newPost.province,
        fileCount: newPost.files?.length || 0,
      },
    });

    return newPost;
  },

  /** Xóa bài đăng báo chí */
  deletePost(postId) {
    const posts = getStoredProjectPosts();
    const filtered = posts.filter((p) => p.id !== postId);
    saveStoredProjectPosts(filtered);
    return true;
  },

  // ─────────────────────────────────────────────────────────────
  // 3. TRÍCH XUẤT THÔNG TIN TỪ FILE DOCX, PDF (DÙNG CHUNG)
  // ─────────────────────────────────────────────────────────────
  /**
   * Trích xuất thông tin tự động từ file DOCX hoặc PDF.
   * Áp dụng cho tài liệu dự án, biên bản dự án và tài liệu liên quan.
   * Quản lý các thông tin: Tên dự án, Vị trí, Nội dung/tóm tắt, Ngày, Ngày tóm tắt, File đính kèm.
   */
  async extractFromFile(file) {
    if (!file) throw new Error('Vui lòng chọn file');

    const todayStr = new Date().toISOString().split('T')[0];
    let extractedData = {
      projectName: '',
      province: '',
      summary: '',
      date: todayStr,
      summaryDate: todayStr,
      files: [
        {
          name: file.name,
          size: file.size,
          type: file.type || (file.name.endsWith('.docx') ? 'application/docx' : 'application/pdf'),
          lastModified: file.lastModified,
        },
      ],
      rawCandidates: [],
    };

    // 1. Thử gọi API trích xuất chuyên sâu của hệ thống
    try {
      const serverRes = await projectsService.extractFromProfile(file);
      if (serverRes && serverRes.candidates?.length > 0) {
        const topCandidate = serverRes.candidates[0];
        extractedData.projectName = topCandidate.name || '';
        extractedData.province = topCandidate.province || '';
        extractedData.rawCandidates = serverRes.candidates;

        const lines = [];
        if (topCandidate.name) lines.push(`• Dự án: ${topCandidate.name}`);
        if (topCandidate.investor) lines.push(`• Chủ đầu tư / Bên mời thầu: ${topCandidate.investor}`);
        if (topCandidate.province) lines.push(`• Địa bàn thực hiện: ${topCandidate.province}`);
        if (serverRes.candidates.length > 1) {
          lines.push(`• Ghi nhận thêm ${serverRes.candidates.length - 1} mục / gói thầu liên quan trong tài liệu.`);
        }
        if (lines.length > 0) {
          extractedData.summary = lines.join('\n');
        }
      }
    } catch (err) {
      console.warn('Server extraction fallback sang trích xuất nội bộ:', err);
    }

    // 2. Nếu tên dự án chưa có, suy đoán từ tên file
    if (!extractedData.projectName) {
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();
      extractedData.projectName = cleanFileName;
    }

    // 3. Nhận diện ngày từ tên file
    const dateMatch = file.name.match(/(\d{4})[-_](\d{2})[-_](\d{2})/) || file.name.match(/(\d{2})[-_](\d{2})[-_](\d{4})/);
    if (dateMatch) {
      if (dateMatch[1].length === 4) {
        extractedData.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      } else {
        extractedData.date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }
    }

    // 4. Nếu tóm tắt chưa có, tạo tóm tắt sơ bộ từ file đính kèm
    if (!extractedData.summary) {
      const isDocx = file.name.endsWith('.docx') || file.name.endsWith('.doc');
      const docType = isDocx ? 'Biên bản / Tài liệu Word (.DOCX)' : 'Tài liệu dự án (.PDF)';
      extractedData.summary = `Trích xuất từ tài liệu "${file.name}" (${(file.size / 1024).toFixed(1)} KB).\nLoại văn bản: ${docType}.\nNội dung liên quan đến biên bản dự án, tiến độ thực hiện và hồ sơ kỹ thuật.`;
    }

    return extractedData;
  },
};
