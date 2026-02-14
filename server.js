const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || '';

let isDbConnected = false;

const connectDB = async () => {
    if (isDbConnected || !MONGODB_URI) {
        if (!MONGODB_URI) {
            console.log(' MONGODB_URI not set - using in-memory storage (data will not persist)');
        }
        return;
    }
    
    try {
        await mongoose.connect(MONGODB_URI);
        isDbConnected = true;
        console.log(' MongoDB connected successfully');
    } catch (error) {
        console.error(' MongoDB connection error:', error.message);
    }
};

connectDB();

// ==================== MONGODB SCHEMAS ====================

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: String,
    location: { type: String, default: 'Uganda' },
    userType: { type: String, default: 'seller' },
    avatar: String,
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    size: { type: String, default: 'M' },
    color: { type: String, default: 'Various' },
    condition: { type: String, default: 'new' },
    price: { type: Number, required: true },
    description: String,
    location: { type: String, default: 'Uganda' },
    images: [String],
    sellerId: { type: String, required: true },
    phone: String,
    whatsapp: String,
    status: { type: String, default: 'available' },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// ==================== IN-MEMORY FALLBACK ====================
let usersMemory = [];
let productsMemory = [];

// Helper to check if DB is available
const useDB = () => isDbConnected && MONGODB_URI;

// ==================== CLOUDINARY CONFIG ====================

const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log(' Cloudinary configured successfully');
} else {
    console.log(' Cloudinary not configured - images will be stored as base64 data URLs');
}

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

const bufferToDataUrl = (buffer, mimetype) => {
    const base64 = buffer.toString('base64');
    return `data:${mimetype};base64,${base64}`;
};

const processUploadedImages = async (files) => {
    if (!files || files.length === 0) return [];
    
    if (isCloudinaryConfigured) {
        try {
            const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
            const uploadResults = await Promise.all(uploadPromises);
            return uploadResults.map(result => result.secure_url);
        } catch (error) {
            console.error('Cloudinary upload failed:', error.message);
            return files.map(file => bufferToDataUrl(file.buffer, file.mimetype));
        }
    } else {
        return files.map(file => bufferToDataUrl(file.buffer, file.mimetype));
    }
};

// ==================== MIDDLEWARE ====================

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) cb(null, true);
        else cb(new Error('Only image files are allowed!'));
    }
});

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, phone, whatsapp, location, userType } = req.body;
        
        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }

        const newUser = {
            id: uuidv4(),
            fullName,
            email,
            password,
            phone,
            whatsapp: whatsapp || phone,
            location: location || 'Uganda',
            userType: userType || 'seller',
            createdAt: new Date(),
            avatar: null
        };

        if (useDB()) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            await User.create(newUser);
        } else {
            if (usersMemory.find(u => u.email === email)) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            usersMemory.push(newUser);
        }

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ message: 'Registration successful!', user: userWithoutPassword });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        let user;
        if (useDB()) {
            user = await User.findOne({ email, password });
        } else {
            user = usersMemory.find(u => u.email === email && u.password === password);
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userObj = user.toObject ? user.toObject() : user;
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({ message: 'Login successful!', user: userWithoutPassword });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.get('/api/auth/user/:id', async (req, res) => {
    try {
        let user;
        if (useDB()) {
            user = await User.findOne({ id: req.params.id });
        } else {
            user = usersMemory.find(u => u.id === req.params.id);
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userObj = user.toObject ? user.toObject() : user;
        const { password: _, ...userWithoutPassword } = userObj;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PRODUCT ROUTES ====================

app.get('/api/products', async (req, res) => {
    try {
        const { category, size, minPrice, maxPrice, condition, search, location, sortBy } = req.query;
        
        let filteredProducts;
        
        if (useDB()) {
            let query = {};
            
            if (category && category !== 'all') {
                query.category = { $regex: new RegExp(`^${category}$`, 'i') };
            }
            if (size && size !== 'all') {
                query.size = { $regex: new RegExp(`^${size}$`, 'i') };
            }
            if (condition && condition !== 'all') {
                query.condition = { $regex: new RegExp(`^${condition}$`, 'i') };
            }
            if (location) {
                query.location = { $regex: location, $options: 'i' };
            }
            if (minPrice) {
                query.price = { ...query.price, $gte: parseFloat(minPrice) };
            }
            if (maxPrice) {
                query.price = { ...query.price, $lte: parseFloat(maxPrice) };
            }
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                    { color: { $regex: search, $options: 'i' } }
                ];
            }
            
            let sortOption = { createdAt: -1 };
            if (sortBy === 'price-low') sortOption = { price: 1 };
            else if (sortBy === 'price-high') sortOption = { price: -1 };
            
            filteredProducts = await Product.find(query).sort(sortOption);
        } else {
            filteredProducts = [...productsMemory];
            
            if (category && category !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.category?.toLowerCase() === category.toLowerCase());
            }
            if (size && size !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.size?.toLowerCase() === size.toLowerCase());
            }
            if (condition && condition !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.condition?.toLowerCase() === condition.toLowerCase());
            }
            if (location) {
                filteredProducts = filteredProducts.filter(p => p.location?.toLowerCase().includes(location.toLowerCase()));
            }
            if (minPrice) {
                filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
            }
            if (maxPrice) {
                filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
            }
            if (search) {
                const s = search.toLowerCase();
                filteredProducts = filteredProducts.filter(p => 
                    p.name?.toLowerCase().includes(s) || 
                    p.description?.toLowerCase().includes(s) ||
                    p.category?.toLowerCase().includes(s) ||
                    p.color?.toLowerCase().includes(s)
                );
            }
            
            if (sortBy === 'price-low') {
                filteredProducts.sort((a, b) => a.price - b.price);
            } else if (sortBy === 'price-high') {
                filteredProducts.sort((a, b) => b.price - a.price);
            } else {
                filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        }

        res.json(filteredProducts);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        let product, seller;
        
        if (useDB()) {
            product = await Product.findOne({ id: req.params.id });
            if (product) {
                seller = await User.findOne({ id: product.sellerId });
            }
        } else {
            product = productsMemory.find(p => p.id === req.params.id);
            if (product) {
                seller = usersMemory.find(u => u.id === product.sellerId);
            }
        }
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const productObj = product.toObject ? product.toObject() : { ...product };
        if (seller) {
            const sellerObj = seller.toObject ? seller.toObject() : seller;
            productObj.seller = {
                id: sellerObj.id,
                fullName: sellerObj.fullName,
                phone: sellerObj.phone,
                whatsapp: sellerObj.whatsapp,
                location: sellerObj.location
            };
        }

        res.json(productObj);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/products', upload.array('images', 5), async (req, res) => {
    try {
        const { name, category, size, color, condition, price, description, location, sellerId, phone, whatsapp } = req.body;

        if (!name || !category || !price || !sellerId) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            images = await processUploadedImages(req.files);
        } else if (req.body.imageUrls) {
            images = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
        } else {
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
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (useDB()) {
            await Product.create(newProduct);
        } else {
            productsMemory.push(newProduct);
        }

        res.status(201).json({ message: 'Product listed successfully!', product: newProduct });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/products/:id', upload.array('images', 5), async (req, res) => {
    try {
        const { name, category, size, color, condition, price, description, location, phone, whatsapp, imageUrls } = req.body;
        
        let product;
        if (useDB()) {
            product = await Product.findOne({ id: req.params.id });
        } else {
            product = productsMemory.find(p => p.id === req.params.id);
        }

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let images = product.images;
        if (req.files && req.files.length > 0) {
            images = await processUploadedImages(req.files);
        } else if (imageUrls) {
            images = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
        }

        const updates = {
            name: name || product.name,
            category: category || product.category,
            size: size || product.size,
            color: color || product.color,
            condition: condition || product.condition,
            price: price ? parseFloat(price) : product.price,
            description: description || product.description,
            location: location || product.location,
            phone: phone || product.phone,
            whatsapp: whatsapp || product.whatsapp,
            images,
            updatedAt: new Date()
        };

        if (useDB()) {
            await Product.updateOne({ id: req.params.id }, updates);
            product = await Product.findOne({ id: req.params.id });
        } else {
            const index = productsMemory.findIndex(p => p.id === req.params.id);
            productsMemory[index] = { ...productsMemory[index], ...updates };
            product = productsMemory[index];
        }

        res.json({ message: 'Product updated!', product });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.patch('/api/products/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status || !['available', 'sold'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use "available" or "sold"' });
        }
        
        let product;
        if (useDB()) {
            await Product.updateOne({ id: req.params.id }, { status, updatedAt: new Date() });
            product = await Product.findOne({ id: req.params.id });
        } else {
            const index = productsMemory.findIndex(p => p.id === req.params.id);
            if (index === -1) {
                return res.status(404).json({ error: 'Product not found' });
            }
            productsMemory[index].status = status;
            productsMemory[index].updatedAt = new Date();
            product = productsMemory[index];
        }
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: `Product marked as ${status}!`, product });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        if (useDB()) {
            const result = await Product.deleteOne({ id: req.params.id });
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
        } else {
            const index = productsMemory.findIndex(p => p.id === req.params.id);
            if (index === -1) {
                return res.status(404).json({ error: 'Product not found' });
            }
            productsMemory.splice(index, 1);
        }

        res.json({ message: 'Product deleted successfully!' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/sellers/:sellerId/products', async (req, res) => {
    try {
        let sellerProducts;
        if (useDB()) {
            sellerProducts = await Product.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
        } else {
            sellerProducts = productsMemory.filter(p => p.sellerId === req.params.sellerId);
        }
        res.json(sellerProducts);
    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/products/:id/view', async (req, res) => {
    try {
        if (useDB()) {
            await Product.updateOne({ id: req.params.id }, { $inc: { views: 1 } });
        } else {
            const index = productsMemory.findIndex(p => p.id === req.params.id);
            if (index !== -1) {
                productsMemory[index].views = (productsMemory[index].views || 0) + 1;
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error('View increment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== CATEGORIES ====================

app.get('/api/categories', (req, res) => {
    res.json([
        { id: 'dresses', name: 'Dresses', icon: '' },
        { id: 'shirts', name: 'Shirts & Tops', icon: '' },
        { id: 'pants', name: 'Pants & Jeans', icon: '' },
        { id: 'shoes', name: 'Shoes', icon: '' },
        { id: 'jackets', name: 'Jackets & Coats', icon: '' },
        { id: 'accessories', name: 'Accessories', icon: '' },
        { id: 'traditional', name: 'Traditional Wear', icon: '' },
        { id: 'sportswear', name: 'Sportswear', icon: '' },
        { id: 'kids', name: 'Kids Fashion', icon: '' },
        { id: 'other', name: 'Other', icon: '' }
    ]);
});

// ==================== STATS ====================

app.get('/api/stats', async (req, res) => {
    try {
        let totalProducts, totalSellers, totalViews;
        
        if (useDB()) {
            totalProducts = await Product.countDocuments();
            totalSellers = await User.countDocuments();
            const viewsResult = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);
            totalViews = viewsResult[0]?.total || 0;
        } else {
            totalProducts = productsMemory.length;
            totalSellers = usersMemory.length;
            totalViews = productsMemory.reduce((sum, p) => sum + (p.views || 0), 0);
        }
        
        res.json({ totalProducts, totalSellers, totalViews });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        database: useDB() ? 'connected' : 'in-memory',
        timestamp: new Date().toISOString() 
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`
      ================================
      ONLINE-SHOP-UGANDA
      ================================
    
     Server running on port: ${PORT}
     Database: ${MONGODB_URI ? 'MongoDB' : 'In-Memory (not persistent)'}
    
    ================================
        `);
    });
}

module.exports = app;
