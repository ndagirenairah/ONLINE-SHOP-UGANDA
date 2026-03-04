import React from "react";
import "./TopNavBar.css";

const TopNavBar = () => (
  <header className="top-navbar">
    <div className="navbar-top">
      <div className="logo">
        <span className="logo-icon">👗</span>
        <span className="logo-text">Fashion<b>Shop</b><span className="logo-ug">.ug</span></span>
      </div>
      
      <div className="search-container">
        <input 
          className="search-input" 
          placeholder="Search for clothing, shoes, accessories..." 
        />
        <button className="search-btn">🔍</button>
      </div>
      
      <div className="navbar-actions">
        <div className="action-item">
          <span className="action-icon">👤</span>
          <span className="action-text">Account</span>
        </div>
        <div className="action-item">
          <span className="action-icon">❤️</span>
          <span className="action-text">Wishlist</span>
        </div>
        <div className="action-item cart-item">
          <span className="action-icon">🛒</span>
          <span className="action-text">Cart</span>
          <span className="cart-badge">0</span>
        </div>
      </div>
    </div>
  </header>
);

export default TopNavBar;