import React from "react";
import "./HeroSection.css";

const HeroSection = () => (
  <section className="hero-section">
    <div className="hero-overlay">
      <div className="hero-content">
        <div className="hero-badge">Uganda's #1 Fashion Marketplace</div>
        <h1 className="hero-title">Discover Amazing <span>Fashion Deals</span> ✨</h1>
        <p className="hero-desc">
          Buy and sell clothes, shoes, bags, and accessories. Join thousands of Ugandans trading fashion on Online Shop Uganda – your style, your price!
        </p>
        <div className="hero-buttons">
          <button className="hero-btn hero-btn-white">🔍 Browse Items</button>
          <button className="hero-btn hero-btn-orange">+ Sell Your Clothes</button>
        </div>
      </div>
      <div className="hero-image-block">
        <div className="hero-main-img">
          <img src="https://dummyimage.com/220x260/fa8231/fff&text=New+Arrivals" alt="New Arrivals" />
          <div className="hero-img-label">New Arrivals</div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;