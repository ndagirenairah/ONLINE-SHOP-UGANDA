# 🇺🇬 ONLINE-SHOP-UGANDA - Uganda's Fashion Marketplace

<div align="center">

<img src="https://images.pexels.com/photos/3738088/pexels-photo-3738088.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop" alt="African Woman Sewing on Machine" width="800"/>

### 👗 **Handcrafted Fashion Made in Uganda** 🧵

*Empowering local tailors and fashion entrepreneurs across Uganda*

</div>

---

> **🛒 Buy and sell clothes, shoes, and accessories in Uganda!**

ONLINE-SHOP-UGANDA is a modern online fashion marketplace designed specifically for Uganda. Inspired by platforms like Jumia, it allows anyone to list and sell their fashion items, from dresses to shoes to traditional wear.

---

## ✨ Features

### For Sellers 👗
- ✅ Free account registration
- ✅ Post items with multiple photos
- ✅ Set your own prices
- ✅ Manage your listings
- ✅ Direct contact via WhatsApp & Phone

### For Buyers 🛒
- ✅ Browse latest fashion items
- ✅ Search by name or keyword
- ✅ Filter by category, size, condition, price
- ✅ View detailed product information
- ✅ Contact sellers directly via WhatsApp
- ✅ Request delivery

### Categories
- 👗 Dresses
- 👔 Shirts & Tops
- 👖 Pants & Jeans
- 👟 Shoes
- 🧥 Jackets & Coats
- 👜 Accessories
- 🥻 Traditional Wear (Gomesi, Kanzu)
- 🏃 Sportswear
- 👶 Kids Fashion
- 🛍️ Other

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Cloudinary account (free) for image uploads

### Installation

1. **Clone or navigate to the project:**
   ```bash
   cd ONLINE-SHOP-UGANDA
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Cloudinary credentials from [cloudinary.com/console](https://cloudinary.com/console)

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Development Mode
```bash
npm run dev
```
This uses nodemon for auto-reload on file changes.

### Image Uploads
- With Cloudinary configured: Images are uploaded to Cloudinary CDN
- Without Cloudinary: Images are stored as base64 data URLs (works but not recommended for production)

---

## 📁 Project Structure

```
ONLINE-SHOP-UGANDA/
├── public/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── style.css       # All styling
│   └── js/
│       └── app.js          # Frontend JavaScript
├── data/
│   ├── users.json          # User database
│   └── products.json       # Products database
├── uploads/                 # Uploaded images
├── server.js               # Express backend
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/user/:id` | Get user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (with filters) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/sellers/:id/products` | Get seller's products |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/stats` | Get platform statistics |

---

## 🎨 Customization

### Colors
Edit CSS variables in `public/css/style.css`:

```css
:root {
    --primary: #ff6b35;      /* Main brand color */
    --secondary: #2d3436;    /* Dark text */
    --accent: #00b894;       /* Success/accent */
    --whatsapp: #25D366;     /* WhatsApp green */
}
```

### Adding Categories
Edit the categories array in `server.js`:

```javascript
const categories = [
    { id: 'dresses', name: 'Dresses', icon: '👗' },
    // Add more...
];
```

---

## ️ Roadmap

- [ ] User profile page with avatar upload
- [ ] Wishlist/favorites functionality
- [ ] In-app messaging
- [ ] Delivery integration with Safeboda
- [ ] Mobile app (React Native)
- [ ] Payment integration (MTN Mobile Money, Airtel Money)
- [ ] Admin dashboard
- [ ] Email notifications

---

## 💰 Business Model Ideas

1. **Freemium** - Free basic listings, paid featured posts
2. **Commission** - Take 5-10% on successful sales
3. **Advertising** - Fashion brand promotions
4. **Premium Seller** - Monthly subscription for shops
5. **Delivery Fees** - Partner with delivery services

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

## 📞 Contact

For questions or support:
- 📧 Email: info@onlineshopuganda.me
- 💬 WhatsApp: +256 700 518 006

---

**Made with ❤️ in Uganda 🇺🇬**

---

## Reference Sites

- [Jumia Uganda](https://www.jumia.ug/) - For inspiration
- [Jumia Uganda Social Links](https://linktr.ee/JumiaUG)
