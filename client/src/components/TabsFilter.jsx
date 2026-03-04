import React from "react";
import "./TabsFilter.css";

const tabs = [
  "All",
  "Nike",
  "Adidas",
  "Gucci",
  "Zara",
  "H&M",
  "Puma",
  "Levi's",
  "Calvin Klein",
  "Tommy Hilfiger",
  "Ralph Lauren",
  "Under Armour",
  "New Balance",
  "Versace",
  "Balenciaga",
];

const TabsFilter = ({ selected, onSelect }) => (
  <div className="tabs-filter-wrapper">
    <div className="tabs-filter">
      {tabs.map((tab, idx) => (
        <button
          key={idx}
          className={selected === tab ? "tab active" : "tab"}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>
);

export default TabsFilter;