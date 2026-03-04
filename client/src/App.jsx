import { useState, useEffect } from "react";
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
import CategoryIcons from "./components/CategoryIcons";
import "./components/CategoryIcons.css";
import ReviewsSection from "./components/ReviewsSection";
import "./components/ReviewsSection.css";
import BottomNavBar from "./components/BottomNavBar";
import "./components/BottomNavBar.css";
import AddProductForm from "./components/AddProductForm";


function App() {
  const [selectedTab, setSelectedTab] = useState("All");
  const [currency, setCurrency] = useState("UGX");
  const [products, setProducts] = useState([]);

  // Fetch products from backend
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  // Filter products by selected tab/brand
  const filteredProducts = selectedTab === "All"
    ? products
    : products.filter(p => (p.brand || "").toLowerCase() === selectedTab.toLowerCase());

  return (
    <div className="App">
      {/* Top Navigation */}
      <TopNavBar />
      
      {/* Brand Tabs */}
      <TabsFilter selected={selectedTab} onSelect={setSelectedTab} />
      
      {/* Main Content Area with Sidebar */}
      <div className="main-layout">
        <CategorySidebar />
        
        <div className="content-area">
          {/* Carousel Banner */}
          <CarouselBanner />
          
          {/* Category Icons Row */}
          <CategoryIcons />
          
          {/* Product Grid */}
          <ProductGrid products={filteredProducts} />
        </div>
      </div>
      
      {/* Reviews Section */}
      <ReviewsSection />
      
      {/* Currency Switcher (floating) */}
      <CurrencySwitcher selected={currency} onSelect={setCurrency} />
      
      {/* Add Product Form (for admin) */}
      <AddProductForm onAdd={prod => setProducts(p => [prod, ...p])} />
      
      {/* Bottom Navigation (mobile) */}
      <BottomNavBar />
    </div>
  );
}

export default App;
