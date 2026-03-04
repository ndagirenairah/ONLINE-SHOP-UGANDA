import React from "react";
import "./HeroSection.css";

const HeroSection = () => (
  <section className="hero-section">
    <div className="hero-overlay">
      <div className="hero-content">
        <div className="hero-badge">Uganda's #1 Fashion Marketplace</div>
        <h1 className="hero-title">Discover Amazing <span>Fashion</span></h1>
        <p className="hero-desc">
          Buy and sell clothes, shoes, bags, and accessories. Join thousands of Ugandans trading fashion on Online Shop Uganda.
        </p>
        <div className="hero-buttons">
          <button className="hero-btn hero-btn-white">Browse Items</button>
          <button className="hero-btn hero-btn-orange">Sell Your Clothes</button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-number">1000+</div>
            <div className="hero-stat-label">Items Listed</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">500+</div>
            <div className="hero-stat-label">Active Sellers</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">2000+</div>
            <div className="hero-stat-label">Happy Buyers</div>
          </div>
        </div>
      </div>
      <div className="hero-image-block">
        <div className="hero-main-img">
          <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&h=380&fit=crop" alt="Fashion" />
          <div className="hero-img-label">New Arrivals</div>
        </div>
        <div className="hero-side-imgs">
          <div className="hero-side-img">
            <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&h=100&fit=crop" alt="Dresses" />
            <div className="hero-img-label">Dresses</div>
          </div>
          <div className="hero-side-img">
            <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop" alt="Bags" />
            <div className="hero-img-label">Bags</div>
          </div>
          <div className="hero-side-img">
            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop" alt="Shoes" />
            <div className="hero-img-label">Shoes</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;