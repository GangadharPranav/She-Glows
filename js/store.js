/* ==========================================================================
   She Glows - Product Data Store (localStorage CRUD Layer)
   Shared across storefront & admin panel.
   ========================================================================== */

const SheGlowsStore = (() => {
  const STORAGE_KEY = 'sheglows_products';
  const CATEGORIES_KEY = 'sheglows_categories';

  // Default seed products (used on first load if localStorage is empty)
  const DEFAULT_PRODUCTS = [
    {
      id: 'sg-jhumki-01',
      title: 'Royal Antique Kundan Pearl Jhumki',
      category: 'jhumkis',
      price: 1499,
      mrp: 2999,
      discount: '50% OFF',
      rating: 4.9,
      reviews: 128,
      tag: 'Bestseller',
      image: 'images/cat_jhumkis.png',
      description: 'Handcrafted royal Kundan Jhumki with ruby red accents and natural freshwater pearl drops. 22K gold micro-plated for anti-tarnish shine.',
      inStock: true,
      createdAt: Date.now()
    },
    {
      id: 'sg-earring-02',
      title: 'Sparkling Emerald Zircon Drop Earrings',
      category: 'earrings',
      price: 1899,
      mrp: 3499,
      discount: '45% OFF',
      rating: 5.0,
      reviews: 94,
      tag: 'Trending',
      image: 'images/cat_earrings.png',
      description: 'High-grade AAA Cubic Zirconia drop earrings with deep emerald green solitaire centerpiece. Ideal for weddings and evening galas.',
      inStock: true,
      createdAt: Date.now()
    },
    {
      id: 'sg-kada-03',
      title: 'Temple Design Gold Plated Kada Pair',
      category: 'kadas',
      price: 2299,
      mrp: 4299,
      discount: '46% OFF',
      rating: 4.8,
      reviews: 86,
      tag: 'Royal Heritage',
      image: 'images/cat_kadas.png',
      description: 'Exquisite Temple architecture inspired openable Kada bangles with intricate floral motif carving and premium gold polish.',
      inStock: true,
      createdAt: Date.now()
    },
    {
      id: 'sg-bracelet-04',
      title: 'Sleek Diamond Cuff Bangle Bracelet',
      category: 'bracelets',
      price: 1299,
      mrp: 2499,
      discount: '48% OFF',
      rating: 4.9,
      reviews: 110,
      tag: 'Under ₹1499',
      image: 'images/cat_bracelets.png',
      description: 'Modern luxury rose gold cuff bracelet featuring brilliant cut Zircon accents. Flexible fit for all wrist sizes.',
      inStock: true,
      createdAt: Date.now()
    },
    {
      id: 'sg-kashmiri-05',
      title: 'Authentic Kashmiri Dejhoor & Ear Chains',
      category: 'kashmiri',
      price: 2699,
      mrp: 4999,
      discount: '46% OFF',
      rating: 5.0,
      reviews: 72,
      tag: 'Exclusive',
      image: 'images/cat_kashmiri.png',
      description: 'Traditional Kashmiri bridal Dejhoor ear chains set with gold filigree work and cascading pearl strings.',
      inStock: true,
      createdAt: Date.now()
    },
    {
      id: 'sg-chain-06',
      title: 'Solitaire Crystal Layered Gold Chain',
      category: 'chains',
      price: 899,
      mrp: 1799,
      discount: '50% OFF',
      rating: 4.7,
      reviews: 156,
      tag: 'Under ₹999',
      image: 'images/cat_chains.png',
      description: 'Delicate dual-layered 18K gold-plated chain with a shimmering solitaire crystal drop.',
      inStock: true,
      createdAt: Date.now()
    },
    {
      id: 'sg-trending-07',
      title: 'Royal Ruby Bridal Choker Necklace Set',
      category: 'trending',
      price: 3499,
      mrp: 6999,
      discount: '50% OFF',
      rating: 5.0,
      reviews: 215,
      tag: 'Bridal Pick',
      image: 'images/cat_trending.png',
      description: 'Grand royal Kundan choker set encrusted with deep ruby stones and hanging pearl cluster matching jhumkis.',
      inStock: true,
      createdAt: Date.now()
    },
    {
      id: 'sg-jhumki-08',
      title: 'Peacock Motif Oxidized Silver Jhumki',
      category: 'jhumkis',
      price: 799,
      mrp: 1599,
      discount: '50% OFF',
      rating: 4.8,
      reviews: 142,
      tag: 'Under ₹999',
      image: 'images/cat_jhumkis.png',
      description: 'Traditional handcrafted oxidized silver Jhumki featuring detailed peacock engraving and dangling beads.',
      inStock: true,
      createdAt: Date.now()
    }
  ];

  const DEFAULT_CATEGORIES = [
    { id: 'earrings', name: 'Earrings', image: 'images/cat_earrings.png' },
    { id: 'jhumkis', name: 'Jhumkis', image: 'images/cat_jhumkis.png' },
    { id: 'bracelets', name: 'Bracelets', image: 'images/cat_bracelets.png' },
    { id: 'kadas', name: 'Kadas', image: 'images/cat_kadas.png' },
    { id: 'chains', name: 'Chains', image: 'images/cat_chains.png' },
    { id: 'kashmiri', name: 'Kashmiri Jewellery', image: 'images/cat_kashmiri.png' },
    { id: 'trending', name: 'Trending Jewellery', image: 'images/cat_trending.png' }
  ];

  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return fallback;
    }
  }

  function _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage write failed:', e);
      return false;
    }
  }

  /** Initialise store — seeds defaults on first visit */
  function init() {
    if (!_read(STORAGE_KEY)) {
      _write(STORAGE_KEY, DEFAULT_PRODUCTS);
    }
    if (!_read(CATEGORIES_KEY)) {
      _write(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    }
  }

  /** Returns all products (array) */
  function getAllProducts() {
    return _read(STORAGE_KEY) || DEFAULT_PRODUCTS;
  }

  /** Get single product by ID */
  function getProduct(id) {
    return getAllProducts().find(p => p.id === id) || null;
  }

  /** Filter products by category */
  function getByCategory(cat) {
    if (cat === 'all') return getAllProducts();
    if (cat === 'under999') return getAllProducts().filter(p => p.price <= 999);
    return getAllProducts().filter(p => p.category === cat);
  }

  /** Search products by query string */
  function search(query) {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    return getAllProducts().filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tag && p.tag.toLowerCase().includes(q))
    );
  }

  /** Add a new product */
  function addProduct(product) {
    const products = getAllProducts();
    product.id = product.id || 'sg-' + Date.now();
    product.createdAt = Date.now();
    // Sanitise text fields against XSS
    product.title = _sanitize(product.title);
    product.description = _sanitize(product.description);
    product.tag = _sanitize(product.tag || '');
    products.push(product);
    return _write(STORAGE_KEY, products);
  }

  /** Update existing product */
  function updateProduct(id, updates) {
    const products = getAllProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    // Sanitise text fields
    if (updates.title) updates.title = _sanitize(updates.title);
    if (updates.description) updates.description = _sanitize(updates.description);
    if (updates.tag) updates.tag = _sanitize(updates.tag);
    products[idx] = { ...products[idx], ...updates, updatedAt: Date.now() };
    return _write(STORAGE_KEY, products);
  }

  /** Delete product by ID */
  function deleteProduct(id) {
    const products = getAllProducts().filter(p => p.id !== id);
    return _write(STORAGE_KEY, products);
  }

  /** Get all categories */
  function getCategories() {
    return _read(CATEGORIES_KEY) || DEFAULT_CATEGORIES;
  }

  /** Get store stats for admin dashboard */
  function getStats() {
    const products = getAllProducts();
    const cats = getCategories();
    const totalValue = products.reduce((s, p) => s + p.price, 0);
    const avgPrice = products.length ? Math.round(totalValue / products.length) : 0;
    const inStock = products.filter(p => p.inStock !== false).length;
    return {
      totalProducts: products.length,
      totalCategories: cats.length,
      avgPrice,
      inStock,
      outOfStock: products.length - inStock
    };
  }

  /** Basic XSS sanitizer — strips HTML tags */
  function _sanitize(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Export a JSON backup of all data */
  function exportData() {
    return JSON.stringify({
      products: getAllProducts(),
      categories: getCategories(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /** Import JSON backup */
  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.products && Array.isArray(data.products)) {
        _write(STORAGE_KEY, data.products);
      }
      if (data.categories && Array.isArray(data.categories)) {
        _write(CATEGORIES_KEY, data.categories);
      }
      return true;
    } catch {
      return false;
    }
  }

  /** WhatsApp link generator */
  function getWhatsAppLink(itemTitle, itemPrice, itemId) {
    const phone = '916239285798';
    const text = `Hi She Glows Fashion Jewellery! ✨%0AI would like to book/enquire about:%0A*Product:* ${encodeURIComponent(itemTitle)}%0A*Price:* ₹${itemPrice}%0A*Code:* ${itemId}%0A%0APlease share availability and payment options!`;
    return `https://wa.me/${phone}?text=${text}`;
  }

  return {
    init,
    getAllProducts,
    getProduct,
    getByCategory,
    search,
    addProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getStats,
    exportData,
    importData,
    getWhatsAppLink
  };
})();

// Auto-initialise when script loads
SheGlowsStore.init();
