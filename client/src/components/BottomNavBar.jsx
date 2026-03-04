import React from "react";
import "./BottomNavBar.css";

const navItems = [
  { icon: "🏠", label: "Home" },
  { icon: "📂", label: "Categories" },
  { icon: "🛒", label: "Cart", badge: 2 },
  { icon: "❤", label: "Wishlist" },
  { icon: "👤", label: "Account", badge: 2 },
];

const BottomNavBar = () => (
  <nav className="bottom-nav-bar">
    {navItems.map((item, idx) => (
      <div className="nav-item" key={idx}>
        <span className="nav-icon">{item.icon}</span>
        {item.badge && <span className="nav-badge">{item.badge}</span>}
        <span className="nav-label">{item.label}</span>
      </div>
    ))}
  </nav>
);

export default BottomNavBar;