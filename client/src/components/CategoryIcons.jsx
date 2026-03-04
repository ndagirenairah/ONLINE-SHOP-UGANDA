import React from "react";
import "./CategoryIcons.css";

const categoryIcons = [
  { icon: "👔", label: "Men's Wear" },
  { icon: "👗", label: "Women's Wear" },
  { icon: "🧒", label: "Kids' Wear" },
  { icon: "👟", label: "Footwear" },
  { icon: "👜", label: "Bags" },
  { icon: "⌚", label: "Watches" },
  { icon: "🧢", label: "Hats & Caps" },
  { icon: "🏃", label: "Sportswear" },
  { icon: "👙", label: "Underwear" },
  { icon: "🪭", label: "Traditional" },
];

const CategoryIcons = ({ onSelect }) => (
  <div className="category-icons-row">
    {categoryIcons.map((cat, idx) => (
      <div 
        key={idx} 
        className="category-icon-item"
        onClick={() => onSelect && onSelect(cat.label)}
      >
        <div className="category-icon-circle">
          <span className="category-emoji">{cat.icon}</span>
        </div>
        <span className="category-icon-label">{cat.label}</span>
      </div>
    ))}
  </div>
);

export default CategoryIcons;
