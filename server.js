const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MOBILE MONEY CONFIG ====================
const MOMO_CONFIG = {
    mtn: {
        baseUrl: process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
        subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY || '',
        apiUser: process.env.MTN_MOMO_API_USER || '',
        apiKey: process.env.MTN_MOMO_API_KEY || '',
        environment: process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
        callbackUrl: process.env.MTN_MOMO_CALLBACK_URL || 'https://yoursite.com/api/payments/mtn/callback',
        currency: 'UGX',
        partyIdType: 'MSISDN'
    },
    airtel: {
        baseUrl: process.env.AIRTEL_BASE_URL || 'https://openapi.airtel.africa',
        clientId: process.env.AIRTEL_CLIENT_ID || '',
        clientSecret: process.env.AIRTEL_CLIENT_SECRET || '',
        environment: process.env.AIRTEL_ENVIRONMENT || 'sandbox',
        callbackUrl: process.env.AIRTEL_CALLBACK_URL || 'https://yoursite.com/api/payments/airtel/callback',
        country: 'UG',
        currency: 'UGX'
    }
};

const isMoMoConfigured = !!(MOMO_CONFIG.mtn.subscriptionKey && MOMO_CONFIG.mtn.apiKey);
const isAirtelConfigured = !!(MOMO_CONFIG.airtel.clientId && MOMO_CONFIG.airtel.clientSecret);

if (isMoMoConfigured) {
    console.log('✅ MTN MoMo API configured');
} else {
    console.log('⚠️ MTN MoMo API not configured - using simulation mode');
}

if (isAirtelConfigured) {
    console.log('✅ Airtel Money API configured');
} else {
    console.log('⚠️ Airtel Money API not configured - using simulation mode');
}

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
    createdAt: { type: Date, default: Date.now },
    // Subscription fields
    subscription: {
        plan: { type: String, enum: ['free', 'basic', 'premium', 'business'], default: 'free' },
        status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
        startDate: Date,
        endDate: Date,
        autoRenew: { type: Boolean, default: false }
    },
    // Seller stats for monetization
    totalListings: { type: Number, default: 0 },
    featuredListingsUsed: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
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
    updatedAt: { type: Date, default: Date.now },
    // Featured listing fields
    isFeatured: { type: Boolean, default: false },
    featuredUntil: Date,
    featuredAt: Date,
    boostLevel: { type: String, enum: ['none', 'basic', 'premium', 'spotlight'], default: 'none' }
});

// ==================== SUBSCRIPTION & PAYMENT SCHEMAS ====================

const subscriptionPlanSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Price in UGX
    duration: { type: Number, required: true }, // Duration in days
    features: {
        maxListings: { type: Number, default: 5 },
        featuredListingsPerMonth: { type: Number, default: 0 },
        prioritySupport: { type: Boolean, default: false },
        shopBranding: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false },
        verifiedBadge: { type: Boolean, default: false },
        noAds: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, enum: ['subscription', 'featured_listing', 'boost'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'UGX' },
    paymentMethod: { type: String, enum: ['mtn_momo', 'airtel_money', 'card', 'bank'], required: true },
    phoneNumber: String, // For mobile money
    transactionRef: String, // External transaction reference
    internalRef: { type: String, required: true }, // Our internal reference
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
    metadata: {
        planId: String,
        productId: String,
        boostLevel: String,
        duration: Number
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    failedAt: Date,
    failureReason: String
});

const featuredListingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    sellerId: { type: String, required: true },
    paymentId: String,
    boostLevel: { type: String, enum: ['basic', 'premium', 'spotlight'], default: 'basic' },
    price: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const FeaturedListing = mongoose.model('FeaturedListing', featuredListingSchema);

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// ==================== IN-MEMORY FALLBACK ====================
let usersMemory = [];
let productsMemory = [];
let subscriptionPlansMemory = [];
let paymentsMemory = [];
let featuredListingsMemory = [];

// Default subscription plans (in UGX)
const defaultPlans = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        duration: 0, // Unlimited
        features: {
            maxListings: 3,
            featuredListingsPerMonth: 0,
            prioritySupport: false,
            shopBranding: false,
            analytics: false,
            verifiedBadge: false,
            noAds: false
        },
        isActive: true
    },
    {
        id: 'basic',
        name: 'Basic Seller',
        price: 25000, // ~$7/month
        duration: 30,
        features: {
            maxListings: 15,
            featuredListingsPerMonth: 2,
            prioritySupport: false,
            shopBranding: false,
            analytics: true,
            verifiedBadge: false,
            noAds: false
        },
        isActive: true
    },
    {
        id: 'premium',
        name: 'Premium Seller',
        price: 75000, // ~$20/month
        duration: 30,
        features: {
            maxListings: 50,
            featuredListingsPerMonth: 10,
            prioritySupport: true,
            shopBranding: true,
            analytics: true,
            verifiedBadge: true,
            noAds: true
        },
        isActive: true
    },
    {
        id: 'business',
        name: 'Business Pro',
        price: 150000, // ~$40/month
        duration: 30,
        features: {
            maxListings: -1, // Unlimited
            featuredListingsPerMonth: -1, // Unlimited
            prioritySupport: true,
            shopBranding: true,
            analytics: true,
            verifiedBadge: true,
            noAds: true
        },
        isActive: true
    }
];

// Featured listing prices (in UGX)
const featuredPrices = {
    basic: { price: 5000, duration: 3, label: '3 Days Basic' },      // ~$1.40
    premium: { price: 15000, duration: 7, label: '7 Days Premium' }, // ~$4
    spotlight: { price: 35000, duration: 14, label: '14 Days Spotlight' } // ~$10
};

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

// ==================== SUBSCRIPTION PLANS ====================

// Get all subscription plans
app.get('/api/subscription-plans', async (req, res) => {
    try {
        let plans;
        if (useDB()) {
            plans = await SubscriptionPlan.find({ isActive: true });
            if (plans.length === 0) {
                // Seed default plans
                await SubscriptionPlan.insertMany(defaultPlans);
                plans = defaultPlans;
            }
        } else {
            if (subscriptionPlansMemory.length === 0) {
                subscriptionPlansMemory = [...defaultPlans];
            }
            plans = subscriptionPlansMemory;
        }
        res.json(plans);
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get featured listing prices
app.get('/api/featured-prices', (req, res) => {
    res.json(featuredPrices);
});

// Get user's subscription status
app.get('/api/subscription/:userId', async (req, res) => {
    try {
        let user;
        if (useDB()) {
            user = await User.findOne({ id: req.params.userId });
        } else {
            user = usersMemory.find(u => u.id === req.params.userId);
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const subscription = user.subscription || { plan: 'free', status: 'active' };
        const plan = defaultPlans.find(p => p.id === subscription.plan) || defaultPlans[0];
        
        // Check if subscription is expired
        if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
            subscription.status = 'expired';
            subscription.plan = 'free';
        }
        
        res.json({
            subscription,
            plan,
            featuredListingsUsed: user.featuredListingsUsed || 0,
            totalListings: user.totalListings || 0
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PAYMENT ROUTES ====================

// Generate unique payment reference
function generatePaymentRef() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `OSU-${timestamp}-${random}`.toUpperCase();
}

// ==================== MTN MOMO API INTEGRATION ====================

// Get MTN MoMo access token
async function getMTNAccessToken() {
    return new Promise((resolve, reject) => {
        const credentials = Buffer.from(`${MOMO_CONFIG.mtn.apiUser}:${MOMO_CONFIG.mtn.apiKey}`).toString('base64');
        
        const options = {
            hostname: new URL(MOMO_CONFIG.mtn.baseUrl).hostname,
            path: '/collection/token/',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Ocp-Apim-Subscription-Key': MOMO_CONFIG.mtn.subscriptionKey,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.access_token);
                } catch (e) {
                    reject(new Error('Failed to parse MTN token response'));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Request payment from MTN MoMo
async function requestMTNPayment(amount, phoneNumber, externalId, payerMessage) {
    if (!isMoMoConfigured) {
        // Simulation mode
        return { success: true, simulated: true, referenceId: uuidv4() };
    }

    try {
        const accessToken = await getMTNAccessToken();
        const referenceId = uuidv4();
        
        const payload = JSON.stringify({
            amount: amount.toString(),
            currency: MOMO_CONFIG.mtn.currency,
            externalId: externalId,
            payer: {
                partyIdType: MOMO_CONFIG.mtn.partyIdType,
                partyId: phoneNumber.replace(/\D/g, '').replace(/^0/, '256')
            },
            payerMessage: payerMessage,
            payeeNote: `Online Shop Uganda - ${externalId}`
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(MOMO_CONFIG.mtn.baseUrl).hostname,
                path: '/collection/v1_0/requesttopay',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': MOMO_CONFIG.mtn.environment,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.mtn.subscriptionKey,
                    'Content-Type': 'application/json',
                    'X-Callback-Url': MOMO_CONFIG.mtn.callbackUrl,
                    'Content-Length': Buffer.byteLength(payload)
                }
            };

            const req = https.request(options, (res) => {
                if (res.statusCode === 202) {
                    resolve({ success: true, referenceId, statusCode: res.statusCode });
                } else {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        reject(new Error(`MTN MoMo request failed: ${res.statusCode} - ${data}`));
                    });
                }
            });

            req.on('error', reject);
            req.write(payload);
            req.end();
        });
    } catch (error) {
        console.error('MTN MoMo payment error:', error);
        throw error;
    }
}

// Check MTN MoMo payment status
async function checkMTNPaymentStatus(referenceId) {
    if (!isMoMoConfigured) {
        // Simulation - always return successful
        return { status: 'SUCCESSFUL', simulated: true };
    }

    try {
        const accessToken = await getMTNAccessToken();
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(MOMO_CONFIG.mtn.baseUrl).hostname,
                path: `/collection/v1_0/requesttopay/${referenceId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Target-Environment': MOMO_CONFIG.mtn.environment,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.mtn.subscriptionKey
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Failed to parse MTN status response'));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    } catch (error) {
        console.error('MTN MoMo status check error:', error);
        throw error;
    }
}

// ==================== AIRTEL MONEY API INTEGRATION ====================

// Get Airtel Money access token
async function getAirtelAccessToken() {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            client_id: MOMO_CONFIG.airtel.clientId,
            client_secret: MOMO_CONFIG.airtel.clientSecret,
            grant_type: 'client_credentials'
        });

        const options = {
            hostname: new URL(MOMO_CONFIG.airtel.baseUrl).hostname,
            path: '/auth/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.access_token);
                } catch (e) {
                    reject(new Error('Failed to parse Airtel token response'));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

// Request payment from Airtel Money
async function requestAirtelPayment(amount, phoneNumber, externalId, payerMessage) {
    if (!isAirtelConfigured) {
        // Simulation mode
        return { success: true, simulated: true, transactionId: uuidv4() };
    }

    try {
        const accessToken = await getAirtelAccessToken();
        
        const payload = JSON.stringify({
            reference: externalId,
            subscriber: {
                country: MOMO_CONFIG.airtel.country,
                currency: MOMO_CONFIG.airtel.currency,
                msisdn: phoneNumber.replace(/\D/g, '').replace(/^0/, '')
            },
            transaction: {
                amount: amount,
                country: MOMO_CONFIG.airtel.country,
                currency: MOMO_CONFIG.airtel.currency,
                id: externalId
            }
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(MOMO_CONFIG.airtel.baseUrl).hostname,
                path: '/merchant/v1/payments/',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Country': MOMO_CONFIG.airtel.country,
                    'X-Currency': MOMO_CONFIG.airtel.currency,
                    'Content-Length': Buffer.byteLength(payload)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.status && response.status.success) {
                            resolve({ success: true, transactionId: response.data.transaction.id });
                        } else {
                            reject(new Error(`Airtel payment failed: ${response.status?.message || 'Unknown error'}`));
                        }
                    } catch (e) {
                        reject(new Error('Failed to parse Airtel response'));
                    }
                });
            });

            req.on('error', reject);
            req.write(payload);
            req.end();
        });
    } catch (error) {
        console.error('Airtel Money payment error:', error);
        throw error;
    }
}

// Check Airtel Money payment status
async function checkAirtelPaymentStatus(transactionId) {
    if (!isAirtelConfigured) {
        // Simulation - always return successful
        return { status: 'TS', simulated: true }; // TS = Transaction Successful
    }

    try {
        const accessToken = await getAirtelAccessToken();
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(MOMO_CONFIG.airtel.baseUrl).hostname,
                path: `/standard/v1/payments/${transactionId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Country': MOMO_CONFIG.airtel.country,
                    'X-Currency': MOMO_CONFIG.airtel.currency
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response.data?.transaction || response);
                    } catch (e) {
                        reject(new Error('Failed to parse Airtel status response'));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    } catch (error) {
        console.error('Airtel Money status check error:', error);
        throw error;
    }
}

// ==================== PAYMENT PROCESSING ====================

// Process mobile money payment request
async function processMobileMoneyPayment(payment) {
    const { paymentMethod, amount, phoneNumber, internalRef, type } = payment;
    const message = type === 'subscription' ? 'Online Shop Uganda Subscription' : 'Online Shop Uganda Featured Listing';
    
    try {
        if (paymentMethod === 'mtn_momo') {
            const result = await requestMTNPayment(amount, phoneNumber, internalRef, message);
            return { 
                success: true, 
                provider: 'mtn', 
                referenceId: result.referenceId,
                simulated: result.simulated || false
            };
        } else if (paymentMethod === 'airtel_money') {
            const result = await requestAirtelPayment(amount, phoneNumber, internalRef, message);
            return { 
                success: true, 
                provider: 'airtel', 
                transactionId: result.transactionId,
                simulated: result.simulated || false
            };
        } else {
            throw new Error('Unsupported payment method');
        }
    } catch (error) {
        console.error('Mobile money payment processing error:', error);
        return { success: false, error: error.message };
    }
}

// Initiate subscription payment
app.post('/api/payments/subscribe', async (req, res) => {
    try {
        const { userId, planId, paymentMethod, phoneNumber } = req.body;
        
        if (!userId || !planId || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get plan
        const plan = defaultPlans.find(p => p.id === planId);
        if (!plan) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        if (plan.price === 0) {
            // Free plan - activate directly
            if (useDB()) {
                await User.updateOne({ id: userId }, {
                    'subscription.plan': 'free',
                    'subscription.status': 'active',
                    'subscription.startDate': new Date(),
                    'subscription.endDate': null
                });
            } else {
                const userIndex = usersMemory.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    usersMemory[userIndex].subscription = {
                        plan: 'free',
                        status: 'active',
                        startDate: new Date(),
                        endDate: null
                    };
                }
            }
            return res.json({ success: true, message: 'Free plan activated!' });
        }

        // Validate phone number
        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ error: 'Valid phone number required for mobile money' });
        }

        // Create payment record
        const payment = {
            id: uuidv4(),
            userId,
            type: 'subscription',
            amount: plan.price,
            currency: 'UGX',
            paymentMethod,
            phoneNumber: phoneNumber || '',
            internalRef: generatePaymentRef(),
            status: 'pending',
            metadata: {
                planId,
                duration: plan.duration
            },
            createdAt: new Date()
        };

        if (useDB()) {
            await Payment.create(payment);
        } else {
            paymentsMemory.push(payment);
        }

        // Process mobile money payment
        const momoResult = await processMobileMoneyPayment(payment);
        
        if (momoResult.success) {
            // Update payment with provider reference
            const providerRef = momoResult.referenceId || momoResult.transactionId;
            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, { 
                    transactionRef: providerRef,
                    status: 'processing'
                });
            } else {
                const paymentIndex = paymentsMemory.findIndex(p => p.id === payment.id);
                if (paymentIndex !== -1) {
                    paymentsMemory[paymentIndex].transactionRef = providerRef;
                    paymentsMemory[paymentIndex].status = 'processing';
                }
            }

            res.json({
                success: true,
                payment: {
                    id: payment.id,
                    ref: payment.internalRef,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: 'processing',
                    simulated: momoResult.simulated
                },
                instructions: getPaymentInstructions(paymentMethod, payment.amount, payment.internalRef),
                message: momoResult.simulated 
                    ? 'Payment request sent (SIMULATION MODE - approve in your app)' 
                    : 'Payment request sent to your phone. Please approve in your mobile money app.'
            });
        } else {
            // Payment initiation failed
            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, { 
                    status: 'failed',
                    failureReason: momoResult.error,
                    failedAt: new Date()
                });
            }
            res.status(400).json({ error: momoResult.error || 'Payment initiation failed' });
        }
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Initiate featured listing payment
app.post('/api/payments/feature', async (req, res) => {
    try {
        const { userId, productId, boostLevel, paymentMethod, phoneNumber } = req.body;
        
        if (!userId || !productId || !boostLevel || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const pricing = featuredPrices[boostLevel];
        if (!pricing) {
            return res.status(400).json({ error: 'Invalid boost level' });
        }

        // Validate phone number
        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ error: 'Valid phone number required for mobile money' });
        }

        // Create payment record
        const payment = {
            id: uuidv4(),
            userId,
            type: 'featured_listing',
            amount: pricing.price,
            currency: 'UGX',
            paymentMethod,
            phoneNumber: phoneNumber || '',
            internalRef: generatePaymentRef(),
            status: 'pending',
            metadata: {
                productId,
                boostLevel,
                duration: pricing.duration
            },
            createdAt: new Date()
        };

        if (useDB()) {
            await Payment.create(payment);
        } else {
            paymentsMemory.push(payment);
        }

        // Process mobile money payment
        const momoResult = await processMobileMoneyPayment(payment);
        
        if (momoResult.success) {
            // Update payment with provider reference
            const providerRef = momoResult.referenceId || momoResult.transactionId;
            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, { 
                    transactionRef: providerRef,
                    status: 'processing'
                });
            } else {
                const paymentIndex = paymentsMemory.findIndex(p => p.id === payment.id);
                if (paymentIndex !== -1) {
                    paymentsMemory[paymentIndex].transactionRef = providerRef;
                    paymentsMemory[paymentIndex].status = 'processing';
                }
            }

            res.json({
                success: true,
                payment: {
                    id: payment.id,
                    ref: payment.internalRef,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: 'processing',
                    simulated: momoResult.simulated
                },
                instructions: getPaymentInstructions(paymentMethod, payment.amount, payment.internalRef),
                message: momoResult.simulated 
                    ? 'Payment request sent (SIMULATION MODE - approve in your app)' 
                    : 'Payment request sent to your phone. Please approve in your mobile money app.'
            });
        } else {
            // Payment initiation failed
            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, { 
                    status: 'failed',
                    failureReason: momoResult.error,
                    failedAt: new Date()
                });
            }
            res.status(400).json({ error: momoResult.error || 'Payment initiation failed' });
        }
    } catch (error) {
        console.error('Feature payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get payment instructions for mobile money
function getPaymentInstructions(method, amount, ref) {
    const formattedAmount = amount.toLocaleString('en-UG');
    
    if (method === 'mtn_momo') {
        return {
            steps: [
                'Dial *165# on your MTN line',
                'Select "Payments"',
                'Select "Pay Bill"',
                'Enter Merchant Code: 123456',
                `Enter Amount: ${formattedAmount} UGX`,
                `Enter Reference: ${ref}`,
                'Confirm with your PIN'
            ],
            shortCode: '*165#',
            merchantCode: '123456',
            reference: ref,
            note: 'You will receive a confirmation SMS once payment is complete'
        };
    } else if (method === 'airtel_money') {
        return {
            steps: [
                'Dial *185# on your Airtel line',
                'Select "Make Payments"',
                'Select "Pay Bill"',
                'Enter Merchant Code: 654321',
                `Enter Amount: ${formattedAmount} UGX`,
                `Enter Reference: ${ref}`,
                'Confirm with your PIN'
            ],
            shortCode: '*185#',
            merchantCode: '654321',
            reference: ref,
            note: 'You will receive a confirmation SMS once payment is complete'
        };
    }
    
    return { steps: ['Contact support for payment instructions'] };
}

// Check payment status
app.get('/api/payments/:paymentId/status', async (req, res) => {
    try {
        let payment;
        if (useDB()) {
            payment = await Payment.findOne({ id: req.params.paymentId });
        } else {
            payment = paymentsMemory.find(p => p.id === req.params.paymentId);
        }
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            id: payment.id,
            ref: payment.internalRef,
            status: payment.status,
            amount: payment.amount,
            type: payment.type
        });
    } catch (error) {
        console.error('Check payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Confirm payment (webhook simulation - in production this would be called by payment provider)
app.post('/api/payments/:paymentId/confirm', async (req, res) => {
    try {
        const { transactionRef } = req.body;
        
        let payment;
        if (useDB()) {
            payment = await Payment.findOne({ id: req.params.paymentId });
        } else {
            payment = paymentsMemory.find(p => p.id === req.params.paymentId);
        }
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status === 'completed') {
            return res.json({ success: true, message: 'Payment already confirmed' });
        }

        // Update payment status
        const updates = {
            status: 'completed',
            transactionRef: transactionRef || 'MANUAL-' + Date.now(),
            completedAt: new Date()
        };

        if (useDB()) {
            await Payment.updateOne({ id: payment.id }, updates);
        } else {
            Object.assign(payment, updates);
        }

        // Process the payment based on type
        if (payment.type === 'subscription') {
            await activateSubscription(payment.userId, payment.metadata.planId, payment.metadata.duration);
        } else if (payment.type === 'featured_listing') {
            await activateFeaturedListing(payment);
        }

        res.json({ success: true, message: 'Payment confirmed and benefits activated!' });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Activate subscription helper
async function activateSubscription(userId, planId, duration) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const subscriptionUpdate = {
        'subscription.plan': planId,
        'subscription.status': 'active',
        'subscription.startDate': startDate,
        'subscription.endDate': endDate
    };

    if (useDB()) {
        await User.updateOne({ id: userId }, subscriptionUpdate);
    } else {
        const userIndex = usersMemory.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            usersMemory[userIndex].subscription = {
                plan: planId,
                status: 'active',
                startDate,
                endDate
            };
        }
    }
}

// Activate featured listing helper
async function activateFeaturedListing(payment) {
    const { productId, boostLevel, duration } = payment.metadata;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const featured = {
        id: uuidv4(),
        productId,
        sellerId: payment.userId,
        paymentId: payment.id,
        boostLevel,
        price: payment.amount,
        startDate,
        endDate,
        status: 'active',
        impressions: 0,
        clicks: 0,
        createdAt: new Date()
    };

    // Update product
    const productUpdate = {
        isFeatured: true,
        featuredUntil: endDate,
        featuredAt: startDate,
        boostLevel
    };

    if (useDB()) {
        await FeaturedListing.create(featured);
        await Product.updateOne({ id: productId }, productUpdate);
        await User.updateOne({ id: payment.userId }, { $inc: { featuredListingsUsed: 1 } });
    } else {
        featuredListingsMemory.push(featured);
        const productIndex = productsMemory.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            Object.assign(productsMemory[productIndex], productUpdate);
        }
        const userIndex = usersMemory.findIndex(u => u.id === payment.userId);
        if (userIndex !== -1) {
            usersMemory[userIndex].featuredListingsUsed = (usersMemory[userIndex].featuredListingsUsed || 0) + 1;
        }
    }
}

// Get user's payment history
app.get('/api/payments/user/:userId', async (req, res) => {
    try {
        let payments;
        if (useDB()) {
            payments = await Payment.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        } else {
            payments = paymentsMemory.filter(p => p.userId === req.params.userId);
        }
        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== MOBILE MONEY WEBHOOKS ====================

// MTN MoMo callback webhook
app.post('/api/payments/mtn/callback', async (req, res) => {
    try {
        console.log('MTN MoMo callback received:', JSON.stringify(req.body, null, 2));
        
        const { externalId, status, financialTransactionId } = req.body;
        
        if (!externalId) {
            return res.status(400).json({ error: 'Missing externalId' });
        }

        // Find payment by reference
        let payment;
        if (useDB()) {
            payment = await Payment.findOne({ internalRef: externalId });
        } else {
            payment = paymentsMemory.find(p => p.internalRef === externalId);
        }
        
        if (!payment) {
            console.log('Payment not found for MTN callback:', externalId);
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status === 'completed') {
            return res.json({ success: true, message: 'Already processed' });
        }

        // Process based on status
        if (status === 'SUCCESSFUL') {
            // Update payment status
            const updates = {
                status: 'completed',
                transactionRef: financialTransactionId || externalId,
                completedAt: new Date()
            };

            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, updates);
            } else {
                Object.assign(payment, updates);
            }

            // Activate benefits
            if (payment.type === 'subscription') {
                await activateSubscription(payment.userId, payment.metadata.planId, payment.metadata.duration);
            } else if (payment.type === 'featured_listing') {
                await activateFeaturedListing(payment);
            }

            console.log('MTN payment completed:', payment.id);
        } else if (status === 'FAILED') {
            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, { 
                    status: 'failed', 
                    failureReason: 'Transaction failed',
                    failedAt: new Date()
                });
            } else {
                payment.status = 'failed';
                payment.failureReason = 'Transaction failed';
                payment.failedAt = new Date();
            }
            console.log('MTN payment failed:', payment.id);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('MTN callback error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Airtel Money callback webhook
app.post('/api/payments/airtel/callback', async (req, res) => {
    try {
        console.log('Airtel callback received:', JSON.stringify(req.body, null, 2));
        
        const { transaction } = req.body;
        
        if (!transaction || !transaction.id) {
            return res.status(400).json({ error: 'Missing transaction data' });
        }

        // Find payment by transaction reference or internal reference
        let payment;
        if (useDB()) {
            payment = await Payment.findOne({ 
                $or: [
                    { transactionRef: transaction.id },
                    { internalRef: transaction.id }
                ]
            });
        } else {
            payment = paymentsMemory.find(p => 
                p.transactionRef === transaction.id || p.internalRef === transaction.id
            );
        }
        
        if (!payment) {
            console.log('Payment not found for Airtel callback:', transaction.id);
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status === 'completed') {
            return res.json({ success: true, message: 'Already processed' });
        }

        const airtelStatus = transaction.status_code || transaction.status;
        
        // TS = Transaction Successful, TF = Transaction Failed, TP = Transaction Pending
        if (airtelStatus === 'TS' || airtelStatus === 'SUCCESSFUL') {
            const updates = {
                status: 'completed',
                transactionRef: transaction.airtel_money_id || transaction.id,
                completedAt: new Date()
            };

            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, updates);
            } else {
                Object.assign(payment, updates);
            }

            // Activate benefits
            if (payment.type === 'subscription') {
                await activateSubscription(payment.userId, payment.metadata.planId, payment.metadata.duration);
            } else if (payment.type === 'featured_listing') {
                await activateFeaturedListing(payment);
            }

            console.log('Airtel payment completed:', payment.id);
        } else if (airtelStatus === 'TF' || airtelStatus === 'FAILED') {
            if (useDB()) {
                await Payment.updateOne({ id: payment.id }, { 
                    status: 'failed', 
                    failureReason: transaction.message || 'Transaction failed',
                    failedAt: new Date()
                });
            } else {
                payment.status = 'failed';
                payment.failureReason = transaction.message || 'Transaction failed';
                payment.failedAt = new Date();
            }
            console.log('Airtel payment failed:', payment.id);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Airtel callback error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Poll payment status from provider (for checking from frontend)
app.get('/api/payments/:paymentId/poll', async (req, res) => {
    try {
        let payment;
        if (useDB()) {
            payment = await Payment.findOne({ id: req.params.paymentId });
        } else {
            payment = paymentsMemory.find(p => p.id === req.params.paymentId);
        }
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // If already completed or failed, return current status
        if (payment.status === 'completed' || payment.status === 'failed') {
            return res.json({
                id: payment.id,
                status: payment.status,
                message: payment.status === 'completed' ? 'Payment successful!' : 'Payment failed'
            });
        }

        // Check with provider if payment is processing
        if (payment.status === 'processing' && payment.transactionRef) {
            try {
                let providerStatus;
                
                if (payment.paymentMethod === 'mtn_momo') {
                    providerStatus = await checkMTNPaymentStatus(payment.transactionRef);
                    
                    if (providerStatus.status === 'SUCCESSFUL' || providerStatus.simulated) {
                        // Mark as completed
                        const updates = {
                            status: 'completed',
                            completedAt: new Date()
                        };
                        
                        if (useDB()) {
                            await Payment.updateOne({ id: payment.id }, updates);
                        } else {
                            Object.assign(payment, updates);
                        }
                        
                        // Activate benefits
                        if (payment.type === 'subscription') {
                            await activateSubscription(payment.userId, payment.metadata.planId, payment.metadata.duration);
                        } else if (payment.type === 'featured_listing') {
                            await activateFeaturedListing(payment);
                        }
                        
                        return res.json({
                            id: payment.id,
                            status: 'completed',
                            message: 'Payment successful! Your benefits have been activated.'
                        });
                    } else if (providerStatus.status === 'FAILED') {
                        if (useDB()) {
                            await Payment.updateOne({ id: payment.id }, { status: 'failed', failedAt: new Date() });
                        } else {
                            payment.status = 'failed';
                        }
                        return res.json({
                            id: payment.id,
                            status: 'failed',
                            message: 'Payment was declined or failed'
                        });
                    }
                } else if (payment.paymentMethod === 'airtel_money') {
                    providerStatus = await checkAirtelPaymentStatus(payment.transactionRef);
                    
                    const airtelStatus = providerStatus.status || providerStatus.status_code;
                    
                    if (airtelStatus === 'TS' || providerStatus.simulated) {
                        const updates = {
                            status: 'completed',
                            completedAt: new Date()
                        };
                        
                        if (useDB()) {
                            await Payment.updateOne({ id: payment.id }, updates);
                        } else {
                            Object.assign(payment, updates);
                        }
                        
                        // Activate benefits
                        if (payment.type === 'subscription') {
                            await activateSubscription(payment.userId, payment.metadata.planId, payment.metadata.duration);
                        } else if (payment.type === 'featured_listing') {
                            await activateFeaturedListing(payment);
                        }
                        
                        return res.json({
                            id: payment.id,
                            status: 'completed',
                            message: 'Payment successful! Your benefits have been activated.'
                        });
                    } else if (airtelStatus === 'TF') {
                        if (useDB()) {
                            await Payment.updateOne({ id: payment.id }, { status: 'failed', failedAt: new Date() });
                        } else {
                            payment.status = 'failed';
                        }
                        return res.json({
                            id: payment.id,
                            status: 'failed',
                            message: 'Payment was declined or failed'
                        });
                    }
                }
            } catch (pollError) {
                console.error('Error polling payment status:', pollError);
                // Continue to return processing status
            }
        }

        // Still processing
        res.json({
            id: payment.id,
            status: payment.status,
            message: 'Waiting for payment confirmation...'
        });
    } catch (error) {
        console.error('Poll payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Manual payment simulation (for testing in sandbox mode)
app.post('/api/payments/:paymentId/simulate-success', async (req, res) => {
    try {
        let payment;
        if (useDB()) {
            payment = await Payment.findOne({ id: req.params.paymentId });
        } else {
            payment = paymentsMemory.find(p => p.id === req.params.paymentId);
        }
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status === 'completed') {
            return res.json({ success: true, message: 'Payment already completed' });
        }

        // Simulate successful payment
        const updates = {
            status: 'completed',
            transactionRef: 'SIM-' + Date.now(),
            completedAt: new Date()
        };

        if (useDB()) {
            await Payment.updateOne({ id: payment.id }, updates);
        } else {
            Object.assign(payment, updates);
        }

        // Activate benefits
        if (payment.type === 'subscription') {
            await activateSubscription(payment.userId, payment.metadata.planId, payment.metadata.duration);
        } else if (payment.type === 'featured_listing') {
            await activateFeaturedListing(payment);
        }

        res.json({ 
            success: true, 
            message: 'Payment simulated successfully! Benefits activated.' 
        });
    } catch (error) {
        console.error('Simulate payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== FEATURED LISTINGS ====================

// Get all featured products (for homepage display)
app.get('/api/products/featured', async (req, res) => {
    try {
        const now = new Date();
        let featuredProducts;
        
        if (useDB()) {
            featuredProducts = await Product.find({
                isFeatured: true,
                featuredUntil: { $gt: now },
                status: 'available'
            }).sort({ boostLevel: -1, featuredAt: -1 });
        } else {
            featuredProducts = productsMemory.filter(p => 
                p.isFeatured && 
                p.featuredUntil && 
                new Date(p.featuredUntil) > now &&
                p.status === 'available'
            ).sort((a, b) => {
                const levels = { spotlight: 3, premium: 2, basic: 1, none: 0 };
                return (levels[b.boostLevel] || 0) - (levels[a.boostLevel] || 0);
            });
        }
        
        res.json(featuredProducts);
    } catch (error) {
        console.error('Get featured error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Platform revenue stats
app.get('/api/admin/revenue', async (req, res) => {
    try {
        let completedPayments;
        if (useDB()) {
            completedPayments = await Payment.find({ status: 'completed' });
        } else {
            completedPayments = paymentsMemory.filter(p => p.status === 'completed');
        }
        
        const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const subscriptionRevenue = completedPayments.filter(p => p.type === 'subscription').reduce((sum, p) => sum + p.amount, 0);
        const featuredRevenue = completedPayments.filter(p => p.type === 'featured_listing').reduce((sum, p) => sum + p.amount, 0);
        
        res.json({
            totalRevenue,
            subscriptionRevenue,
            featuredRevenue,
            totalTransactions: completedPayments.length,
            currency: 'UGX'
        });
    } catch (error) {
        console.error('Revenue stats error:', error);
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
