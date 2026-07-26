/* ==========================================================================
   She Glows - Admin Dashboard Controller
   Product CRUD, Stats, Image handling, Data export/import
   ========================================================================== */

// ── Guard: must be authenticated ──
document.addEventListener('DOMContentLoaded', () => {
  if (!SheGlowsAuth.guardAdminPage()) return;

  const session = SheGlowsAuth.getSession();
  const usernameEl = document.getElementById('admin-username-display');
  if (usernameEl && session) {
    usernameEl.textContent = session.username.charAt(0).toUpperCase() + session.username.slice(1);
  }

  renderStats();
  renderRecentProducts();
  renderAllProducts();
  setupSidebarNav();
});

/* ── Sidebar navigation ── */

function setupSidebarNav() {
  document.querySelectorAll('.sidebar-nav a[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      switchSection(section);
    });
  });
}

function switchSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('[id^="section-"]').forEach(s => s.style.display = 'none');
  // Show target
  const target = document.getElementById(`section-${sectionName}`);
  if (target) target.style.display = 'block';

  // Update sidebar active
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-nav a[data-section="${sectionName}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Update page title
  const titles = { dashboard: 'Dashboard', products: 'Product Management', settings: 'Settings' };
  document.getElementById('page-title').textContent = titles[sectionName] || 'Dashboard';

  // Refresh data
  if (sectionName === 'dashboard') { renderStats(); renderRecentProducts(); }
  if (sectionName === 'products') { renderAllProducts(); }
}

/* ── Stats ── */

function renderStats() {
  const stats = SheGlowsStore.getStats();
  const row = document.getElementById('stats-row');
  if (!row) return;
  row.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-card-icon gold"><i class="fas fa-gem"></i></div>
      </div>
      <h2>${stats.totalProducts}</h2>
      <p>Total Products</p>
    </div>
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-card-icon blue"><i class="fas fa-layer-group"></i></div>
      </div>
      <h2>${stats.totalCategories}</h2>
      <p>Categories</p>
    </div>
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-card-icon green"><i class="fas fa-check-circle"></i></div>
      </div>
      <h2>${stats.inStock}</h2>
      <p>In Stock</p>
    </div>
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-card-icon gold"><i class="fas fa-rupee-sign"></i></div>
      </div>
      <h2>₹${stats.avgPrice.toLocaleString('en-IN')}</h2>
      <p>Avg. Price</p>
    </div>
  `;
}

/* ── Product table renderers ── */

function renderRecentProducts() {
  const tbody = document.getElementById('recent-products-body');
  if (!tbody) return;
  const products = SheGlowsStore.getAllProducts().slice(-5).reverse();
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="table-product-cell">
          <img src="${resolveImagePath(p.image)}" class="table-product-thumb" alt="">
          <div>
            <div class="table-product-name">${p.title}</div>
          </div>
        </div>
      </td>
      <td><span class="table-product-cat">${p.category}</span></td>
      <td style="color:var(--gold-secondary); font-weight:700;">₹${p.price.toLocaleString('en-IN')}</td>
      <td><span class="table-tag ${p.inStock !== false ? 'in-stock' : 'out-stock'}">${p.inStock !== false ? 'In Stock' : 'Out'}</span></td>
    </tr>
  `).join('');
}

function renderAllProducts() {
  const tbody = document.getElementById('all-products-body');
  if (!tbody) return;
  const products = SheGlowsStore.getAllProducts();
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No products yet. Click "Add Product" to start.</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="table-product-cell">
          <img src="${resolveImagePath(p.image)}" class="table-product-thumb" alt="">
          <div>
            <div class="table-product-name">${p.title}</div>
            <div class="table-product-cat">${p.id}</div>
          </div>
        </div>
      </td>
      <td><span class="table-product-cat">${p.category}</span></td>
      <td style="color:var(--gold-secondary); font-weight:700;">₹${p.price.toLocaleString('en-IN')}</td>
      <td style="color:var(--text-muted); text-decoration:line-through;">₹${p.mrp.toLocaleString('en-IN')}</td>
      <td>${p.tag ? `<span class="table-tag in-stock">${p.tag}</span>` : '—'}</td>
      <td><span class="table-tag ${p.inStock !== false ? 'in-stock' : 'out-stock'}">${p.inStock !== false ? 'In Stock' : 'Out'}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn edit" title="Edit" onclick="openEditProduct('${p.id}')"><i class="fas fa-pen"></i></button>
          <button class="tbl-btn delete" title="Delete" onclick="confirmDeleteProduct('${p.id}', '${escapeHtml(p.title)}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function resolveImagePath(imgPath) {
  if (!imgPath) return '../images/cat_jhumkis.png';
  if (imgPath.startsWith('data:')) return imgPath;   // base64
  if (imgPath.startsWith('http')) return imgPath;
  return '../' + imgPath;    // relative path
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

/* ── Product Form Modal ── */

function openProductForm(product) {
  const modal = document.getElementById('product-form-modal');
  const title = document.getElementById('form-modal-title');
  const saveLabel = document.getElementById('form-save-label');

  // Clear all fields
  document.getElementById('edit-product-id').value = '';
  document.getElementById('prod-title').value = '';
  document.getElementById('prod-category').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-mrp').value = '';
  document.getElementById('prod-tag').value = '';
  document.getElementById('prod-stock').value = 'true';
  document.getElementById('prod-rating').value = '';
  document.getElementById('prod-reviews').value = '';
  document.getElementById('prod-desc').value = '';
  document.getElementById('prod-image-data').value = '';
  document.getElementById('image-preview').style.display = 'none';

  if (product) {
    title.innerHTML = '<i class="fas fa-pen" style="color:var(--gold-primary); margin-right:8px;"></i> Edit Product';
    saveLabel.textContent = 'Update Product';
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('prod-title').value = product.title || '';
    document.getElementById('prod-category').value = product.category || '';
    document.getElementById('prod-price').value = product.price || '';
    document.getElementById('prod-mrp').value = product.mrp || '';
    document.getElementById('prod-tag').value = product.tag || '';
    document.getElementById('prod-stock').value = product.inStock !== false ? 'true' : 'false';
    document.getElementById('prod-rating').value = product.rating || '';
    document.getElementById('prod-reviews').value = product.reviews || '';
    document.getElementById('prod-desc').value = product.description || '';
    if (product.image) {
      document.getElementById('prod-image-data').value = product.image;
      const preview = document.getElementById('image-preview');
      preview.src = resolveImagePath(product.image);
      preview.style.display = 'block';
    }
  } else {
    title.innerHTML = '<i class="fas fa-plus" style="color:var(--gold-primary); margin-right:8px;"></i> Add New Product';
    saveLabel.textContent = 'Save Product';
  }

  modal.classList.add('active');
}

function closeProductForm() {
  document.getElementById('product-form-modal').classList.remove('active');
}

function openEditProduct(id) {
  const product = SheGlowsStore.getProduct(id);
  if (!product) return toast('Product not found.', 'error');
  openProductForm(product);
}

function saveProduct() {
  const id = document.getElementById('edit-product-id').value;
  const title = document.getElementById('prod-title').value.trim();
  const category = document.getElementById('prod-category').value;
  const price = parseInt(document.getElementById('prod-price').value, 10);
  const mrp = parseInt(document.getElementById('prod-mrp').value, 10);
  const tag = document.getElementById('prod-tag').value.trim();
  const inStock = document.getElementById('prod-stock').value === 'true';
  const rating = parseFloat(document.getElementById('prod-rating').value) || 4.5;
  const reviews = parseInt(document.getElementById('prod-reviews').value, 10) || 0;
  const description = document.getElementById('prod-desc').value.trim();
  const imageData = document.getElementById('prod-image-data').value;

  // Validation
  if (!title) return toast('Product title is required.', 'error');
  if (!category) return toast('Please select a category.', 'error');
  if (!price || price < 1) return toast('Valid selling price is required.', 'error');
  if (!mrp || mrp < 1) return toast('Valid MRP is required.', 'error');

  // Calculate discount
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const discount = discountPct > 0 ? `${discountPct}% OFF` : '';

  const productData = {
    title, category, price, mrp, discount, tag, inStock,
    rating, reviews, description,
    image: imageData || `images/cat_${category}.png`
  };

  if (id) {
    // Update existing
    SheGlowsStore.updateProduct(id, productData);
    toast('✅ Product updated successfully!', 'success');
  } else {
    // Add new
    SheGlowsStore.addProduct(productData);
    toast('✅ Product added successfully!', 'success');
  }

  closeProductForm();
  renderAllProducts();
  renderRecentProducts();
  renderStats();
}

/* ── Image upload handler ── */

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast('Image must be under 2MB.', 'error');
    event.target.value = '';
    return;
  }

  // Validate type
  if (!file.type.startsWith('image/')) {
    toast('Only image files are allowed.', 'error');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    document.getElementById('prod-image-data').value = dataUrl;
    const preview = document.getElementById('image-preview');
    preview.src = dataUrl;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/* ── Delete Product ── */

let _pendingDeleteId = null;

function confirmDeleteProduct(id, title) {
  _pendingDeleteId = id;
  document.getElementById('confirm-title').textContent = 'Delete Product?';
  document.getElementById('confirm-message').textContent = `"${title}" will be permanently removed.`;
  document.getElementById('confirm-action-btn').onclick = doDeleteProduct;
  document.getElementById('confirm-dialog').classList.add('active');
}

function doDeleteProduct() {
  if (_pendingDeleteId) {
    SheGlowsStore.deleteProduct(_pendingDeleteId);
    toast('🗑️ Product deleted.', 'success');
    _pendingDeleteId = null;
    closeConfirm();
    renderAllProducts();
    renderRecentProducts();
    renderStats();
  }
}

/* ── Data export/import/reset ── */

function exportProducts() {
  const json = SheGlowsStore.exportData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sheglows_products_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('📦 Data exported successfully!', 'success');
}

function importProducts(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const ok = SheGlowsStore.importData(e.target.result);
    if (ok) {
      toast('📥 Data imported successfully!', 'success');
      renderAllProducts();
      renderRecentProducts();
      renderStats();
    } else {
      toast('Invalid JSON file.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function confirmResetData() {
  document.getElementById('confirm-title').textContent = 'Reset All Data?';
  document.getElementById('confirm-message').textContent = 'All products will be reverted to defaults. This cannot be undone.';
  document.getElementById('confirm-action-btn').onclick = () => {
    localStorage.removeItem('sheglows_products');
    localStorage.removeItem('sheglows_categories');
    SheGlowsStore.init();
    closeConfirm();
    renderAllProducts();
    renderRecentProducts();
    renderStats();
    toast('🔄 Data reset to defaults.', 'success');
  };
  document.getElementById('confirm-dialog').classList.add('active');
}

/* ── Change password ── */

async function handleChangePassword() {
  const current = document.getElementById('current-pw').value;
  const newPw = document.getElementById('new-pw').value;
  const confirm = document.getElementById('confirm-pw').value;

  if (!current || !newPw) return toast('All password fields are required.', 'error');
  if (newPw !== confirm) return toast('New passwords do not match.', 'error');
  if (newPw.length < 8) return toast('New password must be at least 8 characters.', 'error');

  const result = await SheGlowsAuth.changePassword(current, newPw);
  if (result.ok) {
    toast('✅ Password updated. Redirecting to login…', 'success');
    SheGlowsAuth.logout();
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  } else {
    toast(result.msg, 'error');
  }
}

/* ── Logout ── */

function doLogout() {
  SheGlowsAuth.logout();
  window.location.href = 'login.html';
}

/* ── Confirm dialog ── */

function closeConfirm() {
  document.getElementById('confirm-dialog').classList.remove('active');
}

/* ── Toast notification ── */

function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  container.appendChild(el);
  setTimeout(() => { el.remove(); }, 3200);
}

/* ── Mobile sidebar toggle ── */

function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
}
