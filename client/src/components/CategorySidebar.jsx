import React from "react";
import "./CategorySidebar.css";

const categories = [
  "Mobile Phones",
  "Laptops",
  "Tablets",
  "Sound Systems",
  "Gaming",
  "Home Appliances",
  "Repair",
  "Accessories",
  "Drones",
  "Television Sets",
  "Refrigerators",
  "Cameras",
  // ...add more as needed
];

const CategorySidebar = () => (
  <aside className="category-sidebar">
    <div className="sidebar-title">CATEGORIES</div>
    <ul className="category-list">
      {categories.map((cat, idx) => (
        <li key={idx} className="category-item">{cat}</li>
      ))}
    </ul>
  </aside>
);

export default CategorySidebar;