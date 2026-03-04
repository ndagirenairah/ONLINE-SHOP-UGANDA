import React, { useState } from "react";
import "./CategorySidebar.css";

const categories = [
  { name: "MEN'S WEAR", icon: "👔", hasSubmenu: true, submenu: ["T-Shirts", "Shirts", "Trousers", "Jeans", "Suits", "Jackets"] },
  { name: "WOMEN'S WEAR", icon: "👗", hasSubmenu: true, submenu: ["Dresses", "Blouses", "Skirts", "Trousers", "Knitwear"] },
  { name: "CHILDREN'S WEAR", icon: "🧒", hasSubmenu: true, submenu: ["Boys", "Girls", "Baby Wear", "School Uniforms"] },
  { name: "FOOTWEAR", icon: "👟", hasSubmenu: true, submenu: ["Sneakers", "Formal Shoes", "Sandals", "Heels", "Boots"] },
  { name: "ACCESSORIES", icon: "👜", hasSubmenu: false },
  { name: "BAGS & LUGGAGE", icon: "🎒", hasSubmenu: false },
  { name: "SPORTSWEAR", icon: "🏃", hasSubmenu: false },
  { name: "TRADITIONAL WEAR", icon: "🪭", hasSubmenu: false },
  { name: "UNDERWEAR & SLEEPWEAR", icon: "👙", hasSubmenu: false },
  { name: "WATCHES & JEWELRY", icon: "⌚", hasSubmenu: false },
  { name: "HATS & CAPS", icon: "🧢", hasSubmenu: false },
  { name: "BELTS & WALLETS", icon: "👛", hasSubmenu: false },
];

const CategorySidebar = ({ onSelectCategory }) => {
  const [expanded, setExpanded] = useState(null);

  return (
    <aside className="category-sidebar">
      <div className="sidebar-title">
        <span className="home-icon">🏠</span> CATEGORIES
      </div>
      <ul className="category-list">
        {categories.map((cat, idx) => (
          <li key={idx} className="category-item-wrapper">
            <div 
              className={`category-item ${expanded === idx ? 'expanded' : ''}`}
              onClick={() => {
                if (cat.hasSubmenu) {
                  setExpanded(expanded === idx ? null : idx);
                }
                if (onSelectCategory) onSelectCategory(cat.name);
              }}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
              {cat.hasSubmenu && <span className="cat-arrow">{expanded === idx ? '▼' : '▶'}</span>}
            </div>
            {cat.hasSubmenu && expanded === idx && (
              <ul className="submenu">
                {cat.submenu.map((sub, subIdx) => (
                  <li key={subIdx} className="submenu-item" onClick={() => onSelectCategory && onSelectCategory(sub)}>
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default CategorySidebar;