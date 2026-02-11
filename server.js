const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffer, folder = 'online-shop-uganda') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: folder,
                transformation: [
                    { width: 800, height: 1000, crop: 'limit' },
                    { quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== IN-MEMORY DATA STORE ====================
// For Vercel serverless, we use in-memory storage
// Note: Data will reset on each cold start. For persistence, use a database.

let users = [];

let products = [];

// Multer configuration - use memory storage for serverless
const storage = multer.memoryStorage();

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
    try {
        const { fullName, email, password, phone, whatsapp, location, userType } = req.body;
        
        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }

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

        // Don't send password back
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ message: 'Registration successful!', user: userWithoutPassword });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Login successful!', user: userWithoutPassword });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get user profile
app.get('/api/auth/user/:id', (req, res) => {
    try {
        const user = users.find(u => u.id === req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PRODUCT ROUTES ====================

// Get all products (with optional filters)
app.get('/api/products', (req, res) => {
    try {
        let filteredProducts = [...products];
        const { category, size, minPrice, maxPrice, condition, search, location, sortBy } = req.query;

        // Apply filters
        if (category && category !== 'all' && category !== '') {
            filteredProducts = filteredProducts.filter(p => 
                p.category && p.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (size && size !== 'all' && size !== '') {
            filteredProducts = filteredProducts.filter(p => 
                p.size && p.size.toLowerCase() === size.toLowerCase()
            );
        }
        
        if (condition && condition !== 'all' && condition !== '') {
            const conditionLower = condition.toLowerCase();
            filteredProducts = filteredProducts.filter(p => {
                if (!p.condition) return false;
                const prodCondition = p.condition.toLowerCase();
                return prodCondition === conditionLower || 
                       (conditionLower === 'new' && prodCondition === 'new');
            });
        }
        
        if (location && location !== '') {
            filteredProducts = filteredProducts.filter(p => 
                p.location && p.location.toLowerCase().includes(location.toLowerCase())
            );
        }
        
        if (minPrice && !isNaN(parseFloat(minPrice))) {
            filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
        }
        
        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
            filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
        }
        
        if (search && search.trim() !== '') {
            const searchLower = search.toLowerCase().trim();
            filteredProducts = filteredProducts.filter(p => 
                (p.name && p.name.toLowerCase().includes(searchLower)) ||
                (p.description && p.description.toLowerCase().includes(searchLower)) ||
                (p.category && p.category.toLowerCase().includes(searchLower)) ||
                (p.color && p.color.toLowerCase().includes(searchLower))
            );
        }

        // Sort
        if (sortBy === 'price-low') {
            filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price-high') {
            filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else {
            // Default: newest first
            filteredProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        res.json(filteredProducts);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    try {
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get seller info
        const seller = users.find(u => u.id === product.sellerId);
        
        const productWithSeller = { ...product };
        if (seller) {
            productWithSeller.seller = {
                id: seller.id,
                fullName: seller.fullName,
                phone: seller.phone,
                whatsapp: seller.whatsapp,
                location: seller.location
            };
        }

        res.json(productWithSeller);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new product (with image upload)
app.post('/api/products', upload.array('images', 5), async (req, res) => {
    try {
        const { name, category, size, color, condition, price, description, location, sellerId, phone, whatsapp } = req.body;

        if (!name || !category || !price || !sellerId) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }

        // Upload images to Cloudinary
        let images = [];
        
        if (req.files && req.files.length > 0) {
            // Upload each file to Cloudinary
            const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
            const uploadResults = await Promise.all(uploadPromises);
            images = uploadResults.map(result => result.secure_url);
        } else if (req.body.imageUrls) {
            // Use provided URLs
            images = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
        } else {
            // Use a placeholder image
            images = ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop'];
        }

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
            status: 'available',
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        products.push(newProduct);

        res.status(201).json({ message: 'Product listed successfully!', product: newProduct });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update product
app.put('/api/products/:id', upload.array('images', 5), async (req, res) => {
    try {
        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { name, category, size, color, condition, price, description, location, phone, whatsapp, imageUrls } = req.body;
        
        let images = products[index].images;
        
        // Upload new images to Cloudinary if provided
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
            const uploadResults = await Promise.all(uploadPromises);
            images = uploadResults.map(result => result.secure_url);
        } else if (imageUrls) {
            images = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
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

        res.json({ message: 'Product updated!', product: products[index] });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update product status (available/sold)
app.patch('/api/products/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status || !['available', 'sold'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use "available" or "sold"' });
        }
        
        const index = products.findIndex(p => p.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        products[index].status = status;
        products[index].updatedAt = new Date().toISOString();
        
        res.json({ message: `Product marked as ${status}!`, product: products[index] });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    try {
        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        products.splice(index, 1);

        res.json({ message: 'Product deleted successfully!' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get products by seller
app.get('/api/sellers/:sellerId/products', (req, res) => {
    try {
        const sellerProducts = products.filter(p => p.sellerId === req.params.sellerId);
        res.json(sellerProducts);
    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Increment product views
app.post('/api/products/:id/view', (req, res) => {
    try {
        const index = products.findIndex(p => p.id === req.params.id);

        if (index !== -1) {
            products[index].views = (products[index].views || 0) + 1;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('View increment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
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
    try {
        res.json({
            totalProducts: products.length,
            totalSellers: users.length,
            totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0)
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other routes - SPA style
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server (only when not in serverless environment)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`
    🇺🇬  ================================
    🛒  ONLINE-SHOP-UGANDA
    🇺🇬  ================================
    
    🚀 Server running on port: ${PORT}
    📦 Ready to serve Uganda's fashion!
    
    ================================
        `);
    });
}

// Export for Vercel
module.exports = app;
