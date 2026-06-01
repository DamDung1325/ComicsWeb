/**
 * TLUTRUYEN — Logic Thêm truyện
 * Xử lý việc tạo truyện mới kèm theo ảnh bìa và tải lên chương đầu tiên.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra bảo mật: Quyền truy cập Admin
  if (!Auth.isAdmin()) {
    window.location.href = '../login.html';
    return;
  }

  initAddComicPage();
});

/* ─── Khởi tạo trang ────────────────────────────────────────── */

/**
 * Khởi tạo chính cho trang thêm truyện.
 */
function initAddComicPage() {
  const form = document.getElementById('add-comic-form');
  if (!form) return;

  // Khởi tạo các thành phần giao diện
  _setupDragAndDrop();
  
  // Đính kèm trình xử lý biểu mẫu
  form.addEventListener('submit', handleAddComicSubmit);
}

/* ─── UI: Kéo & Thả ────────────────────────────────────────────── */

/** @private */
function _setupDragAndDrop() {
  const coverInput = document.getElementById('comic-cover');
  const coverLabel = document.querySelector('label[for="comic-cover"]');
  const chapterInput = document.getElementById('comic-chapters');
  const chapterLabel = document.querySelector('label[for="comic-chapters"]');

  if (coverInput && coverLabel) {
    _bindDropZone(coverLabel, coverInput, (files) => {
      _updateLabel(coverLabel, `Đã chọn: ${files[0].name}`, true);
      _renderCoverPreview(files[0]);
    });
  }

  if (chapterInput && chapterLabel) {
    _bindDropZone(chapterLabel, chapterInput, (files) => {
      _updateLabel(chapterLabel, `Đã chọn ${files.length} trang truyện`, true);
      _renderChaptersPreview(Array.from(files));
    });
  }
}

/** @private */
function _bindDropZone(label, input, onFilesSelected) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    label.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
  });

  label.addEventListener('dragenter', () => label.classList.add('dragover'));
  label.addEventListener('dragleave', () => label.classList.remove('dragover'));
  
  label.addEventListener('drop', (e) => {
    label.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      input.files = e.dataTransfer.files;
      onFilesSelected(e.dataTransfer.files);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) onFilesSelected(input.files);
  });
}

/** @private */
function _updateLabel(label, text, success = false) {
  const span = label.querySelector('span');
  const small = label.querySelector('small');
  if (span) span.textContent = text;
  if (small && success) small.innerHTML = '<strong class="text-success">✓ Sẵn sàng</strong>';
  if (success) label.style.borderColor = 'var(--color-success)';
}

/* ─── UI: Xem trước ───────────────────────────────────────────────── */

/** @private */
function _renderCoverPreview(file) {
  const container = document.getElementById('cover-preview-container');
  const img = document.getElementById('cover-preview-img');
  if (!container || !img) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
    container.classList.remove('d-none');
    document.getElementById('cover-preview-name').textContent = file.name;
    document.getElementById('cover-preview-size').textContent = _formatBytes(file.size);
  };
  reader.readAsDataURL(file);
}

/** @private */
function _renderChaptersPreview(files) {
  const container = document.getElementById('chapters-preview-container');
  const grid = document.getElementById('chapters-preview');
  if (!container || !grid) return;

  grid.innerHTML = '';
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  
  if (imageFiles.length === 0) {
    container.classList.add('d-none');
    return;
  }

  container.classList.remove('d-none');
  document.getElementById('chapters-count').textContent = imageFiles.length;

  imageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement('div');
      item.className = 'upload-preview-grid-item';
      item.innerHTML = `
        <img src="${e.target.result}" class="upload-preview-grid-item-img">
        <div class="upload-preview-grid-item-overlay">
          <div class="upload-preview-grid-item-number">${index + 1}</div>
        </div>
      `;
      grid.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

/* ─── Hành động ────────────────────────────────────────────────────── */

/**
 * Xử lý gửi biểu mẫu.
 */
async function handleAddComicSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-add-comic');

  const formData = {
    title: document.getElementById('comic-title').value.trim(),
    author: document.getElementById('comic-author').value.trim(),
    artist: document.getElementById('comic-artist').value.trim(),
    description: document.getElementById('comic-description').value.trim(),
    genres: document.getElementById('comic-genres').value.trim(),
    chapterNumber: parseInt(document.getElementById('comic-chapter-number').value) || 1,
    chapterPrice: parseInt(document.getElementById('comic-chapter-price').value) || 0
  };

  if (!formData.title) {
    showToast('Vui lòng nhập tên truyện!', 'warning');
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;

    // 1. Tải lên Media
    const uploadResult = await _uploadComicMedia(formData);

    // 2. Tạo bản ghi truyện
    const comicPayload = {
      title: formData.title,
      slug: slugify(formData.title),
      description: formData.description,
      coverImage: uploadResult.coverImage || CONFIG.DEFAULTS.PLACEHOLDER_IMAGE,
      author: formData.author,
      artist: formData.artist,
      genres: formData.genres ? formData.genres.split(',').map(g => slugify(g.trim())).filter(Boolean) : [],
      status: 'ongoing',
      rating: CONFIG.DEFAULTS.RATING,
      views: 0,
      totalChapters: uploadResult.pages.length > 0 ? 1 : 0,
      approved: true,
      uploaderId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newComic = await createComic(comicPayload);

    // 3. Tạo bản ghi chương (nếu có tải lên trang truyện)
    if (uploadResult.pages.length > 0 && newComic?.id) {
      await createChapter({
        comicId: newComic.id,
        chapterNumber: formData.chapterNumber,
        title: `Chương ${formData.chapterNumber}`,
        pages: uploadResult.pages,
        price: formData.chapterPrice,
        createdAt: newComic.createdAt,
      });
    }

    showToast('Thêm truyện thành công!', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);

  } catch (error) {
    console.error('[ADMIN ADD] Lỗi:', error);
    showToast('Lỗi: ' + error.message, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/** @private */
async function _uploadComicMedia(formData) {
  const coverFile = document.getElementById('comic-cover').files[0];
  const chapterFiles = Array.from(document.getElementById('comic-chapters').files || []);

  if (!coverFile && chapterFiles.length === 0) {
    return { coverImage: null, pages: [] };
  }

  const payload = {
    comicTitle: formData.title,
    chapterNumber: formData.chapterNumber,
    coverFile: coverFile ? { name: coverFile.name, base64: await _toBase64(coverFile) } : null,
    pages: await Promise.all(chapterFiles.map(async f => ({ name: f.name, base64: await _toBase64(f) })))
  };

  const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload-comic-media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Upload ảnh thất bại');
  const result = await response.json();
  return result.data;
}

/* ─── Trợ giúp ────────────────────────────────────────────────────── */

/** @private */
function _toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** @private */
function _formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Phơi bày toàn cục cho các nút dọn dẹp trong HTML nếu có
window.removeCoverPreview = () => {
  document.getElementById('cover-preview-container')?.classList.add('d-none');
  document.getElementById('comic-cover').value = '';
};
window.clearChaptersPreview = () => {
  document.getElementById('chapters-preview-container')?.classList.add('d-none');
  document.getElementById('comic-chapters').value = '';
};
