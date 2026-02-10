const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Ensure data directory exists
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// Initialize data files
const usersFile = './data/users.json';
const productsFile = './data/products.json';

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}
if (!fs.existsSync(productsFile)) {
    fs.writeFileSync(productsFile, JSON.stringify([]));
}

// Helper functions
const readData = (file) => {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return [];
    }
};

const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', (req, res) => {
    const { fullName, email, password, phone, whatsapp, location, userType } = req.body;
    
    if (!fullName || !email || !password || !phone) {
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    const users = readData(usersFile);
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = {
        id: uuidv4(),
        fullName,
        email,
        password, // In production, hash this!
        phone,
        whatsapp: whatsapp || phone,
        location: location || 'Uganda',
        userType: userType || 'seller',
        createdAt: new Date().toISOString(),
        avatar: null
    };

    users.push(newUser);
    writeData(usersFile, users);

    // Don't send password back
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Registration successful!', user: userWithoutPassword });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const users = readData(usersFile);
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful!', user: userWithoutPassword });
});

// Get user profile
app.get('/api/auth/user/:id', (req, res) => {
    const users = readData(usersFile);
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// ==================== PRODUCT ROUTES ====================

// Get all products (with optional filters)
app.get('/api/products', (req, res) => {
    let products = readData(productsFile);
    const { category, size, minPrice, maxPrice, condition, search, location, sortBy } = req.query;

    console.log('Filter request:', { category, size, condition, sortBy, search });

    // Apply filters
    if (category && category !== 'all' && category !== '') {
        products = products.filter(p => 
            p.category && p.category.toLowerCase() === category.toLowerCase()
        );
    }
    
    if (size && size !== 'all' && size !== '') {
        products = products.filter(p => 
            p.size && p.size.toLowerCase() === size.toLowerCase()
        );
    }
    
    if (condition && condition !== 'all' && condition !== '') {
        // Handle condition matching - support partial matches for "like-new", "new", etc.
        const conditionLower = condition.toLowerCase();
        products = products.filter(p => {
            if (!p.condition) return false;
            const prodCondition = p.condition.toLowerCase();
            // Exact match or starts with (for 'new' matching 'new' but not 'like-new')
            return prodCondition === conditionLower || 
                   (conditionLower === 'new' && prodCondition === 'new');
        });
    }
    
    if (location && location !== '') {
        products = products.filter(p => 
            p.location && p.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    if (minPrice && !isNaN(parseFloat(minPrice))) {
        products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        products = products.filter(p => p.price <= parseFloat(maxPrice));
    }
    
    if (search && search.trim() !== '') {
        const searchLower = search.toLowerCase().trim();
        products = products.filter(p => 
            (p.name && p.name.toLowerCase().includes(searchLower)) ||
            (p.description && p.description.toLowerCase().includes(searchLower)) ||
            (p.category && p.category.toLowerCase().includes(searchLower)) ||
            (p.color && p.color.toLowerCase().includes(searchLower))
        );
    }

    // Sort
    if (sortBy === 'price-low') {
        products.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
        products.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
        // Default: newest first
        products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    console.log(`Returning ${products.length} products after filtering`);
    res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    const products = readData(productsFile);
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    // Get seller info
    const users = readData(usersFile);
    const seller = users.find(u => u.id === product.sellerId);
    
    if (seller) {
        product.seller = {
            id: seller.id,
            fullName: seller.fullName,
            phone: seller.phone,
            whatsapp: seller.whatsapp,
            location: seller.location
        };
    }

    res.json(product);
});

// Create new product (with image upload)
app.post('/api/products', upload.array('images', 5), (req, res) => {
    const { name, category, size, color, condition, price, description, location, sellerId, phone, whatsapp } = req.body;

    if (!name || !category || !price || !sellerId) {
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const newProduct = {
        id: uuidv4(),
        name,
        category,
        size: size || 'M',
        color: color || 'Various',
        condition: condition || 'new',
        price: parseFloat(price),
        description: description || '',
        location: location || 'Uganda',
        images,
        sellerId,
        phone: phone || '',
        whatsapp: whatsapp || '',
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const products = readData(productsFile);
    products.push(newProduct);
    writeData(productsFile, products);

    res.status(201).json({ message: 'Product listed successfully!', product: newProduct });
});

// Update product
app.put('/api/products/:id', upload.array('images', 5), (req, res) => {
    const products = readData(productsFile);
    const index = products.findIndex(p => p.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const { name, category, size, color, condition, price, description, location, phone, whatsapp } = req.body;
    
    // Handle new images if uploaded
    let images = products[index].images;
    if (req.files && req.files.length > 0) {
        images = req.files.map(f => `/uploads/${f.filename}`);
    }

    products[index] = {
        ...products[index],
        name: name || products[index].name,
        category: category || products[index].category,
        size: size || products[index].size,
        color: color || products[index].color,
        condition: condition || products[index].condition,
        price: price ? parseFloat(price) : products[index].price,
        description: description || products[index].description,
        location: location || products[index].location,
        phone: phone || products[index].phone,
        whatsapp: whatsapp || products[index].whatsapp,
        images,
        updatedAt: new Date().toISOString()
    };

    writeData(productsFile, products);
    res.json({ message: 'Product updated!', product: products[index] });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    let products = readData(productsFile);
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    // Delete associated images
    product.images.forEach(img => {
        const imgPath = path.join(__dirname, img);
        if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
        }
    });

    products = products.filter(p => p.id !== req.params.id);
    writeData(productsFile, products);

    res.json({ message: 'Product deleted successfully!' });
});

// Get products by seller
app.get('/api/sellers/:sellerId/products', (req, res) => {
    const products = readData(productsFile);
    const sellerProducts = products.filter(p => p.sellerId === req.params.sellerId);
    res.json(sellerProducts);
});

// Increment product views
app.post('/api/products/:id/view', (req, res) => {
    const products = readData(productsFile);
    const index = products.findIndex(p => p.id === req.params.id);

    if (index !== -1) {
        products[index].views = (products[index].views || 0) + 1;
        writeData(productsFile, products);
    }

    res.json({ success: true });
});

// ==================== CATEGORIES ====================

app.get('/api/categories', (req, res) => {
    const categories = [
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
    res.json(categories);
});

// ==================== STATS ====================

app.get('/api/stats', (req, res) => {
    const products = readData(productsFile);
    const users = readData(usersFile);

    res.json({
        totalProducts: products.length,
        totalSellers: users.length,
        totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0)
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other routes - SPA style
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🛍️  ================================
    🔥  STYLEBAY - Fashion Marketplace
    🛍️  ================================
    
    🚀 Server running on: http://localhost:${PORT}
    📦 Ready to serve Uganda's fashion!
    
    ================================
    `);
});
