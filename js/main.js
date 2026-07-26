/* ==========================================================================
   She Glows - Storefront App Logic (Refactored to use SheGlowsStore)
   Direct WhatsApp Integration (WhatsApp: 6239285798)
   ========================================================================== */

// App State
let currentWishlistCount = 0;
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  renderProducts('all');
  setupFilterTabs();
  setupSearchFilter();
  setupModalEvents();
  animateOnScroll();
});

// ── Render Product Grid (reads from shared store) ──

function renderProducts(categoryFilter = 'all') {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  const filtered = SheGlowsStore.getByCategory(categoryFilter)
    .filter(p => p.inStock !== false);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 2.5rem; color: var(--gold-primary); margin-bottom: 1rem; display:block;"></i>
        <h3 style="font-family: 'Cinzel'; color: var(--text-light);">No items found in this category</h3>
        <p>Explore our other handcrafted collections or search via WhatsApp.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prod => `
    <div class="product-card" data-category="${prod.category}">
      <div class="product-image-box">
        <span class="product-tag">${prod.tag}</span>
        <button class="wishlist-heart-btn" onclick="toggleWishlist(this, '${prod.id}')" title="Add to Wishlist">
          <i class="far fa-heart"></i>
        </button>
        <img src="${prod.image}" alt="${prod.title}" loading="lazy">
        <button class="quick-view-overlay-btn" onclick="openQuickView('${prod.id}')">
          <i class="fas fa-eye"></i> Quick View & Order
        </button>
      </div>
      <div class="product-content">
        <span class="product-category-sub">${prod.category}</span>
        <h3 class="product-title">${prod.title}</h3>
        <div class="rating-row">
          <span class="stars">${'★'.repeat(Math.round(prod.rating || 5))}${'☆'.repeat(5 - Math.round(prod.rating || 5))}</span>
          <span class="rating-count">${prod.rating || 5} (${prod.reviews || 0} reviews)</span>
        </div>
        <div class="price-row">
          <span class="price-current">₹${prod.price.toLocaleString('en-IN')}</span>
          <span class="price-mrp">₹${prod.mrp.toLocaleString('en-IN')}</span>
          <span class="price-discount">${prod.discount}</span>
        </div>
        <a href="${SheGlowsStore.getWhatsAppLink(prod.title, prod.price, prod.id)}" 
           target="_blank" 
           rel="noopener" 
           class="btn-book-wa">
          <i class="fab fa-whatsapp"></i> Book on WhatsApp
        </a>
      </div>
    </div>
  `).join('');
}

// ── Filter Tabs ──

function setupFilterTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const cat = e.target.getAttribute('data-tab');
      activeCategory = cat;
      renderProducts(cat);
    });
  });
}

// ── Live Search (reads from shared store) ──

function setupSearchFilter() {
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-results-dropdown');
  if (!searchInput || !searchDropdown) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 2) {
      searchDropdown.classList.remove('active');
      return;
    }

    const matches = SheGlowsStore.search(query);

    if (matches.length > 0) {
      searchDropdown.innerHTML = matches.slice(0, 5).map(item => `
        <div class="search-result-item" onclick="openQuickView('${item.id}'); hideSearchDropdown();">
          <img src="${item.image}" alt="${item.title}" class="search-result-thumb">
          <div>
            <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-light);">${item.title}</div>
            <div style="font-size: 0.75rem; color: var(--gold-secondary);">₹${item.price.toLocaleString('en-IN')}</div>
          </div>
        </div>
      `).join('');
      searchDropdown.classList.add('active');
    } else {
      searchDropdown.innerHTML = `
        <div style="padding: 12px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">
          No matching jewellery found.
        </div>
      `;
      searchDropdown.classList.add('active');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      hideSearchDropdown();
    }
  });
}

function hideSearchDropdown() {
  const d = document.getElementById('search-results-dropdown');
  if (d) d.classList.remove('active');
}

// ── Quick View Modal ──

function openQuickView(productId) {
  const prod = SheGlowsStore.getProduct(productId);
  if (!prod) return;

  const modal = document.getElementById('quick-view-modal');
  if (!modal) return;

  document.getElementById('modal-img').src = prod.image;
  document.getElementById('modal-title').textContent = prod.title;
  document.getElementById('modal-price').textContent = `₹${prod.price.toLocaleString('en-IN')} (MRP: ₹${prod.mrp.toLocaleString('en-IN')})`;
  document.getElementById('modal-desc').textContent = prod.description;
  document.getElementById('modal-wa-btn').href = SheGlowsStore.getWhatsAppLink(prod.title, prod.price, prod.id);

  const notesField = modal.querySelector('.modal-notes-field');
  if (notesField) notesField.value = '';

  modal.classList.add('active');
}

function setupModalEvents() {
  const modal = document.getElementById('quick-view-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => { if (modal) modal.classList.remove('active'); });
  }
  if (modal) {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  }
}

// ── Wishlist Toggle ──

function toggleWishlist(btn, productId) {
  const icon = btn.querySelector('i');
  btn.classList.toggle('active');
  if (btn.classList.contains('active')) {
    icon.classList.remove('far');
    icon.classList.add('fas');
    currentWishlistCount++;
  } else {
    icon.classList.remove('fas');
    icon.classList.add('far');
    currentWishlistCount = Math.max(0, currentWishlistCount - 1);
  }
  const badge = document.getElementById('wishlist-count-badge');
  if (badge) badge.textContent = currentWishlistCount;
}

// ── Mobile Nav Toggle ──

function toggleMobileNav() {
  const catNav = document.querySelector('.category-nav-bar');
  if (catNav) {
    catNav.style.display = catNav.style.display === 'block' ? 'none' : 'block';
  }
}

// ── Filter by category (called from category cards) ──

function filterByCategory(catName) {
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${catName}"]`);
  if (tabBtn) {
    tabBtn.click();
  } else {
    // If no matching tab, just render products for that category
    renderProducts(catName);
  }
  const section = document.getElementById('products-section');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ── Scroll-reveal animation ──

function animateOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.category-card, .product-card, .feature-box, .testimonial-card').forEach(el => {
    el.classList.add('scroll-reveal');
    observer.observe(el);
  });
}
