import { useState } from "react";
import './App.css';
import ProductGrid from "./components/ProductGrid";
import "./components/ProductGrid.css";
import TopNavBar from "./components/TopNavBar";
import "./components/TopNavBar.css";
import CategorySidebar from "./components/CategorySidebar";
import "./components/CategorySidebar.css";
import TabsFilter from "./components/TabsFilter";
import "./components/TabsFilter.css";
import CarouselBanner from "./components/CarouselBanner";
import "./components/CarouselBanner.css";
import CurrencySwitcher from "./components/CurrencySwitcher";
import "./components/CurrencySwitcher.css";
import ReviewsSection from "./components/ReviewsSection";
import "./components/ReviewsSection.css";

// Example product data (replace with real data or fetch from API)
const allProducts = [
  {
    badge: "Brand New",
    badgeType: "default",
    views: 353,
    image: "https://dummyimage.com/100x100/ffd600/fff&text=Galaxy+A15",
    title: "Galaxy A15 4GB RAM 128GB ROM 5000MAH BATTERY 6.5 INCHES HD...",
    price: 580000,
    oldPrice: null,
    discount: null,
    stars: 5,
    guarantee: "24 months guarantee on brand new products",
    brand: "Samsung"
  },
  {
    badge: "Brand New",
    badgeType: "default",
    views: 2700,
    image: "https://dummyimage.com/100x100/007bff/fff&text=Galaxy+A17",
    title: "SAMSUNG GALAXY A17 8GB RAM 256GB ROM, 5000mAh BATTERY",
    price: 790340,
    oldPrice: 860000,
    discount: 8.1,
    stars: 5,
    guarantee: "24 months guarantee on brand new products",
    brand: "Samsung"
  },
  {
    badge: null,
    badgeType: null,
    views: 47,
    image: "https://dummyimage.com/100x100/eee/fff&text=MagSafe",
    title: "IPHONE AIR MAGSAFE BATTERY PACK",
    price: 550000,
    oldPrice: null,
    discount: null,
    stars: 5,
    guarantee: "Warranty protection policy applies for all Uk-used products",
    brand: "Apple"
  },
  {
    badge: "Brand New",
    badgeType: "default",
    views: 118,
    image: "https://dummyimage.com/100x100/222/fff&text=PS5+MWF",
    title: "CALL OF DUTY - MODERN WARFARE PS5",
    price: 330000,
    oldPrice: null,
    discount: null,
    stars: 5,
    guarantee: "24 months guarantee on brand new products",
    brand: "PS Games"
  },
  {
    badge: null,
    badgeType: null,
    views: 12,
    image: "https://dummyimage.com/100x100/aaa/fff&text=Hisense+Fridge",
    title: "HISENSE 195 LITRES SINGLE DOOR FRIDGE",
    price: 780900,
    oldPrice: 950000,
    discount: 17.8,
    stars: 5,
    guarantee: "Warranty protection policy applies for all Uk-used products",
    brand: "Hisense Appliances"
  },
  // ...add more products as needed
];

function App() {
  const [selectedTab, setSelectedTab] = useState("All");
  const [currency, setCurrency] = useState("UGX");
  // Filter products by selected tab/brand
  const products = selectedTab === "All"
    ? allProducts
    : allProducts.filter(p => (p.brand || "").toLowerCase() === selectedTab.toLowerCase());

  return (
    <div className="App" style={{ background: '#f5f6fa', minHeight: '100vh' }}>
      <TopNavBar />
      <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 1400, margin: '0 auto' }}>
        <CategorySidebar />
        <main style={{ flex: 1, padding: '24px 24px 0 0' }}>
          <TabsFilter selected={selectedTab} onSelect={setSelectedTab} />
          <CurrencySwitcher selected={currency} onSelect={setCurrency} />
          <CarouselBanner />
          <ProductGrid products={products} />
          <ReviewsSection />
        </main>
      </div>
    </div>
  );
}

export default App;
