/* ==========================================
   ONLINE-SHOP-UGANDA - Main JavaScript Application
   Uganda's #1 Fashion Marketplace
   ========================================== */

// API Base URL
const API_URL = '';

// State
let currentUser = null;
let products = [];
let categories = [];
let currentPage = 'home';
let editingProductId = null;
let favorites = []; // Store favorite product IDs

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    // Check for saved user session
    const savedUser = localStorage.getItem('onlineshopug_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
    
    // Load favorites from localStorage
    loadFavorites();

    // Load initial data
    await loadCategories();
    
    // Navigate to home page
    navigateTo('home');
    
    // Hide loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 500);
    
    // Setup search listener
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('active');
        }
    });
}

// ==========================================
// NAVIGATION
// ==========================================

function navigateTo(page, data = null) {
    currentPage = page;
    const main = document.getElementById('mainContent');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    switch (page) {
        case 'home':
            renderHomePage();
            break;
        case 'categories':
            renderCategoriesPage();
            break;
        case 'product':
            renderProductPage(data);
            break;
        case 'favorites':
            renderFavoritesPage();
            break;
        case 'my-listings':
            if (!currentUser) {
                openModal('authModal');
                return;
            }
            renderMyListingsPage();
            break;
        case 'about':
            renderAboutPage();
            break;
        case 'contact':
            renderContactPage();
            break;
        default:
            renderHomePage();
    }
}

// ==========================================
// API FUNCTIONS
// ==========================================

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadCategories() {
    try {
        categories = await fetchAPI('/api/categories');
    } catch (error) {
        console.error('Failed to load categories:', error);
        categories = [
            { id: 'dresses', name: 'Dresses', icon: '👗' },
            { id: 'shirts', name: 'Shirts & Tops', icon: '👔' },
            { id: 'pants', name: 'Pants & Jeans', icon: '👖' },
            { id: 'shoes', name: 'Shoes', icon: '👟' },
            { id: 'jackets', name: 'Jackets & Coats', icon: '🧥' },
            { id: 'accessories', name: 'Accessories', icon: '👜' },
            { id: 'traditional', name: 'Traditional Wear', icon: '🥻' },
            { id: 'sportswear', name: 'Sportswear', icon: '🏃' },
            { id: 'kids', name: 'Kids Fashion', icon: '👶' },
            { id: 'other', name: 'Other', icon: '🛍️' }
        ];
    }
}

async function loadProducts(filters = {}) {
    try {
        const params = new URLSearchParams(filters).toString();
        products = await fetchAPI(`/api/products?${params}`);
        return products;
    } catch (error) {
        console.error('Failed to load products:', error);
        return [];
    }
}

// ==========================================
// HOME PAGE
// ==========================================

async function renderHomePage() {
    const main = document.getElementById('mainContent');
    
    // Load products
    await loadProducts();
    
    // Get stats
    let stats = { totalProducts: products.length, totalSellers: 0, totalViews: 0 };
    try {
        stats = await fetchAPI('/api/stats');
    } catch (e) {}
    
    main.innerHTML = `
        <!-- Hero Section -->
        <section class="hero">
            <!-- Floating Fashion Items -->
            <div class="floating-items">
                <span class="float-item" style="top: 15%; left: 5%; animation-delay: 0s;">👗</span>
                <span class="float-item" style="top: 60%; left: 8%; animation-delay: 1s;">👠</span>
                <span class="float-item" style="top: 25%; right: 8%; animation-delay: 0.5s;">👜</span>
                <span class="float-item" style="top: 70%; right: 5%; animation-delay: 1.5s;">🧥</span>
                <span class="float-item" style="top: 40%; left: 3%; animation-delay: 2s;">👒</span>
                <span class="float-item" style="bottom: 15%; right: 10%; animation-delay: 0.8s;">💎</span>
            </div>
            
            <div class="container">
                <div class="hero-content">
                    <div class="hero-text">
                        <div class="hero-badge">
                            <span>🔥 Uganda's #1 Fashion Marketplace</span>
                        </div>
                        <h1>
                            Discover Amazing
                            <span>Fashion Deals ✨</span>
                        </h1>
                        <p>Buy and sell clothes, shoes, bags, and accessories. Join thousands of Ugandans trading fashion on Online Shop Uganda - your style, your price!</p>
                        <div class="hero-buttons">
                            <button class="btn btn-secondary" onclick="scrollToProducts()">
                                <i class="fas fa-search"></i> Browse Items
                            </button>
                            <button class="btn btn-primary" onclick="checkAuthAndPost()">
                                <i class="fas fa-plus"></i> Sell Your Clothes
                            </button>
                        </div>
                        <div class="hero-stats">
                            <div class="stat-item">
                                <h3>${stats.totalProducts}+</h3>
                                <p>Items Listed</p>
                            </div>
                            <div class="stat-item">
                                <h3>${stats.totalSellers}+</h3>
                                <p>Active Sellers</p>
                            </div>
                            <div class="stat-item">
                                <h3>${stats.totalViews}+</h3>
                                <p>Happy Buyers</p>
                            </div>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="hero-showcase">
                            <div class="showcase-main">
                                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=350&h=450&fit=crop" alt="Fashion Shopping">
                                <div class="showcase-tag">New Arrivals</div>
                            </div>
                            <div class="showcase-side">
                                <div class="showcase-item">
                                    <img src="https://images.unsplash.com/photo-1560243563-062bfc001d68?w=200&h=200&fit=crop" alt="Dresses">
                                    <span>Dresses</span>
                                </div>
                                <div class="showcase-item">
                                    <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=200&fit=crop" alt="Bags">
                                    <span>Bags</span>
                                </div>
                                <div class="showcase-item">
                                    <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop" alt="Shoes">
                                    <span>Shoes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Categories Section -->
        <section class="categories-section">
            <div class="container">
                <div class="section-header">
                    <h2>🏷️ Shop by Category</h2>
                    <a href="#" onclick="navigateTo('categories'); return false;">
                        View All <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                <div class="categories-grid">
                    ${categories.map(cat => `
                        <div class="category-card" onclick="filterByCategory('${cat.id}')">
                            <div class="icon">${cat.icon}</div>
                            <h3>${cat.name}</h3>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- Products Section -->
        <section class="products-section" id="productsSection">
            <div class="container">
                <div class="section-header">
                    <h2>🔥 Latest Items</h2>
                </div>
                
                <!-- Filter Bar -->
                <div class="filter-bar">
                    <div class="filter-group">
                        <label><i class="fas fa-folder"></i> Category:</label>
                        <select id="filterCategory" onchange="applyFilters()">
                            <option value="all">All Categories</option>
                            ${categories.map(cat => `
                                <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label><i class="fas fa-ruler"></i> Size:</label>
                        <select id="filterSize" onchange="applyFilters()">
                            <option value="all">All Sizes</option>
                            <option value="XS">XS (Extra Small)</option>
                            <option value="S">S (Small)</option>
                            <option value="M">M (Medium)</option>
                            <option value="L">L (Large)</option>
                            <option value="XL">XL (Extra Large)</option>
                            <option value="XXL">XXL</option>
                            <option value="Free Size">Free Size</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label><i class="fas fa-star"></i> Condition:</label>
                        <select id="filterCondition" onchange="applyFilters()">
                            <option value="all">Any Condition</option>
                            <option value="new">🏷️ New (with tags)</option>
                            <option value="like-new">✨ Like New</option>
                            <option value="good">👍 Good</option>
                            <option value="fair">👌 Fair</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label><i class="fas fa-sort"></i> Sort By:</label>
                        <select id="filterSort" onchange="applyFilters()">
                            <option value="newest">🆕 Newest First</option>
                            <option value="price-low">💰 Price: Low to High</option>
                            <option value="price-high">💎 Price: High to Low</option>
                        </select>
                    </div>
                    <button class="btn-clear-filters" onclick="clearFilters()">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
                
                <!-- Active Filters Display -->
                <div class="active-filters" id="activeFilters"></div>

                <!-- Products Grid -->
                <div class="products-grid" id="productsGrid">
                    ${renderProductCards(products)}
                </div>
            </div>
        </section>
    `;
}

function renderProductCards(productList) {
    if (!productList || productList.length === 0) {
        return `
            <div class="empty-state">
                <i class="fas fa-tshirt"></i>
                <h3>No items found</h3>
                <p>Be the first to list an item for sale!</p>
                <button class="btn btn-primary" onclick="checkAuthAndPost()">
                    <i class="fas fa-plus"></i> Post an Item
                </button>
            </div>
        `;
    }
    
    return productList.map(product => {
        const isNew = isRecentlyPosted(product.createdAt);
        const status = product.status || 'available';
        return `
        <div class="product-card ${status === 'sold' ? 'sold-item' : ''}" onclick="viewProduct('${product.id}')">
            <div class="product-image">
                <img src="${product.images[0] || 'https://via.placeholder.com/300x300?text=No+Image'}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                ${isNew ? '<span class="new-arrival-badge"><i class="fas fa-bolt"></i> NEW</span>' : ''}
                <span class="product-badge ${product.condition !== 'new' ? 'used' : ''}">
                    ${product.condition === 'new' ? 'Brand New' : product.condition}
                </span>
                <span class="status-badge ${status}">
                    ${status === 'sold' ? '<i class="fas fa-check-circle"></i> SOLD' : '<i class="fas fa-tag"></i> Available'}
                </span>
                <button class="product-wishlist ${isInFavorites(product.id) ? 'active' : ''}" 
                        data-product-id="${product.id}"
                        onclick="event.stopPropagation(); toggleWishlist('${product.id}')">
                    <i class="${isInFavorites(product.id) ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-meta">
                    <span><i class="fas fa-ruler"></i> ${product.size}</span>
                    <span><i class="fas fa-palette"></i> ${product.color || 'Various'}</span>
                </div>
                <div class="product-date">
                    <i class="fas fa-calendar-alt"></i> Posted ${formatDateRelative(product.createdAt)}
                </div>
                <div class="product-price">
                    <span class="price">UGX ${formatPrice(product.price)}</span>
                    <span class="location">
                        <i class="fas fa-map-marker-alt"></i> ${product.location}
                    </span>
                </div>
            </div>
        </div>
    `}).join('');
}

function scrollToProducts() {
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
}

async function applyFilters() {
    const category = document.getElementById('filterCategory')?.value || 'all';
    const size = document.getElementById('filterSize')?.value || 'all';
    const condition = document.getElementById('filterCondition')?.value || 'all';
    const sortBy = document.getElementById('filterSort')?.value || 'newest';
    
    console.log('Applying filters:', { category, size, condition, sortBy });
    
    const filters = {};
    if (category && category !== 'all') filters.category = category;
    if (size && size !== 'all') filters.size = size;
    if (condition && condition !== 'all') filters.condition = condition;
    if (sortBy && sortBy !== 'newest') filters.sortBy = sortBy;
    
    try {
        const filteredProducts = await loadProducts(filters);
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = renderProductCards(filteredProducts);
            
            // Show filter results message
            const count = filteredProducts.length;
            showToast(`Found ${count} item${count !== 1 ? 's' : ''} matching your filters`, 'success');
        }
    } catch (error) {
        console.error('Filter error:', error);
        showToast('Error applying filters', 'error');
    }
}

function filterByCategory(categoryId) {
    navigateTo('home');
    setTimeout(() => {
        const filterSelect = document.getElementById('filterCategory');
        if (filterSelect) {
            filterSelect.value = categoryId;
            applyFilters();
            scrollToProducts();
        }
    }, 100);
}

function clearFilters() {
    const filterCategory = document.getElementById('filterCategory');
    const filterSize = document.getElementById('filterSize');
    const filterCondition = document.getElementById('filterCondition');
    const filterSort = document.getElementById('filterSort');
    
    if (filterCategory) filterCategory.value = 'all';
    if (filterSize) filterSize.value = 'all';
    if (filterCondition) filterCondition.value = 'all';
    if (filterSort) filterSort.value = 'newest';
    
    // Reload all products
    loadProducts({}).then(allProducts => {
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = renderProductCards(allProducts);
            showToast('Filters cleared! Showing all items', 'success');
        }
    });
}

function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
    
    const category = document.getElementById('filterCategory')?.value;
    const size = document.getElementById('filterSize')?.value;
    const condition = document.getElementById('filterCondition')?.value;
    
    let tags = [];
    
    if (category && category !== 'all') {
        const catName = categories.find(c => c.id === category)?.name || category;
        tags.push(`<span class="filter-tag">${catName} <button onclick="document.getElementById('filterCategory').value='all'; applyFilters();">×</button></span>`);
    }
    if (size && size !== 'all') {
        tags.push(`<span class="filter-tag">Size: ${size} <button onclick="document.getElementById('filterSize').value='all'; applyFilters();">×</button></span>`);
    }
    if (condition && condition !== 'all') {
        tags.push(`<span class="filter-tag">${capitalizeFirst(condition)} <button onclick="document.getElementById('filterCondition').value='all'; applyFilters();">×</button></span>`);
    }
    
    container.innerHTML = tags.join('');
}

async function performSearch(isMobile = false) {
    const searchInput = isMobile 
        ? document.getElementById('mobileSearchInput')
        : document.getElementById('searchInput');
    
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    navigateTo('home');
    
    setTimeout(async () => {
        const searchedProducts = await loadProducts({ search: query });
        document.getElementById('productsGrid').innerHTML = renderProductCards(searchedProducts);
        scrollToProducts();
    }, 100);
    
    closeMobileMenu();
}

// ==========================================
// PRODUCT DETAIL PAGE
// ==========================================

async function viewProduct(productId) {
    navigateTo('product', productId);
}

async function renderProductPage(productId) {
    const main = document.getElementById('mainContent');
    
    // Show loading
    main.innerHTML = `
        <div class="product-detail">
            <div class="container">
                <div style="text-align: center; padding: 100px;">
                    <div class="loader-spinner"></div>
                    <p>Loading product...</p>
                </div>
            </div>
        </div>
    `;
    
    try {
        // Increment view count
        await fetchAPI(`/api/products/${productId}/view`, { method: 'POST' });
        
        // Get product details
        const product = await fetchAPI(`/api/products/${productId}`);
        
        main.innerHTML = `
            <section class="product-detail">
                <div class="container">
                    <div class="detail-top-bar">
                        <button class="btn btn-secondary" onclick="navigateTo('home')">
                            <i class="fas fa-arrow-left"></i> Back to Shop
                        </button>
                        <button class="btn-favorite-large ${isInFavorites(product.id) ? 'active' : ''}" 
                                onclick="toggleWishlist('${product.id}'); updateDetailFavoriteBtn(this);">
                            <i class="${isInFavorites(product.id) ? 'fas' : 'far'} fa-heart"></i>
                            <span>${isInFavorites(product.id) ? 'Saved to Favorites' : 'Add to Favorites'}</span>
                        </button>
                    </div>
                    
                    <div class="product-detail-grid">
                        <!-- Gallery -->
                        <div class="product-gallery">
                            <div class="main-image">
                                <img id="mainProductImage" 
                                     src="${product.images[0] || 'https://via.placeholder.com/500x500?text=No+Image'}" 
                                     alt="${product.name}">
                            </div>
                            ${product.images.length > 1 ? `
                                <div class="gallery-thumbs">
                                    ${product.images.map((img, i) => `
                                        <img src="${img}" alt="Thumbnail ${i+1}" 
                                             class="${i === 0 ? 'active' : ''}"
                                             onclick="changeMainImage('${img}', this)">
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Info -->
                        <div class="product-detail-info">
                            <h1>${product.name}</h1>
                            <div class="detail-price">UGX ${formatPrice(product.price)}</div>
                            
                            <div class="detail-meta">
                                <div class="meta-item">
                                    <i class="fas fa-folder"></i>
                                    ${getCategoryName(product.category)}
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-ruler"></i>
                                    Size: ${product.size}
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-palette"></i>
                                    ${product.color || 'Various'}
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-star"></i>
                                    ${capitalizeFirst(product.condition)}
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${product.location}
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-eye"></i>
                                    ${product.views || 0} views
                                </div>
                            </div>
                            
                            <div class="detail-description">
                                <h3>Description</h3>
                                <p>${product.description || 'No description provided.'}</p>
                            </div>
                            
                            <!-- Contact Buttons -->
                            <div class="contact-buttons">
                                ${product.whatsapp || product.phone ? `
                                    <a href="https://wa.me/${formatPhoneForWhatsApp(product.whatsapp || product.phone)}?text=${encodeURIComponent(`Hello! 👋 I am interested in this item:\n\n📦 *${product.name}*\n💰 Price: UGX ${formatPrice(product.price)}\n📍 Location: ${product.location}\n\nIs it still available?`)}" 
                                       target="_blank" class="contact-btn whatsapp">
                                        <i class="fab fa-whatsapp"></i>
                                        Chat on WhatsApp
                                    </a>
                                ` : ''}
                                
                                ${product.phone ? `
                                    <a href="tel:${product.phone}" class="contact-btn call">
                                        <i class="fas fa-phone"></i>
                                        Call Seller
                                    </a>
                                ` : ''}
                                
                                <button class="contact-btn delivery" onclick="requestDelivery('${product.id}')">
                                    <i class="fas fa-truck"></i>
                                    Request Delivery
                                </button>
                            </div>
                            
                            <!-- Seller Info -->
                            ${product.seller ? `
                                <div class="seller-card">
                                    <h4>Sold by</h4>
                                    <div class="seller-info">
                                        <div class="seller-avatar">
                                            ${product.seller.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div class="seller-details">
                                            <h3>${product.seller.fullName}</h3>
                                            <p><i class="fas fa-map-marker-alt"></i> ${product.seller.location}</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </section>
        `;
    } catch (error) {
        main.innerHTML = `
            <div class="product-detail">
                <div class="container">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Product not found</h3>
                        <p>This item may have been removed or doesn't exist.</p>
                        <button class="btn btn-primary" onclick="navigateTo('home')">
                            <i class="fas fa-home"></i> Back to Home
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

function changeMainImage(src, thumb) {
    document.getElementById('mainProductImage').src = src;
    document.querySelectorAll('.gallery-thumbs img').forEach(img => img.classList.remove('active'));
    thumb.classList.add('active');
}

function updateDetailFavoriteBtn(btn) {
    const icon = btn.querySelector('i');
    const text = btn.querySelector('span');
    
    btn.classList.toggle('active');
    
    if (btn.classList.contains('active')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        text.textContent = 'Saved to Favorites';
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        text.textContent = 'Add to Favorites';
    }
}

function requestDelivery(productId) {
    // Show delivery options modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'deliveryModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeModal('deliveryModal'); this.parentElement.remove();"></div>
        <div class="modal-content delivery-modal">
            <button class="modal-close" onclick="closeModal('deliveryModal'); this.closest('.modal').remove();">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="delivery-header">
                <div class="delivery-icon">
                    <i class="fas fa-motorcycle"></i>
                </div>
                <h2>Request Delivery</h2>
                <p>Choose your preferred delivery service</p>
            </div>
            
            <div class="delivery-options">
                <a href="https://play.google.com/store/apps/details?id=com.safeboda.passenger" 
                   target="_blank" class="delivery-option safeboda">
                    <div class="delivery-option-icon">
                        <img src="https://play-lh.googleusercontent.com/2aX1X1btuEnFQOxWNHLWkY5bMC3VbqXoFS0xqBPmQCvxnaZy7xOat9SeKgNkoWVT7Q=w240-h480-rw" 
                             alt="SafeBoda" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%2300A651%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2265%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>🏍️</text></svg>'">
                    </div>
                    <div class="delivery-option-info">
                        <h3>SafeBoda</h3>
                        <p>Fast & reliable boda delivery</p>
                        <span class="delivery-badge">Recommended</span>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </a>
                
                <a href="https://play.google.com/store/apps/details?id=com.faras.rider" 
                   target="_blank" class="delivery-option faras">
                    <div class="delivery-option-icon">
                        <img src="https://play-lh.googleusercontent.com/0oqpCwzhP9sL9LKN7hH9qLxqY7Y0jqN5l1lLM4BqHZR7nHELWJx6qUDvEJQYzJfnIQ=w240-h480-rw" 
                             alt="Faras" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23FF6B00%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2265%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>🚗</text></svg>'">
                    </div>
                    <div class="delivery-option-info">
                        <h3>Faras</h3>
                        <p>Boda & car delivery options</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </a>
            </div>
            
            <div class="delivery-contact">
                <p>Or contact us for delivery assistance:</p>
                <a href="https://wa.me/256700518006?text=Hi! I need help with delivery for an item on Online Shop Uganda" 
                   target="_blank" class="btn btn-whatsapp">
                    <i class="fab fa-whatsapp"></i> Chat with Support
                </a>
            </div>
            
            <div class="delivery-note">
                <i class="fas fa-info-circle"></i>
                <span>Delivery fees are paid directly to the rider</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// ==========================================
// MY LISTINGS PAGE
// ==========================================

async function renderMyListingsPage() {
    const main = document.getElementById('mainContent');
    
    // Load user's products
    let userProducts = [];
    try {
        userProducts = await fetchAPI(`/api/sellers/${currentUser.id}/products`);
    } catch (error) {
        console.error('Failed to load user products:', error);
    }
    
    const totalViews = userProducts.reduce((sum, p) => sum + (p.views || 0), 0);
    
    main.innerHTML = `
        <section class="my-listings-page">
            <div class="container">
                <div class="page-header">
                    <h1><i class="fas fa-store"></i> My Listings</h1>
                    <button class="btn btn-primary" onclick="openModal('postItemModal')">
                        <i class="fas fa-plus"></i> Add New Item
                    </button>
                </div>
                
                <!-- Stats -->
                <div class="listings-stats">
                    <div class="stat-card">
                        <i class="fas fa-box"></i>
                        <h3>${userProducts.length}</h3>
                        <p>Total Items</p>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-eye"></i>
                        <h3>${totalViews}</h3>
                        <p>Total Views</p>
                    </div>
                    <div class="stat-card available">
                        <i class="fas fa-tag"></i>
                        <h3>${userProducts.filter(p => (p.status || 'available') === 'available').length}</h3>
                        <p>Available</p>
                    </div>
                    <div class="stat-card sold">
                        <i class="fas fa-check-circle"></i>
                        <h3>${userProducts.filter(p => p.status === 'sold').length}</h3>
                        <p>Sold</p>
                    </div>
                </div>
                
                <!-- Listings -->
                <div id="userListings">
                    ${userProducts.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <h3>No listings yet</h3>
                            <p>Start selling by posting your first item!</p>
                            <button class="btn btn-primary" onclick="openModal('postItemModal')">
                                <i class="fas fa-plus"></i> Post Your First Item
                            </button>
                        </div>
                    ` : userProducts.map(product => {
                        const status = product.status || 'available';
                        const isNew = isRecentlyPosted(product.createdAt);
                        return `
                        <div class="listing-item ${status === 'sold' ? 'sold' : ''}">
                            <div class="listing-image-wrapper">
                                <img src="${product.images[0] || 'https://via.placeholder.com/120x100?text=No+Image'}" 
                                     alt="${product.name}">
                                ${isNew ? '<span class="new-tag">NEW</span>' : ''}
                            </div>
                            <div class="listing-info">
                                <h3>${product.name}</h3>
                                <div class="price">UGX ${formatPrice(product.price)}</div>
                                <div class="meta">
                                    <i class="fas fa-eye"></i> ${product.views || 0} views • 
                                    <i class="fas fa-calendar"></i> Posted ${formatDateRelative(product.createdAt)}
                                </div>
                                <div class="listing-status ${status}">
                                    <i class="fas ${status === 'sold' ? 'fa-check-circle' : 'fa-tag'}"></i>
                                    ${status === 'sold' ? 'SOLD' : 'Available'}
                                </div>
                            </div>
                            <div class="listing-actions">
                                <button class="btn-status ${status}" onclick="toggleProductStatus('${product.id}', '${status}')" title="${status === 'sold' ? 'Mark as Available' : 'Mark as Sold'}">
                                    <i class="fas ${status === 'sold' ? 'fa-undo' : 'fa-check'}"></i>
                                    ${status === 'sold' ? 'Relist' : 'Mark Sold'}
                                </button>
                                <button class="btn-edit" onclick="editProduct('${product.id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        </section>
    `;
}

async function toggleProductStatus(productId, currentStatus) {
    const newStatus = currentStatus === 'sold' ? 'available' : 'sold';
    
    try {
        await fetchAPI(`/api/products/${productId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });
        
        showToast(`Item marked as ${newStatus}!`, 'success');
        renderMyListingsPage();
    } catch (error) {
        showToast('Failed to update status', 'error');
    }
}

async function editProduct(productId) {
    try {
        const product = await fetchAPI(`/api/products/${productId}`);
        editingProductId = productId;
        
        // Fill form with product data
        const form = document.getElementById('postItemForm');
        form.elements.name.value = product.name;
        form.elements.category.value = product.category;
        form.elements.size.value = product.size;
        form.elements.color.value = product.color || '';
        form.elements.condition.value = product.condition;
        form.elements.price.value = product.price;
        form.elements.location.value = product.location;
        form.elements.description.value = product.description || '';
        form.elements.phone.value = product.phone || '';
        form.elements.whatsapp.value = product.whatsapp || '';
        
        // Show existing images
        const previews = document.getElementById('imagePreviews');
        previews.innerHTML = product.images.map((img, i) => `
            <div class="preview-item">
                <img src="${img}" alt="Preview ${i+1}">
            </div>
        `).join('');
        
        openModal('postItemModal');
    } catch (error) {
        showToast('Failed to load product details', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        await fetchAPI(`/api/products/${productId}`, { method: 'DELETE' });
        showToast('Item deleted successfully!', 'success');
        renderMyListingsPage();
    } catch (error) {
        showToast('Failed to delete item', 'error');
    }
}

// ==========================================
// CATEGORIES PAGE
// ==========================================

function renderCategoriesPage() {
    const main = document.getElementById('mainContent');
    
    main.innerHTML = `
        <section class="categories-section" style="padding-top: 40px;">
            <div class="container">
                <div class="page-header">
                    <h1><i class="fas fa-th-large"></i> All Categories</h1>
                </div>
                <div class="categories-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px;">
                    ${categories.map(cat => `
                        <div class="category-card" onclick="filterByCategory('${cat.id}')" style="padding: 35px 20px;">
                            <div class="icon" style="font-size: 3rem;">${cat.icon}</div>
                            <h3 style="font-size: 1.1rem;">${cat.name}</h3>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}

// ==========================================
// ABOUT & CONTACT PAGES
// ==========================================

function renderAboutPage() {
    const main = document.getElementById('mainContent');
    
    main.innerHTML = `
        <section style="padding: 60px 0;">
            <div class="container">
                <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 20px;">About Online Shop Uganda 🛍️</h1>
                    <p style="font-size: 1.2rem; color: var(--dark-gray); margin-bottom: 40px;">
                        Uganda's Premier Fashion Marketplace
                    </p>
                    
                    <div style="text-align: left; background: var(--white); padding: 40px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
                        <h2 style="margin-bottom: 15px;">Our Mission</h2>
                        <p style="margin-bottom: 25px; color: var(--secondary-light); line-height: 1.8;">
                            Online Shop Uganda is Uganda's premier fashion marketplace where anyone can buy and sell clothing, 
                            shoes, and accessories. We're building a platform that makes fashion accessible to everyone.
                        </p>
                        
                        <h2 style="margin-bottom: 15px;">How It Works</h2>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px;">
                            <div style="text-align: center; padding: 20px;">
                                <div style="font-size: 2.5rem; margin-bottom: 10px;">📸</div>
                                <h3 style="font-size: 1rem; margin-bottom: 5px;">Post Your Item</h3>
                                <p style="font-size: 0.9rem; color: var(--dark-gray);">Take photos and list your clothes</p>
                            </div>
                            <div style="text-align: center; padding: 20px;">
                                <div style="font-size: 2.5rem; margin-bottom: 10px;">👀</div>
                                <h3 style="font-size: 1rem; margin-bottom: 5px;">Buyers Find You</h3>
                                <p style="font-size: 0.9rem; color: var(--dark-gray);">Thousands browse daily</p>
                            </div>
                            <div style="text-align: center; padding: 20px;">
                                <div style="font-size: 2.5rem; margin-bottom: 10px;">💬</div>
                                <h3 style="font-size: 1rem; margin-bottom: 5px;">Connect & Sell</h3>
                                <p style="font-size: 0.9rem; color: var(--dark-gray);">Chat via WhatsApp or call</p>
                            </div>
                        </div>
                        
                        <h2 style="margin-bottom: 15px;">Why Choose Online Shop Uganda?</h2>
                        <ul style="color: var(--secondary-light); line-height: 2;">
                            <li>✅ Free to list items</li>
                            <li>✅ Direct contact with buyers via WhatsApp</li>
                            <li>✅ Secure and trusted platform</li>
                            <li>✅ Categories for all fashion types</li>
                            <li>✅ Mobile-friendly design</li>
                        </ul>
                    </div>
                    
                    <button class="btn btn-primary btn-lg mt-3" onclick="checkAuthAndPost()">
                        <i class="fas fa-plus"></i> Start Selling Today
                    </button>
                </div>
            </div>
        </section>
    `;
}

function renderContactPage() {
    const main = document.getElementById('mainContent');
    
    main.innerHTML = `
        <section style="padding: 60px 0;">
            <div class="container">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h1 style="font-size: 2rem; margin-bottom: 10px; text-align: center;">
                        <i class="fas fa-envelope"></i> Contact Us
                    </h1>
                    <p style="text-align: center; color: var(--dark-gray); margin-bottom: 40px;">
                        Have questions? We'd love to hear from you!
                    </p>
                    
                    <div style="background: var(--white); padding: 40px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
                        <div style="display: grid; gap: 25px; margin-bottom: 30px;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="width: 50px; height: 50px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-map-marker-alt"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1rem; margin-bottom: 3px;">Address</h3>
                                    <p style="color: var(--dark-gray);">Kampala, Uganda</p>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="width: 50px; height: 50px; background: var(--whatsapp); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fab fa-whatsapp"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1rem; margin-bottom: 3px;">WhatsApp</h3>
                                    <p style="color: var(--dark-gray);">+256 700 518 006</p>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="width: 50px; height: 50px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1rem; margin-bottom: 3px;">Email</h3>
                                    <p style="color: var(--dark-gray);">info@onlineshopuganda.me</p>
                                </div>
                            </div>
                        </div>
                        
                        <a href="https://wa.me/256700518006?text=Hello Online Shop Uganda! I have a question..." 
                           target="_blank" 
                           class="btn btn-primary btn-block btn-lg" style="background: var(--whatsapp);">
                            <i class="fab fa-whatsapp"></i> Chat with us on WhatsApp
                        </a>
                    </div>
                    
                    <div style="margin-top: 30px; background: var(--white); padding: 30px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
                        <h3 style="margin-bottom: 15px; text-align: center;"><i class="fas fa-motorcycle"></i> Delivery Partners</h3>
                        <p style="text-align: center; color: var(--dark-gray); margin-bottom: 20px;">We work with trusted delivery services</p>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="https://safeboda.com" target="_blank" class="delivery-partner-badge">
                                🏍️ SafeBoda
                            </a>
                            <a href="https://faras.com" target="_blank" class="delivery-partner-badge">
                                🚗 Faras
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// ==========================================
// AUTHENTICATION
// ==========================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset form if closing post modal
    if (modalId === 'postItemModal') {
        document.getElementById('postItemForm').reset();
        document.getElementById('imagePreviews').innerHTML = '';
        document.getElementById('uploadPlaceholder').style.display = 'block';
        editingProductId = null;
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('registerForm').style.display = 'block';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.elements.email.value;
    const password = form.elements.password.value;
    
    try {
        const response = await fetchAPI('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        currentUser = response.user;
        localStorage.setItem('onlineshopug_user', JSON.stringify(currentUser));
        
        updateAuthUI();
        closeModal('authModal');
        showToast(`Welcome back, ${currentUser.fullName}!`, 'success');
        
        form.reset();
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const data = {
        fullName: form.elements.fullName.value,
        email: form.elements.email.value,
        password: form.elements.password.value,
        phone: form.elements.phone.value,
        whatsapp: form.elements.whatsapp.value || form.elements.phone.value,
        location: form.elements.location.value
    };
    
    try {
        const response = await fetchAPI('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        currentUser = response.user;
        localStorage.setItem('onlineshopug_user', JSON.stringify(currentUser));
        
        updateAuthUI();
        closeModal('authModal');
        showToast('Account created successfully! Welcome to Online Shop Uganda! 🛍️', 'success');
        
        form.reset();
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('onlineshopug_user');
    updateAuthUI();
    navigateTo('home');
    showToast('Logged out successfully', 'success');
}

function updateAuthUI() {
    const dropdown = document.getElementById('userDropdown');
    const mobileAuth = document.getElementById('mobileAuth');
    const mobileMyListings = document.getElementById('mobileMyListings');
    
    if (currentUser) {
        dropdown.innerHTML = `
            <div class="user-info">
                <h4>${currentUser.fullName}</h4>
                <p>${currentUser.email}</p>
            </div>
            <a href="#" onclick="navigateTo('my-listings'); closeUserDropdown(); return false;">
                <i class="fas fa-store"></i> My Listings
            </a>
            <a href="#" onclick="navigateTo('home'); closeUserDropdown(); return false;">
                <i class="fas fa-home"></i> Home
            </a>
            <button class="logout-btn" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        
        mobileAuth.innerHTML = `
            <button class="btn btn-secondary btn-block" onclick="logout(); closeMobileMenu();">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        
        mobileMyListings.style.display = 'flex';
    } else {
        dropdown.innerHTML = `
            <a href="#" onclick="openModal('authModal'); closeUserDropdown(); return false;">
                <i class="fas fa-sign-in-alt"></i> Login
            </a>
            <a href="#" onclick="openModal('authModal'); switchAuthTab('register'); closeUserDropdown(); return false;">
                <i class="fas fa-user-plus"></i> Register
            </a>
        `;
        
        mobileAuth.innerHTML = `
            <button class="btn btn-primary btn-block" onclick="openModal('authModal'); closeMobileMenu();">
                <i class="fas fa-sign-in-alt"></i> Login / Register
            </button>
        `;
        
        mobileMyListings.style.display = 'none';
    }
}

function checkAuthAndPost() {
    if (!currentUser) {
        openModal('authModal');
        showToast('Please login or register to post items', 'warning');
        return;
    }
    openModal('postItemModal');
}

function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('active');
}

function closeUserDropdown() {
    document.getElementById('userDropdown').classList.remove('active');
}

// ==========================================
// POST ITEM
// ==========================================

function previewImages(event) {
    const files = event.target.files;
    const previews = document.getElementById('imagePreviews');
    const placeholder = document.getElementById('uploadPlaceholder');
    
    if (files.length > 0) {
        placeholder.style.display = 'none';
        previews.innerHTML = '';
        
        Array.from(files).slice(0, 5).forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${i+1}">
                `;
                previews.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }
}

async function handlePostItem(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    formData.append('sellerId', currentUser.id);
    
    // If no phone/whatsapp provided, use user's info
    if (!formData.get('phone')) {
        formData.set('phone', currentUser.phone);
    }
    if (!formData.get('whatsapp')) {
        formData.set('whatsapp', currentUser.whatsapp || currentUser.phone);
    }
    
    try {
        let response;
        
        if (editingProductId) {
            response = await fetch(`${API_URL}/api/products/${editingProductId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            response = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                body: formData
            });
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to post item');
        }
        
        closeModal('postItemModal');
        showToast(editingProductId ? 'Item updated successfully!' : 'Item posted successfully!', 'success');
        
        // Refresh current page
        if (currentPage === 'my-listings') {
            renderMyListingsPage();
        } else {
            navigateTo('home');
        }
        
        editingProductId = null;
    } catch (error) {
        showToast(error.message || 'Failed to post item', 'error');
    }
}

// ==========================================
// MOBILE MENU
// ==========================================

function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('active');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatPrice(price) {
    return price.toLocaleString('en-UG');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-UG', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

function formatDateRelative(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-UG', { 
        day: 'numeric', 
        month: 'short'
    });
}

function isRecentlyPosted(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days <= 7; // Items posted within 7 days are "NEW"
}

function formatPhoneForWhatsApp(phone) {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If starts with 0, replace with 256
    if (cleaned.startsWith('0')) {
        cleaned = '256' + cleaned.substring(1);
    }
    
    // If starts with +, remove it
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    
    return cleaned;
}

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
}

function toggleWishlist(productId) {
    const index = favorites.indexOf(productId);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(productId);
        showToast('Added to favorites! ❤️', 'success');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        showToast('Removed from favorites', 'success');
    }
    
    // Save to localStorage
    saveFavorites();
    
    // Update UI
    updateFavoriteButtons();
    updateFavoritesCount();
}

function isInFavorites(productId) {
    return favorites.includes(productId);
}

function loadFavorites() {
    const saved = localStorage.getItem('onlineshopug_favorites');
    if (saved) {
        try {
            favorites = JSON.parse(saved);
        } catch (e) {
            favorites = [];
        }
    }
    updateFavoritesCount();
}

function saveFavorites() {
    localStorage.setItem('onlineshopug_favorites', JSON.stringify(favorites));
}

function updateFavoriteButtons() {
    document.querySelectorAll('.product-wishlist').forEach(btn => {
        const productId = btn.dataset.productId;
        const icon = btn.querySelector('i');
        
        if (isInFavorites(productId)) {
            btn.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            btn.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });
}

function updateFavoritesCount() {
    const countElements = document.querySelectorAll('.favorites-count');
    countElements.forEach(el => {
        el.textContent = favorites.length;
        el.style.display = favorites.length > 0 ? 'flex' : 'none';
    });
}

async function viewFavorites() {
    if (favorites.length === 0) {
        showToast('No favorites yet! Tap the ❤️ on items you like', 'warning');
        return;
    }
    
    navigateTo('favorites');
}

async function renderFavoritesPage() {
    const main = document.getElementById('mainContent');
    
    // Get favorite products
    let favoriteProducts = [];
    try {
        const allProducts = await loadProducts({});
        favoriteProducts = allProducts.filter(p => favorites.includes(p.id));
    } catch (e) {
        console.error('Error loading favorites:', e);
    }
    
    main.innerHTML = `
        <section class="favorites-page">
            <div class="container">
                <div class="page-header">
                    <button class="btn btn-secondary" onclick="navigateTo('home')">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <h1><i class="fas fa-heart" style="color: var(--danger);"></i> My Favorites</h1>
                    <span class="favorites-count-badge">${favorites.length} items</span>
                </div>
                
                ${favoriteProducts.length === 0 ? `
                    <div class="empty-state">
                        <i class="far fa-heart"></i>
                        <h3>No favorites yet</h3>
                        <p>Tap the heart icon on items you love to save them here!</p>
                        <button class="btn btn-primary" onclick="navigateTo('home')">
                            <i class="fas fa-search"></i> Browse Items
                        </button>
                    </div>
                ` : `
                    <div class="products-grid">
                        ${renderProductCards(favoriteProducts)}
                    </div>
                    <div class="text-center mt-3">
                        <button class="btn btn-secondary" onclick="clearAllFavorites()">
                            <i class="fas fa-trash"></i> Clear All Favorites
                        </button>
                    </div>
                `}
            </div>
        </section>
    `;
    
    // Update heart icons
    setTimeout(updateFavoriteButtons, 100);
}

function clearAllFavorites() {
    if (!confirm('Remove all items from favorites?')) return;
    
    favorites = [];
    saveFavorites();
    updateFavoritesCount();
    showToast('All favorites cleared', 'success');
    renderFavoritesPage();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <p>${message}</p>
        <button class="close-toast" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            closeModal(modal.id);
        });
        closeMobileMenu();
    }
});

// ==========================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ==========================================

window.navigateTo = navigateTo;
window.filterByCategory = filterByCategory;
window.performSearch = performSearch;
window.viewProduct = viewProduct;
window.changeMainImage = changeMainImage;
window.requestDelivery = requestDelivery;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.checkAuthAndPost = checkAuthAndPost;
window.toggleUserDropdown = toggleUserDropdown;
window.closeUserDropdown = closeUserDropdown;
window.previewImages = previewImages;
window.handlePostItem = handlePostItem;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.scrollToProducts = scrollToProducts;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.updateActiveFilters = updateActiveFilters;
window.toggleWishlist = toggleWishlist;
window.viewFavorites = viewFavorites;
window.clearAllFavorites = clearAllFavorites;
window.isInFavorites = isInFavorites;
window.updateDetailFavoriteBtn = updateDetailFavoriteBtn;
